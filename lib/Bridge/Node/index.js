const _defaults = require('lodash/defaults');
const _pick = require('lodash/pick');

/* eslint-disable camelcase*/
const HomieNode = require('./../../Node');
const {
    build_addNodeProperty,
    build_removeNodeProperty
} = require('./../utils/common_methods_builders');
const BaseNodeAndDeviceEntity = require('./../Entity/DeviceAndNode');

const DEPS = [ 'options', 'telemetry', 'sensors' ];
const ATTRS = [ 'state', 'name', 'type' ];

class BaseNodeBridge extends BaseNodeAndDeviceEntity {
    /*
    config = {
        id,
        state : 'init',
        name  : `Node Bridge(${id})`
        type,
        range,
        options         : [Array of instances of BaseDeviceProperty],
        telemetry       : [Array of instances of BaseDeviceProperty],
        sensors         : [Array of instances of BaseDeviceProperty]
    }
    provide either homie or mqttConnection
    */
    constructor(config, { ...options } = {}) {
        // creating homie entity~
        const id = config.id;
        const homieNode = (config instanceof HomieNode) ? config : new HomieNode({ id });

        // eslint-disable-next-line prefer-const
        let toUpdate = _pick(config, ATTRS);

        for (const key in toUpdate) {
            if (!toUpdate[key]) delete toUpdate[key];
        }
        homieNode.updateAttribute(_defaults(toUpdate, {
            state : 'init',
            name  : `Node Bridge(${id})`
        }));
        homieNode.validateMyStructure();

        // ~creating homie entity

        super(homieNode, { ...options, dependencies: DEPS });
        this.attributes = ATTRS;
        this.addOption = build_addNodeProperty('addOption', 'options', 'option');
        this.removeOption = build_removeNodeProperty('removeOptionById', 'options', 'option');
        this.addTelemetry = build_addNodeProperty('addTelemetry', 'telemetry', 'telemetry');
        this.removeTelemetry = build_removeNodeProperty('removeTelemetryById', 'telemetry', 'telemetry');
        this.addSensor = build_addNodeProperty('addSensor', 'sensors', 'sensor');
        this.removeSensor = build_removeNodeProperty('removeSensorById', 'sensors', 'sensor');

        if (config.transports) {
            for (const propertyTransport of config.transports) this.addPropertyTransport(propertyTransport);
        }
        if (config.options) for (const option of config.options) this.addOption(option);
        if (config.telemetry) for (const telemetry of config.telemetry) this.addTelemetry(telemetry);
        if (config.sensors) for (const sensor of config.sensors) this.addSensor(sensor);
    }

    // sync
    setDevice(device) {
        this.device = device;
        this.homieEntity.setDevice(device.homieEntity);
        for (const option of this.options) option.setDevice(device);
        for (const telemetry of this.telemetry) telemetry.setDevice(device);
        for (const sensor of this.sensors) sensor.setDevice(device);
    }
    unsetDevice() {
        for (const option of this.options) option.unsetDevice();
        for (const telemetry of this.telemetry) telemetry.unsetDevice();
        for (const sensor of this.sensors) sensor.unsetDevice();
        this.homieEntity.unsetDevice();
        delete this.device;
    }
    // async

    // handlers~
    async handleErrorPropagate(error) {
        error.node = { id: this.id };
        await super.handleErrorPropagate(error);
    }
    // ~handlers
}

module.exports = BaseNodeBridge;
