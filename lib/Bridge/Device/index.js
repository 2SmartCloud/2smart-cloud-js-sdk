
const _defaults = require('lodash/defaults');
const _pick = require('lodash/pick');

/* eslint-disable camelcase*/
const Device = require('../../Device');
const {
    build_addDeviceProperty,
    build_removeDeviceProperty,
    build_addNode,
    build_removeNode
} = require('./../utils/common_methods_builders');
const BaseNodeAndDeviceEntity = require('./../Entity/DeviceAndNode');

const DEPS = [ 'options', 'telemetry', 'nodes' ];
const ATTRS = [ 'state', 'name', 'implementation', 'mac', 'firmwareVersion', 'firmwareName', 'localIp' ];

class BaseDeviceBridge extends BaseNodeAndDeviceEntity {
    /*
    config = {
        id,
        state           : 'init',
        name            : `Device Bridge(${id})`,
        implementation  : 'Bridge',
        mac             : '-',
        firmwareVersion : '-',
        firmwareName    : '-',
        localIp         : '-',
        options         : [Array of instances of BaseDeviceProperty],
        telemetry       : [Array of instances of BaseDeviceProperty],
        nodes           : [Array of instances of BaseDeviceNode]
    }
    provide either homie or mqttConnection
    */
    constructor(config, { ... options } = {}) {
        // creating homie entity~
        const id = config.id;
        const homieDevice = (config instanceof Device) ? config : new Device({ id });

        homieDevice.updateAttribute(_defaults(_pick(config, ATTRS), {
            state           : 'init',
            name            : `Device Bridge(${id})`,
            implementation  : 'Bridge',
            mac             : '-',
            firmwareVersion : '-',
            firmwareName    : '-',
            localIp         : '-'
        }));

        homieDevice.validateMyStructure();

        // ~creating homie entity

        super(homieDevice, { ...options, dependencies: DEPS });
        this.attributes = ATTRS;
        this.addOption = build_addDeviceProperty('addOption', 'options', 'option');
        this.removeOption = build_removeDeviceProperty('removeOptionById', 'options', 'option');
        this.addTelemetry = build_addDeviceProperty('addTelemetry', 'telemetry', 'telemetry');
        this.removeTelemetry = build_removeDeviceProperty('removeTelemetryById', 'telemetry', 'telemetry');
        this.addNode = build_addNode();
        this.removeNode = build_removeNode();

        // bindind handlers~
        this.handleHeartbeat = this.handleHeartbeat.bind(this);
        this.handleErrorPropagate = this.handleErrorPropagate.bind(this);
        // ~bindind handlers

        this.heartbeatIntvl = null;
        this.startHeartbeat = this.startHeartbeat.bind(this);
        this.stopHeartbeat  = this.stopHeartbeat.bind(this);

        if (config.transports) {
            for (const propertyTransport of config.transports) this.addPropertyTransport(propertyTransport);
        }
        if (config.options) for (const option of config.options) this.addOption(option);
        if (config.telemetry) for (const telemetry of config.telemetry) this.addTelemetry(telemetry);
        if (config.nodes) for (const node of config.nodes) this.addNode(node);
    }
    // sync
    attachHomie(homie) {
        super.attachHomie(homie);
        // homie.on(`homie.set.heartbeat.${this.id}`, this.handleHeartbeat);
        this.startHeartbeat();
    }
    detachHomie() {
        // const homie = this.homie;

        // homie.off(`homie.set.heartbeat.${this.id}`, this.handleHeartbeat);
        this.stopHeartbeat();
        super.detachHomie();
    }

    async handleHeartbeat(token = { value: '' }) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseDeviceBridge.handleHeartbeat');
        if ([ 'ready', 'init' ].includes(this.getAttribute('state'))) this.homieEntity.respondToHeartbeat(token);
    }

    startHeartbeat() {
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseDeviceBridge.startHeartbeat');
        clearInterval(this.heartbeatIntvl);

        this.heartbeatIntvl = setInterval(this.handleHeartbeat, 10000);
    }

    stopHeartbeat() {
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseDeviceBridge.stopHeartbeat');
        clearInterval(this.heartbeatIntvl);

        this.heartbeatIntvl = null;
    }

    async handleErrorPropagate(error) {
        error.device = { id: this.id };
        await super.handleErrorPropagate(error);
    }
}

module.exports = BaseDeviceBridge;
