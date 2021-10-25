/* eslint-disable no-ex-assign */
const _defaults = require('lodash/defaults');
const _pick = require('lodash/pick');
const _isEqual = require('lodash/isEqual');

const HomieProperty = require('./../../Property');
const X = require('./../../utils/X');
const { UNKNOWN_ERROR } = require('./../../utils/errors');
const BasePropertyTransport = require('./transport');
const BaseParser = require('./../Parser');
const BaseEntityBridge = require('./../Entity');

const ATTRS = [ 'name', 'dataType', 'retained', 'settable', 'unit', 'format' ];

class BasePropertyBridge extends BaseEntityBridge {
    /*
    config = {
        id,
        name     : `${type[0].toUpperCase() + type.slice(1)} Bridge(${id})`,
        retained : retained ? 'true' : 'false',
        settable : settable ? 'true' : 'false',
        dataType
    }
    provide either homie or mqttConnection
    type on of 'sensor', 'option', 'telemetry'
    */
    constructor(config, { type, transport, parser, debug, ...options }) {
        // creating homie entity~
        if (!transport) transport = new BasePropertyTransport({ type: 'static', data: config.value, debug });
        if (!parser) parser = new BaseParser({ type: 'raw', homieDataType: config.dataType || 'string' });

        const id = config.id;
        let { retained, settable } = config;

        retained = (retained === true || retained === 'true' || retained === undefined);
        settable = (settable === true || settable === 'true');

        const homieProperty = (config instanceof HomieProperty) ? config : new HomieProperty({ id });

        switch (type) {
            case 'sensor':
                homieProperty._eventPrefix = '';
                break;
            case 'option':
                homieProperty._eventPrefix = 'options';
                break;
            case 'telemetry':
                homieProperty._eventPrefix = 'telemetry';
                break;
            default:
                throw new Error(`Unsupported type '${type}'`);
        }

        homieProperty.updateAttribute(_defaults(_pick(config, 'name', 'dataType', 'format', 'unit'), {
            name     : `${type[0].toUpperCase() + type.slice(1)} Bridge(${id})`,
            retained : retained ? 'true' : 'false',
            settable : settable ? 'true' : 'false',
            dataType : parser.homieDataType
        }));

        homieProperty.validateMyStructure();

        // ~creating homie entity

        super(homieProperty, { debug, ...options });

        if (homieProperty.value) this.lastValue = homieProperty.value;

        this.attributes = ATTRS;

        // because we want to use boolean fields as boolean
        this.retained = retained;
        this.settable = settable;
        this.type = type;
        this.parser = parser;
        // bindind handlers~
        this.handleDataChanged = this.handleDataChanged.bind(this);
        // ~bindind handlers

        if (transport) this.attachTransport(transport);
    }

    republish() {
        if (!this.republishingEnabled) return;

        for (const attr of this.attributes) {
            if (attr === 'value' && !this.retained) continue;

            const value = this.getAttribute(attr);

            if (value !== undefined) this.publishAttribute(attr, value, true);
        }
    }

    publishAttribute(key, value, forced) {
        if (key === 'value') this.lastValue = value;

        super.publishAttribute(key, value, forced || (!this.retained && key === 'value'));
    }

    value() {
        return this.getAttribute('value');
    }

    attachBridge(bridge) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyBridge.attachBridge');

        super.attachBridge(bridge);

        if (this.transport) this.transport.attachBridge(bridge);
    }

    detachBridge() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyBridge.detachBridge');
        if (this.transport && this.transport.bridge) this.transport.detachBridge();

        super.detachBridge();
    }

    setDevice(device) {
        this.device = device;

        this.homieEntity.setDevice(device.homieEntity);
    }

    unsetDevice() {
        this.homieEntity.unsetDevice();

        delete this.device;
    }

    setNode(node) {
        this.node = node;

        this.homieEntity.setNode(node.homieEntity);
    }

    unsetNode() {
        this.homieEntity.unsetNode();

        delete this.node;
    }

    attachTransport(transport) {
        if (!(transport instanceof BasePropertyTransport)) throw new Error('WAUD: !(transport instanceof BasePropertyTransport)');

        this.transport = transport;
        transport.on('dataChanged', this.handleDataChanged);

        if (this.bridge) transport.attachBridge(this.bridge);

        // eslint-disable-next-line more/no-duplicated-chains
        if (this.transport.data !== null && this.transport.data !== undefined && this.transport.data !== '' && this.retained) {
            this.handleDataChanged(this.transport.data);
        }
    }

    detachTransport() {
        const transport = this.transport;

        if (transport.bridge) transport.detachBridge();

        transport.off('dataChanged', this.handleDataChanged);

        delete this.transport;
    }

    // async
    async setValue(homieValue) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyBridge.setValue', { homieValue });
        if (!this.settable) throw new Error('property is not settable.');

        this.handleDataChanged(
            await this.transport.set(...this.parser.fromHomie(homieValue, this.transport.data)),
            true
        );
    }

    // handlers~
    async handlePublish(data) {
        const key = Object.keys(data)[0];

        await super.handlePublish(data);

        if (('lastValue' in this) && key === 'value' && !_isEqual(this.getAttribute(key), `${this.lastValue}`)) {
            this.publishAttribute('value', this.lastValue);
        }
    }

    async handleDataChanged(data, forced) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyBridge.handleDataChanged', { data });

        this.publishAttribute('value', this.parser.toHomie(data), forced);
    }

    async handleSet(data) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyBridge.handleSet', { data });

        try {
            const key = Object.keys(data)[0];
            const value = data[key];

            if (key === 'value') await this.setValue(value);
        } catch (e) {
            if (this.debug) this.debug.warning('homie-sdk.Bridge.BasePropertyBridge.handleSet', e);
            if (!(e instanceof X)) e = new UNKNOWN_ERROR(e.message);

            this.homieEntity.publishError(e);
        }

        await super.handleSet(data);
    }

    async handleErrorPropagate(error) {
        error[this.type] = { id: this.id };

        await super.handleErrorPropagate(error);
    }
    // ~handlers
}

module.exports = BasePropertyBridge;
