const BaseNodeBridge = require('./../../Node'); // homie-sdk/lib/Bridge/Node

class NodeBridge extends BaseNodeBridge {
    constructor(config) {
        super(config);

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
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
        this.connected = true;
    }

    async handleDisconnected() {
        this.connected = false;
    }
}

module.exports = NodeBridge;
