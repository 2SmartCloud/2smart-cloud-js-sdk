const EventEmitter = require('events');

const MQTT = require('../../Broker/mqtt');
const { getRandomId } = require('./../../utils');

class BridgesManager extends EventEmitter {
    constructor({ firmwareBaseRootTopic = 'fw_base', firmwareName, mqttConnectionOpts, debug, isSandbox = false }) {
        if (!firmwareName) throw new Error('firmwareName required');

        super();

        this.firmwareBaseRootTopic  = firmwareBaseRootTopic;
        this.firmwareName           = firmwareName;
        this.rootTopic              = `${this.firmwareBaseRootTopic}/${this.firmwareName}`;
        this.mqttConnectionOpts     = mqttConnectionOpts;
        this.debug                  = debug;
        // keep a pool of transports to use same transport for devices which are related to the same product
        this.transports             = {};
        this.bridges                = {};
        this.transport              = new MQTT({
            uri      : this.mqttConnectionOpts.uri,
            username : this.mqttConnectionOpts.username,
            password : this.mqttConnectionOpts.password,
            debug    : this.debug
        });

        this.isSandbox = isSandbox;

        this._handleMessage = this._handleMessage.bind(this);
        this._handleError   = this._handleError.bind(this);
    }

    async init() {
        await this.transport.connect();

        this.transport.on('message', this._handleMessage);
        this.transport.on('error', this._handleError);

        this.transport.subscribe(`${this.rootTopic}/#`);
    }

    end({ force = false }) {
        this.transport.end(force);

        this.transport.off('message', this._handleMessage);
        this.transport.off('error', this._handleError);
    }

    // TODO: get rid of args(replace with defined arguments)
    publishToBroker(...args) {
        this.transport.publish(...args);
    }

    getRootTopic() {
        return this.rootTopic;
    }

    async _handleMessage(topic, message) {
        const [ , , userHash, productId, deviceId ] = topic.split('/');

        // TODO: should be defined as BridgesManager option
        // as soon as we have another bridge to get a single convention
        const discoveryRegexp = new RegExp(`^${this.rootTopic}/${userHash}/${productId}/${deviceId}/config`);
        const isDiscoveryTopic = !!discoveryRegexp.exec(topic);

        if (!this.transports[productId]) {
            this.transports[productId] = new MQTT({
                uri      : this.mqttConnectionOpts.uri,
                username : this.mqttConnectionOpts.username,
                password : this.mqttConnectionOpts.password,
                session  : `${this.firmwareName}_product_${productId}_${getRandomId()}`,
                debug    : this.debug
            });
            this.bridges[productId] = {};
        }

        if (!this.bridges[productId][userHash]) {
            this.bridges[productId][userHash] = {};
        }

        if (!this.bridges[productId][userHash][deviceId] && isDiscoveryTopic) {
            // case when clean up "fw_base/<this.firmwareName>/<userHash>/<productId>/<deviceId>/#"
            // device topics after removing the device
            if (!message.length) return;

            const bridge = this.createBridgeInstance({
                productId,
                deviceId,
                userHash,
                transport     : this.transports[productId],
                homieDeviceId : this._getHomieDeviceId({ productId, deviceId })
            });

            this.bridges[productId][userHash][deviceId] = bridge;

            await this.initBridgeInstance(bridge);
        }

        const eventName = `${productId}.${userHash}.${deviceId}`;

        this.emit(eventName, topic, message);
    }

    detachBridgeInstance(bridge) {
        try {
            const { productId, deviceId, userHash } = bridge;

            delete this.bridges[productId][userHash][deviceId];
        } catch (e) {
            this.debug.warning('BridgesManager.detachBridgeInstance', e);
        }
    }

    _handleError(error) {
        this.debug.warning('BridgesManager._handleError', error);
    }

    // abstract method, should be implemented in inherited class
    // eslint-disable-next-line no-unused-vars
    createBridgeInstance(options = {}) {
        throw new Error('createBridgeInstance should be implemented in inherited class');
    }

    // abstract method, should be implemented in inherited class
    // eslint-disable-next-line no-unused-vars
    async initBridgeInstance(bridge) {
        throw new Error('initBridgeInstance should be implemented in inherited class');
    }

    // in sandbox env deviceId is unique for each product
    // in prod env deviceId is not unique and can cause collision between products and users
    _getHomieDeviceId({ productId, deviceId }) {
        return this.isSandbox ? deviceId : `${productId}--${deviceId}`;
    }
}

module.exports = BridgesManager;
