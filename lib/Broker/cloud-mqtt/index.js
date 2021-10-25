/* istanbul ignore file */
/* eslint-disable no-unused-vars */
const EventEmitter = require('events');
const mqtt = require('mqtt');
const Debugger = require('./../../utils/debugger');
const X = require('./../../utils/X');
const { ERROR_CODES: { REQUIRED, WRONG_TYPE } } = require('./../../etc/config');

class MQTTTransport extends EventEmitter {
    constructor({
        rootTopic,
        transport,
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
        this.handleSubscribed = this.handleSubscribed.bind(this);
        this.handleUnsubscribed = this.handleUnsubscribed.bind(this);
        this.handleError = this.handleError.bind(this);

        this.debug = debug || new Debugger('*');

        if (this.debug.initEvents) this.debug.initEvents();
        this.rootTopic = rootTopic || null;
        if (transport) this.attachTransport(transport);
    }

    attachTransport(transport) {
        if (this.transport) throw new Error('Transport is already attached');
        this.transport = transport;

        this.transport.on('connect', this.handleConnect);
        this.transport.on('reconnect', this.handleReconnect);
        this.transport.on('close', this.handleClose);
        this.transport.on('disconnect', this.handleDisconnect);
        this.transport.on('offline', this.handleOffline);
        this.transport.on('end', this.handleEnd);
        this.transport.on('message', this.handleMessage);
        this.transport.on('packetsend', this.handlePacketSend);
        this.transport.on('packetreceive', this.handlePacketReceive);
        this.transport.on('subscribed', this.handleSubscribed);
        this.transport.on('unsubscribed', this.handleUnsubscribed);
        this.transport.on('error', this.handleConnect);

        if (this.transport.connected) process.nextTick(() => this.handleConnect());
    }
    detachTransport() {
        if (!this.transport) throw new Error('Transport is not attached');

        this.transport.off('connect', this.handleConnect);
        this.transport.off('reconnect', this.handleReconnect);
        this.transport.off('close', this.handleClose());
        this.transport.off('disconnect', this.handleDisconnect);
        this.transport.off('offline', this.handleOffline);
        this.transport.off('end', this.handleEnd);
        this.transport.off('message', this.handleMessage);
        this.transport.off('packetsend', this.handlePacketSend);
        this.transport.off('packetreceive', this.handlePacketReceive);
        this.transport.off('subscribed', this.handleSubscribed);
        this.transport.off('unsubscribed', this.handleUnsubscribed);
        this.transport.off('error', this.handleConnect);

        this.transport = null;
    }
    async connect() {
        if (!this.transport) throw new Error('Transport is not attached');

        return this.transport.connect();
    }
    isConnected() {
        return this.client && this.client.connected;
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
        if (this.rootTopic) topic = `${this.rootTopic}/${topic}`;

        this.transport.publish(topic, message, options, (err) => {
            if (err) this.handleError(err);
            cb(err);
        });
    }

    subscribe(topic, cb) {
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
        this.transport.unsubscribe(topic, cb);
    }

    unsubscribe(topic, cb) {
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
        this.transport.unsubscribe(topic, cb);
    }

    end(force = false, cb = (() => {})) {
        this.transport.end(force, {}, cb);
    }

    reconnect() {
        this.transport.reconnect();
    }

    handleConnect() {
        this.connected = true;
        this.emit('connect');
    }

    handleReconnect() {
        if (this.connected) this.connected = false;
        this.emit('reconnect');
    }

    handleClose() {
        if (this.connected) this.connected = false;
        this.emit('close');
    }

    handleDisconnect() {
        if (this.connected) this.connected = false;
        this.emit('disconnect');
    }

    handleOffline() {
        if (this.connected) this.connected = false;
        this.emit('offline');
    }

    handleEnd() {
        if (this.connected) this.connected = false;
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

    handleSubscribed(topic) {
        this.emit('subscribed', topic);
    }

    handleUnsubscribed(topic) {
        this.emit('unsubscribed', topic);
    }

    handleError(error) {
        this.emit('error', error);
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
}

module.exports = MQTTTransport;
