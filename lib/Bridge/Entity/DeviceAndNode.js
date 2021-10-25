const BasePropertyTransport = require('../Property/transport');
const BaseEntityBridge = require('./index');

class BaseNodeAndDeviceEntity extends BaseEntityBridge {
    constructor(config, { dependencies, ...options  }) {
        super(config, options);
        this._dependencies = dependencies || [];
        for (const dep of this._dependencies) this[dep] = [];
        this.propertyTransports = [];
        this._connected = null;

        // bindind handlers~
        this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
        // ~bindind handlers

        this.publishAttribute('state', 'init');
    }

    // sync
    set connected(value) {
        if (this._connected === value) return;

        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.set#connected', { value });

        this._connected = value;
        this.doStateRevision();
    }

    get connected() {
        return this._connected;
    }

    republish() {
        if (!this.republishingEnabled) return;

        super.republish();

        for (const dep of this._dependencies) {
            for (const entity of this[dep]) entity.republish();
        }
    }

    attachBridge(bridge) {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.attachBridge');

        super.attachBridge(bridge);

        for (const dep of this._dependencies) for (const entity of this[dep]) entity.attachBridge(bridge);
    }

    detachBridge() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.detachBridge');

        for (const dep of this._dependencies) for (const entity of this[dep]) entity.detachBridge();

        super.detachBridge();
    }

    addPropertyTransport(propertyTransport) {
        if (!(propertyTransport instanceof BasePropertyTransport)) throw new Error('WAUD: !(propertyTransport instanceof BasePropertyTransport)');

        if (!this.propertyTransports.includes(propertyTransport)) {
            this.propertyTransports.push(propertyTransport);

            propertyTransport.on('error', this.handleErrorPropagate);

            if (this.bridge) propertyTransport.attachBridge(this.bridge);
        }

        return propertyTransport;
    }
    removePropertyTransport(id) {
        const index = this.propertyTransports.findIndex((n) => id === n.id);

        if (index === -1) throw new Error(`Cannot find propertyTransport with id=${id}.`);

        const propertyTransport = this.propertyTransports[index];

        if (propertyTransport.bridge) propertyTransport.detachBridge();

        propertyTransport.off('error', this.handleErrorPropagate);

        this.propertyTransports.splice(index, 1);

        return propertyTransport;
    }

    getPropertyTransportById(id) {
        return this.propertyTransports.find((propertyTransport) => propertyTransport.id === id);
    }

    doStateRevision() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.doStateRevision', { connected: this.connected });
        if (![ 'init', 'ready', 'disconnected' ].includes(this.getAttribute('state'))) return;

        // eslint-disable-next-line no-nested-ternary
        this.publishAttribute('state', (this.connected) ? 'ready' : ((this.connected === null) ? 'init' : 'disconnected'));
    }

    prepareToInitialization() {
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.prepareToInitialization');

        super.prepareToInitialization();

        for (const dep of this._dependencies) for (const entity of this[dep]) entity.prepareToInitialization();
    }
    // async

    // handlers~
    async handlePublish(data) {
        await super.handlePublish(data);

        if (Object.keys(data)[0] === 'state') this.doStateRevision();
    }

    async handleDeleteEvent() {
        // istanbul ignore next
        if (this.debug) this.debug.info('homie-sdk.Bridge.BaseNodeAndDeviceEntity.handleDeleteEvent');

        await super.handleDeleteEvent();

        for (const transport of this.propertyTransports) {
            transport.disablePolling();
            if (transport) transport.detachBridge();
        }

        for (const dep of this._dependencies) {
            for (const entity of this[dep]) if (!entity.deleted) await entity.handleDeleteEvent();
        }
    }
    // ~handlers
}

module.exports = BaseNodeAndDeviceEntity;
