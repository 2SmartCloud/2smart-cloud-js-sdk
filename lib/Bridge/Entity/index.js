/* eslint-disable camelcase */
const EventEmitter = require('events');
const _isEqual = require('lodash/isEqual');

const Bridge = require('./../index');

const SYNCING_INTERVAL = 5000;

class BaseEntityBridge extends EventEmitter {
    /*
    config = {
        homie,
        mqttConnection: {username:'', password:'', uri:'mqtt://localhost:1883'},
        deviceBridge
    }
    provide either homie or mqttConnection object
    deviceBridge instanceof BaseDeviceBridge
    */
    constructor(homieEntity, { debug, republishingEnabled = true } = {}) {
        super();
        this.debug = debug || null;
        this.id = homieEntity.id;
        this.name = homieEntity.name;
        this.homieEntity = null;
        this.bridge = null;
        this.homie = null;
        this.pendingAttributes = {};
        this.syncing = false;
        this.syncTimeout = null;
        this.syncingEnabled = false;
        this.deleted = false;
        this.attributes = [];
        this.republishingEnabled = republishingEnabled;

        // bindind handlers~
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handlePublish = this.handlePublish.bind(this);
        this.handleSet = this.handleSet.bind(this);
        this.handleDeleteEvent = this.handleDeleteEvent.bind(this);
        this.handleErrorPropagate = this.handleErrorPropagate.bind(this);
        // ~bindind handlers

        if (homieEntity) this.setHomieEntity(homieEntity);
    }

    // sync
    attachBridge(bridge) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.attachBridge`);
        if (!(bridge instanceof Bridge)) throw new Error('WAUD: !(bridge instanceof BaseBridge))');
        if (this.bridge) throw new Error('WAUD: bridge is already here.');

        this.bridge = bridge;

        if (this.bridge.homie) this.attachHomie(this.bridge.homie);
    }

    detachBridge() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.detachBridge`);
        if (!this.bridge) throw new Error('WAUD: bridge is not here.');

        this.disableSyncing();

        if (this.homie) this.detachHomie();

        delete this.bridge;
    }

    attachHomie(homie) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.attachHomie`);
        if (this.homie) throw new Error('WAUD: homie is already attached.');

        this.homie = homie;
        this.homieEntity.onAttach(homie);
        this._publishEventName = this.homieEntity._getPublishEventName();
        this._setEventName = this.homieEntity._getSetEventName();

        homie.on(this._publishEventName, this.handlePublish);
        homie.on(this._setEventName, this.handleSet);

        homie.on('online', this.handleOnline);
        homie.on('offline', this.handleOffline);

        if (this.bridge.homie.online) {
            this.republish();
            this.handleOnline();
        }
    }

    republish() {
        if (!this.republishingEnabled) return;
        for (const attr of this.attributes) {
            const value = this.getAttribute(attr);

            if (value !== undefined) this.publishAttribute(attr, value, true);
        }
    }

    detachHomie() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.detachHomie`);
        if (!this.homie) throw new Error('WAUD: homie is not attached.');

        const homie = this.homie;

        homie.off('online', this.handleOnline);
        homie.off('offline', this.handleOffline);
        homie.off(this._publishEventName, this.handlePublish);
        homie.off(this._setEventName, this.handleSet);

        delete this._publishEventName;
        delete this._setEventName;

        this.homieEntity.onDetach();

        delete this.homie;
    }

    setHomieEntity(homieEntity) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.setHomieEntity`);
        if (this.homieEntity) throw new Error('WAUD: homieEntity is already here.');

        this.homieEntity = homieEntity;
    }

    unsetHomieEntity() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.unsetHomieEntity`);
        if (!this.homieEntity) throw new Error('WAUD: homieEntity is not here.');

        delete this.homieEntity;
    }

    publishAttribute(key, value, forced = false) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.publishAttribute`);
        if (!forced && _isEqual(this.getAttribute(key), value)) return;

        this.pendingAttributes[key] = { publishedAt: new Date(0), value };

        if (this.syncingEnabled) process.nextTick(this.sync.bind(this));
    }

    getAttribute(key) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.getAttribute`);

        return (this.pendingAttributes[key]) ? this.pendingAttributes[key].value : this.homieEntity[key];
    }

    enableSyncing() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.enableSyncing`);
        if (this.syncingEnabled) return;

        this.syncingEnabled = true;

        process.nextTick(this.sync.bind(this));
    }

    disableSyncing() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.disableSyncing`);
        if (!this.syncingEnabled) return;

        this.syncingEnabled = false;

        clearTimeout(this.syncTimeout);
    }

    prepareToInitialization() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.prepareToInitialization`);

        const updateObj = {};

        for (const key in this.pendingAttributes) {
            updateObj[key] = this.pendingAttributes[key].value;
        }

        this.homieEntity.updateAttribute(updateObj);
    }

    // async
    async sync() {
        // istanbul ignore next
        if (this.debug) {
            this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.sync`, {
                id                : this.id,
                syncing           : this.syncing,
                syncingEnabled    : this.syncingEnabled,
                pendingAttributes : this.pendingAttributes
            });
        }
        if (!this.syncingEnabled) return;

        if (this.syncing) {
            this.resync = true;

            return;
        }

        let keys = Object.keys(this.pendingAttributes);

        if (!keys.length) {
            clearTimeout(this.syncTimeout);

            return;
        }

        const cur_date = new Date();

        keys = keys.filter((key) => {
            return cur_date - this.pendingAttributes[key].publishedAt >= SYNCING_INTERVAL;
        });

        let delay = SYNCING_INTERVAL;

        clearTimeout(this.syncTimeout);

        if (keys.length) {
            this.syncing = true;
            try {
                for (const key of keys) {
                    this.pendingAttributes[key].publishedAt = cur_date;
                    this.homieEntity.publishAttribute(key, this.pendingAttributes[key].value);
                }
            } catch (e) {
                this.handleErrorPropagate(e);
                this.syncing = false;
            }
            if (this.resync) {
                this.resync = false;
            }
            this.syncing = false;
        }


        delay = Math.min.apply(null, Object.keys(this.pendingAttributes).map((key) => {
            return SYNCING_INTERVAL - (cur_date - this.pendingAttributes[key].publishedAt);
        }));

        if (isFinite(delay)) {
            this.syncTimeout = setTimeout(this.sync.bind(this), delay);
        }
    }

    // handlers~
    async handleOnline() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.handleOnline`);

        this.enableSyncing();
    }

    async handleOffline() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.handleOffline`);

        this.disableSyncing();
    }

    async handlePublish(data) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.handlePublish`, { data });

        const key = Object.keys(data)[0];

        // skip
        if (!(key in this.pendingAttributes)) return;

        if (_isEqual(this.homieEntity[key], `${this.pendingAttributes[key].value}`)) {
            delete this.pendingAttributes[key];
            this.emit('published', data);
        }

        process.nextTick(this.sync.bind(this));
    }

    async handleSet(data) {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.handleSet`, data);

        this.emit('set', data);
    }

    async handleDeleteEvent() {
        // istanbul ignore next
        if (this.debug) this.debug.info(`homie-sdk.Bridge.BaseEntityBridge.${this.id}.handleDeleteEvent`);

        this.deleted = true;
        this.disableSyncing();

        if (this.homie) this.detachHomie();
    }

    async handleErrorPropagate(error) {
        this.emit('error', error);
    }
    // ~handlers
}

module.exports = BaseEntityBridge;
