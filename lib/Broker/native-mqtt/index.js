/* istanbul ignore file */
/* eslint-disable no-unused-vars */
const EventEmitter = require('events');
const mqtt = require('@taoqf/react-native-mqtt');
const Debugger = require('./../../utils/debugger');
const X = require('./../../utils/X');
const { ERROR_CODES: { REQUIRED, WRONG_TYPE } } = require('./../../etc/config');

class MQTTTransport extends EventEmitter {
    constructor({
        rootTopic,
        uri,
        retain = true,
        customCallbacks = {},
        username = '',
        password = '',
        tls = { enable: false, selfSigned: false },
        will = null,
        session = null,
        debug
    }) {
        super();
        this.setMaxListeners(0);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleReconnect = this.handleReconnect.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handlePacketSend = this.handlePacketSend.bind(this);
        this.handlePacketReceive = this.handlePacketReceive.bind(this);
        this.handleError = this.handleError.bind(this);

        this.debug = debug || new Debugger('*');

        if (this.debug.initEvents) this.debug.initEvents();

        if (!uri) {
            throw new X({
                code   : REQUIRED,
                fields : {
                    uri : 'REQUIRED'
                },
                message : 'MQTT broker URI required'
            });
        }

        // will option validation
        if (typeof will === 'object' && will !== null && (!will.topic || !will.payload)) {
            const fields = {};

            if (!will.topic) fields.topic = 'REQUIRED';
            if (!will.payload) fields.payload = 'REQUIRED';

            throw new X({
                fields,
                code    : REQUIRED,
                message : 'Required fields are missing!'
            });
        }

        this.callbacks = {
            onConnect       : this._onConnect,
            onReconnect     : this._onReconnect,
            onClose         : this._onClose,
            onDisconnect    : this._onDisconnect,
            onOffline       : this._onOffline,
            onConnectError  : this._onConnectError,
            onEnd           : this._onEnd,
            onMessage       : this._onMessage,
            onPacketSend    : this._onPacketSend,
            onPacketReceive : this._onPacketReceive,
            onError         : this._onError,
            onSubscribe     : this._onSubscribe,
            onUnsubscribe   : this._onUnsubscribe,
            ...customCallbacks
        };
        this.mqtt = mqtt;
        this.rootTopic = rootTopic || null;
        this.uri = uri;
        this.client = null;
        this.retain = retain;
        this._username = username;
        this._password = password;
        this._rejectUnauthorized = !Boolean(tls.enable && tls.selfSigned);
        this._sessionId = session || `session_${Math.random().toString(16).substr(2, 8)}`;
        if (will) this.setWill(will);
    }

    setWill(will) {
        if (this.client) throw new Error('Cannot set will after client is initialized');
        let topic = will.topic;

        if (this.rootTopic) topic = `${this.rootTopic}/${topic}`;

        this._will = { ...will, topic };
    }

    isConnected() {
        return this.client && this.client.connected;
    }

    async connect() {
        if (this.client) {
            if (this.client.disconnecting) {
                await new Promise((resolve, reject) => {
                    this.client.once('close', () => {
                        resolve();
                    });
                });
            } else {
                if (this.client.connected) return;

                return new Promise((resolve, reject) => {
                    this.client.once('connect', () => {
                        resolve();
                    });
                });
            }
        }

        return new Promise(resolve => {
            this.client =  this.mqtt.connect(this.uri, {
                clientId           : this._sessionId,
                username           : this._username,
                password           : this._password,
                rejectUnauthorized : this._rejectUnauthorized,
                will               : this._will,
                clean              : true // for receiving full state from broker after reconnect
            });

            this.client.setMaxListeners(0);
            this.client.on('message', this.handleMessage);
            this.client.on('connect', this.handleConnect);
            this.client.once('connect', resolve);
            this.client.on('reconnect', this.handleReconnect);
            this.client.on('close', this.handleClose);
            this.client.on('disconnect', this.handleDisconnect);
            this.client.on('offline', this.handleOffline);
            this.client.on('error', this.handleError);
            this.client.on('end', this.handleEnd);
            this.client.on('packetsend', this.handlePacketSend);
            this.client.on('packetreceive', this.handlePacketReceive);
        });
    }

    publish(topic, message, options = {}, cb = () => {}) {
        if (!topic) {
            throw new X({
                code   : REQUIRED,
                fields : {
                    topic : 'REQUIRED'
                },
                message : 'Topic required'
            });
        }
        if (message === undefined) {
            throw new X({
                code   : REQUIRED,
                fields : {
                    message : 'REQUIRED'
                },
                message : 'Message required'
            });
        }
        if (this.rootTopic) topic = `${this.rootTopic}/${topic}`;

        this.client.publish(topic, `${message}`, { retain: this.retain, ...options }, (err) => {
            if (err) this.handleError(err);
            cb(err);
        });
    }

    message(cb) {
        this.client.on('message', cb);
    }

    subscribe(topic, cb = (this.callbacks.onSubscribe || (() => {}))) {
        const origintopic = topic;

        if (!topic) {
            throw new X({
                code   : REQUIRED,
                fields : {
                    topic : 'REQUIRED'
                },
                message : 'Topic required'
            });
        }
        if (this.rootTopic) {
            if (Array.isArray(topic)) topic = topic.map(t => `${this.rootTopic}/${t}`);
            else topic = `${this.rootTopic}/${topic}`;
        }
        this.client.subscribe(topic, {}, {}, (err, granted) => {
            if (err) this.handleError(err);
            else this.emit('subscribed', origintopic);
            cb(err, origintopic);
        });
    }

    unsubscribe(topic, cb = (this.callbacks.onUnsubscribe || (() => {}))) {
        const origintopic = topic;

        if (!topic) {
            throw new X({
                code   : REQUIRED,
                fields : {
                    topic : 'REQUIRED'
                },
                message : 'Topic required'
            });
        }
        if (this.rootTopic) {
            if (Array.isArray(topic)) topic = topic.map(t => `${this.rootTopic}/${t}`);
            else topic = `${this.rootTopic}/${topic}`;
        }

        this.client.unsubscribe(topic, {}, (err) => {
            if (err) this.handleError(err);
            else this.emit('unsubscribed', origintopic);
            cb(err, origintopic);
        });
    }

    end(force = false, cb = (this.callbacks.onEnd || (() => {}))) {
        this.client.end(force, {}, cb);
    }

    reconnect() {
        this.client.reconnect();
    }

    onConnect(cb) {
        if (cb && typeof cb !== 'function') {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    cb : 'WRONG_TYPE'
                },
                message : 'Not a function'
            });
        }

        this.on('connect', cb);
    }

    handleConnect(connack) {
        this.connected = true;
        this.debug.info(`CONNECTED TO ${this.uri}`);
        this.emit('connect');
    }

    handleReconnect() {
        this.emit('reconnect');
    }

    handleClose() {
        if (this.connected) {
            this.connected = false;
            this.debug.info(`DISCONNECTED FROM ${this.uri}`);
        }
        this.emit('close');
    }

    handleDisconnect(packet) {
        this.emit('disconnect');
    }

    handleOffline() {
        this.emit('offline');
    }

    handleEnd() {
        this.emit('end');
    }

    handleMessage(topic, message, packet) {
        if (this.rootTopic) {
            if (topic.slice(0, this.rootTopic.length + 1) === `${this.rootTopic}/`) {
                topic = topic.slice(this.rootTopic.length + 1);
            } else return; // ignore
        }
        this.emit('message', topic, message, packet);
    }

    handlePacketSend(packet) {
        this.emit('packetsend', packet);
    }

    handlePacketReceive(packet) {
        this.emit('packetreceive', packet);
    }

    handleError(error) {
        this.emit('error', error);
    }
}

module.exports = MQTTTransport;
