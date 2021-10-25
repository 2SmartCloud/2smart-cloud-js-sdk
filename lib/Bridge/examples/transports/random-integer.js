const BasePropertyTransport = require('./../../Property/transport'); // homie-sdk/lib/Bridge/Property/transport

// transport that generates random integers from 1-10 every 5 seconds
class RandomNumberTransport extends BasePropertyTransport {
    constructor(config) {
        super({
            ...config,
            type         : 'random-integer',
            pollInterval : 5000
        });

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }

    async get() {
        return Math.ceil(Math.random() * 10);
    }

    async set() {
        throw new Error('Cannot set');
    }

    attachBridge(bridge) {
        super.attachBridge(bridge);

        // do some handshake staff with bridge here

        this.bridge.connection.on('connected', this.handleConnected);
        this.bridge.connection.on('disconnected', this.handleDisconnected);
    }

    detachBridge() {
        // do some reverse-handshake staff with bridge here

        this.bridge.connection.off('connected', this.handleConnected);
        this.bridge.connection.off('disconnected', this.handleDisconnected);

        super.detachBridge();
    }

    async handleConnected() {
        this.enablePolling();
    }

    async handleDisconnected() {
        this.disablePolling();
    }
}

module.exports = RandomNumberTransport;
