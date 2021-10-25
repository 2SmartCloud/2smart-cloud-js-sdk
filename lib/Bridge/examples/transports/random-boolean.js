const BasePropertyTransport = require('./../../Property/transport'); // homie-sdk/lib/Bridge/Property/transport

// transport that generates random boolean value
class RandomBooleanTransport extends BasePropertyTransport {
    constructor(config) {
        super({
            ...config,
            type         : 'random-boolean',
            pollInterval : 1000
        });

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }

    async get() {
        return Math.random() < 0.5;
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

module.exports = RandomBooleanTransport;
