const EventEmitter = require('events');
const _isEqual = require('lodash/isEqual');

class BasePropertyTransport extends EventEmitter {
    constructor(config) {
        super();
        this.debug = config.debug || null;

        this.id = config.id || null;
        this.type = config.type || 'base_transport';
        this.data = (config.data === undefined) ? null : config.data;
        this.pollingEnabled = false;
        this.polling = false;
        this.pulled = false;
        this.pollInterval = (config.pollInterval === undefined) ? null : config.pollInterval;
        this.pollErrorTimeout = config.pollErrorTimeout || this.pollInterval;

        // bindind handlers~
        this.handleErrorPropagate = this.handleErrorPropagate.bind(this);
        this.handleNewData = this.handleNewData.bind(this);
        // ~bindind handlers
    }

    // sync
    attachBridge(bridge) {
        this.bridge = bridge;
    }

    detachBridge() {
        delete this.bridge;
    }

    enablePolling() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyTransport.enablePolling');
        if (this.pollingEnabled) return;

        this.pollingEnabled = true;

        process.nextTick(this.poll.bind(this));
    }

    disablePolling() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyTransport.disablePolling');
        if (!this.pollingEnabled) return;

        this.pollingEnabled = false;

        clearTimeout(this.pollTimeout);
    }

    isDataChanged(newData) {
        return !_isEqual(this.data, newData);
    }

    // async
    async get() {
        this.handleNewData(this.data);

        return this.data;
    }

    async set(data) {
        this.handleNewData(data, true);

        return data;
    }

    async poll() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyTransport.poll', { pollingEnabled: this.pollingEnabled, polling: this.polling });
        if (!this.pollingEnabled) return;
        if (this.pollInterval === null) return;
        if (this.pollInterval === 0 && this.pulled) return;
        if (this.polling) return;

        this.polling = true;
        clearTimeout(this.pollTimeout);

        let delay = (this.data === null) ? 0 : this.pollInterval;

        try {
            const data = await this.get();

            if (data !== undefined) this.handleNewData(data);

            this.polling = false;
            this.pulled = true;

            if (data !== undefined) this.emit('afterPoll', data);
            if (delay === 0) delay = 10000;
        } catch (e) {
            this.polling = false;
            delay = Math.max(delay, this.pollErrorTimeout);

            this.emit('error', e);
        }

        this.pollTimeout = setTimeout(this.poll.bind(this), delay);
    }

    // handlers~
    async handleErrorPropagate(error) {
        error.transport = { id: this.id, type: this.type };

        this.emit('error', error);
    }

    async handleNewData(data, force = false) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BasePropertyTransport.handleNewData', { data, changed: this.isDataChanged(data) });

        if (force || this.isDataChanged(data)) {
            this.data = data;
            setImmediate(() => this.emit('dataChanged', this.data));
        }

        if (this.pollingEnabled && !this.polling) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = setTimeout(this.poll.bind(this), this.pollInterval);
        }
    }
    // ~handlers
}

module.exports = BasePropertyTransport;
