const EventEmitter = require('events');
const _clone = require('lodash/clone');
const _defaults = require('lodash/defaults');

const HomieMigrator = require('../homie/HomieMigrator');
/* eslint-disable camelcase */
const {
    build_handleNewDevicePropertyEvent,
    build_handleNewNodePropertyEvent,
    build_handleNewNodeEvent
} = require('./utils/common_methods_builders');

class BaseBridge extends EventEmitter {
    /*
    config = {
        homie,
        mqttConnection: {username:'', password:'', uri:'mqtt://localhost:1883'},
        deviceBridge
    }
    provide either homie or mqttConnection
    */
    constructor(config) {
        super();
        this.handleNewDeviceOptionEvent = build_handleNewDevicePropertyEvent('getOptionById', 'addOption', 'options', 'option');
        this.handleNewDeviceTelemetryEvent = build_handleNewDevicePropertyEvent('getTelemetryById', 'addTelemetry', 'telemetry', 'telemetry');
        this.handleNewNodeEvent = build_handleNewNodeEvent();
        this.handleNewNodeOptionEvent = build_handleNewNodePropertyEvent('getOptionById', 'addOption', 'options', 'option');
        this.handleNewNodeTelemetryEvent = build_handleNewNodePropertyEvent('getTelemetryById', 'addTelemetry', 'telemetry', 'telemetry');
        this.handleNewSensorEvent = build_handleNewNodePropertyEvent('getSensorById', 'addSensor', 'sensors', 'sensor');
        // DEBUG
        this.debug = config.debug || null;
        // DEBUG END
        let { homie } = config;

        if (!homie && config.mqttConnection) {
            const MQTTTransport = require('../Broker/mqtt');
            const Homie = require('../homie/Homie');
            const mqttConnectionConfig = _defaults(_clone(config.mqttConnection || {}), {
                username : '',
                password : '',
                uri      : 'mqtt://localhost:1883'
            });
            const transport = new MQTTTransport({
                ...mqttConnectionConfig,
                debug : this.debug
            });

            homie = new Homie({ transport });
        }

        // bindind handlers~
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
        this.handleNewNodeEvent = this.handleNewNodeEvent.bind(this);
        this.handleNewDeviceOptionEvent = this.handleNewDeviceOptionEvent.bind(this);
        this.handleNewNodeOptionEvent = this.handleNewNodeOptionEvent.bind(this);
        this.handleNewDeviceTelemetryEvent = this.handleNewDeviceTelemetryEvent.bind(this);
        this.handleNewNodeTelemetryEvent = this.handleNewNodeTelemetryEvent.bind(this);
        this.handleNewSensorEvent = this.handleNewSensorEvent.bind(this);
        this.handleHomieError = this.handleHomieError.bind(this);
        this.handleErrorPropagate = this.handleErrorPropagate.bind(this);
        // ~bindind handlers

        if (homie) this.attachHomie(homie);
        if (config.device) this.setDeviceBridge(config.device);
    }

    // sync
    init(options) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.init');

        return this.homieMigrator.initWorld(this.deviceBridge.id, undefined, options).catch((error) => {
            // istanbul ignore next
            this.emit('error', error);
            // istanbul ignore next
            this.emit('exit', error, 1);
        });
    }

    destroy() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.destroy');
        this.homie.end();
    }

    attachHomie(homie) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.attachHomie');
        this.homie = homie;
        this.homieMigrator = new HomieMigrator({ homie });
        this.homie.on('online', this.handleOnline);
        this.homie.on('offline', this.handleOffline);
        this.homie.on('events.delete.success', this.handleDeleteEvent);
        this.homie.on('new_node', this.handleNewNodeEvent);
        this.homie.on('new_device_option', this.handleNewDeviceOptionEvent);
        this.homie.on('new_node_option', this.handleNewNodeOptionEvent);
        this.homie.on('new_device_telemetry', this.handleNewDeviceTelemetryEvent);
        this.homie.on('new_node_telemetry', this.handleNewNodeTelemetryEvent);
        this.homie.on('new_sensor', this.handleNewSensorEvent);
        this.homie.on('error', this.handleHomieError);

        if (this.deviceBridge) this.deviceBridge.attachHomie(homie);

        if (this.homie.online) this.handleOnline();
    }

    detachHomie() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.detachHomie');
        if (this.deviceBridge && this.deviceBridge.homie) this.deviceBridge.detachHomie();

        this.homie.off('online', this.handleOnline);
        this.homie.off('offline', this.handleOffline);
        this.homie.off('events.delete.success', this.handleDeleteEvent);
        this.homie.off('new_node', this.handleNewNodeEvent);
        this.homie.off('new_device_option', this.handleNewDeviceOptionEvent);
        this.homie.off('new_node_option', this.handleNewNodeOptionEvent);
        this.homie.off('new_device_telemetry', this.handleNewDeviceTelemetryEvent);
        this.homie.off('new_node_telemetry', this.handleNewNodeTelemetryEvent);
        this.homie.off('new_sensor', this.handleNewSensorEvent);
        this.homie.off('error', this.handleHomieError);
        delete this.homieMigrator;
        delete this.homie;
    }

    setDeviceBridge(deviceBridge) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.setDeviceBridge');
        if (this.deviceBridge) throw new Error('WAUD: deviceBridge is already here.');
        this.deviceBridge = deviceBridge;
        this.deviceBridge.on('error', this.handleErrorPropagate);
        this.deviceBridge.attachBridge(this);
        this.homie.devices[this.deviceBridge.homieEntity.getId()] = this.deviceBridge.homieEntity;
    }

    unsetDeviceBridge() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.unsetDeviceBridge');
        if (!this.deviceBridge) throw new Error('WAUD: deviceBridge is not here.');
        if (this.deviceBridge.bridge) this.deviceBridge.detachBridge();
        this.deviceBridge.off('error', this.handleErrorPropagate);
        delete this.deviceBridge;
    }

    // async
    async republish() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.republish');
        // maybe we can use not migrator but pendingAttributes
        this.deviceBridge.republish();
    }

    // handlers~
    async handleOnline() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleOnline');
        try {
            await this.republish();
        } catch (e) {
            // istanbul ignore next
            this.handleErrorPropagate(e);
        }
    }

    async handleOffline() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleOffline');
    }

    async handleDeleteEvent({ type, deviceId, nodeId }) {
        if (deviceId !== this.deviceBridge.id) return;
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleDeleteEvent', { type, deviceId, nodeId });
        const deviceBridge = this.deviceBridge;

        if (type === 'DEVICE') {
            await deviceBridge.handleDeleteEvent();

            this.emit('exit', 'deleted device', 1);
        } else if (type === 'NODE') {
            const nodeBridge = deviceBridge.nodes.find((n) => n.id === nodeId);

            if (!nodeBridge) return this.handleErrorPropagate(new Error(`Cannot find node id = ${nodeId} on delete event`));
            await nodeBridge.handleDeleteEvent();
        }
    }

    async handleHomieError(error) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseBridge.handleHomieError');
        // check if we we have 'Reject Unauthorized' error here
        await this.handleErrorPropagate(error);
        if (error.message === 'Connection refused: Not authorized') this.emit('exit', error.message, 1);
    }

    async handleErrorPropagate(error) {
        this.emit('error', error);
    }
    // ~handlers
}

module.exports = BaseBridge;
