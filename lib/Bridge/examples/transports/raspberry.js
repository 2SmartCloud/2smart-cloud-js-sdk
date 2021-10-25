const { Gpio } = require('onoff'); // include onoff to interact with the GPIO
const BasePropertyTransport = require('./../../Property/transport'); // homie-sdk/lib/Bridge/Property/transport

class RaspberryTransport extends BasePropertyTransport {
    constructor(config) {
        super({ ...config, type: 'boolean', pollInterval: 2000 });

        this.protocol = config.protocol.toLowerCase();

        if (this.protocol === 'gpio') {
            this.LED = new Gpio(config.pinout, config.mode);
        }

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
    }

    async getGpio() {
        const state = await this.LED.read();

        if (state === 1) {
            return true;
        }

        return false;
    }

    async setGpio(value) {
        if (value === 'true') {
            await this.LED.write(1);    // set pin state to 1 (turn LED off)
        } else if (value === 'false') {
            await this.LED.write(0);    // set pin state to 0 (turn LED on)
        }

        return !!(await this.LED.read());
    }


    async get() {
        return this.getGpio();
    }
    async set(value) {
        return this.setGpio(value);
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

module.exports = RaspberryTransport;
