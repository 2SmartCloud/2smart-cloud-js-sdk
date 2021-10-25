const { createMD5Hash } = require('../../utils/');
const X                 = require('./../../utils/X');
const {
    ERROR_CODES : {
        NOT_FOUND,
        WRONG_FORMAT
    }
}           = require('./../../etc/config');
const Homie = require('./../Homie');

class HomieClient {
    constructor({ homie }) {
        if (!homie || !(homie instanceof Homie)) {
            throw new X({
                code    : WRONG_FORMAT,
                fields  : {},
                message : 'Instance of Homie is required'
            });
        }

        this.homie = homie;
    }

    initWorld(deviceId, topicsToSubscribe, options) {
        return this.homie.init(deviceId, topicsToSubscribe, options);
    }

    onNewDeviceAdded(cb) {
        this.homie.on('new_device', cb);
    }

    onNewNodeAdded(cb) {
        this.homie.on('new_node', cb);
    }

    onNewDeviceTelemetryAdded(cb) {
        this.homie.on('new_device_telemetry', cb);
    }

    onNewSensorAdded(cb) {
        this.homie.on('new_sensor', cb);
    }

    onNewDeviceOptionAdded(cb) {
        this.homie.on('new_device_option', cb);
    }

    onNewNodeTelemetryAdded(cb) {
        this.homie.on('new_node_telemetry', cb);
    }

    onNewNodeOptionAdded(cb) {
        this.homie.on('new_node_option', cb);
    }

    onNewThreshold(cb) {
        this.homie.on('new_threshold', cb);
    }

    onNewScenario(cb) {
        this.homie.on('new_scenario', cb);
    }

    onDelete(cb) {
        this.homie.on('events.delete.success', cb);
    }

    // DEPRECATED: use onNewEntityAdded with DISCOVERY type instead
    onNewDiscoveryAdded(cb) {
        this.homie.on('discovery.new', cb);
    }

    // DEPRECATED: use discoveryEntity.onAttributePublish -> attribute "acceptedAt"
    onDiscoveryAccepted(cb) {
        this.homie.on('discovery.accepted', cb);
    }

    // DEPRECATED: use discoveryEntity.deleteRequest() instead
    onDiscoveryDelete(cb) {
        this.homie.on('discovery.delete', cb);
    }

    onNewEntityAdded(cb) {
        this.homie.on('new_entity', cb);
    }

    getDeviceById(id) {
        const device = this.homie.getDeviceById(id);

        this.homie.attach(device);

        return device;
    }

    getDevices() {
        const devices = this.homie.getDevices();

        Object.keys(devices).forEach(id => {
            this.homie.attach(devices[id]);
        });

        return devices;
    }

    // DEPRECATED: use HomieClient.getEntities('DISCOVERY') instead
    getDiscovery() {
        return this.homie.getDiscovery();
    }

    getThresholds() {
        const thresholds = this.homie.getThresholds();

        Object.keys(thresholds).forEach(id => {
            thresholds[id].forEach(threshold => this.homie.attachThreshold(threshold));
        });

        return thresholds;
    }

    getThresholdById(scenarioId, id) {
        const threshold = this.homie.getThresholdById(scenarioId, id);

        this.homie.attachThreshold(threshold);

        return threshold;
    }

    getScenarios() {
        return this.homie.getScenarios();
    }

    getScenariosState() {
        return this.homie.getScenariosState();
    }

    getScenarioById(scenarioId) {
        const scenario = this.homie.getScenarioById(scenarioId);

        this.homie.attachScenario(scenario);

        return scenario;
    }

    createEntityRequest(type, data, customId, isCreatePromise = true) {
        const EntityClass = this.homie.entitiesStore.classes[type];

        if (!EntityClass) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    type : 'NOT_FOUND'
                },
                message : `EntityClass - ${type} not found!`
            });
        }

        // create hash from extension name to satisfy homie convention topic level validation
        const id = customId ? createMD5Hash(customId) : this.homie.entitiesStore.getUniqueId();
        const { rootTopic } = EntityClass;
        const successEvent = 'new_entity';
        const errorEvent = `homie.error.entity.${type}.${id}`;

        this.homie.publishToBroker(`${rootTopic}/${id}/create`, JSON.stringify(data), { retain: false });

        if (!isCreatePromise) return true;

        const successCb = payload => {
            /* istanbul ignore next */
            if (payload.type === type && payload.entityId === id) return true;

            /* istanbul ignore next */
            return false;
        };

        const errorCb = payload => {
            /* istanbul ignore next */
            if (payload.create) return true;

            /* istanbul ignore next */
            return false;
        };

        return this.homie.createPromisedEvent(successEvent, errorEvent, successCb, errorCb);
    }

    // DEPRECATED: use discoveryEntity.setAttribute('event', 'accept') instead
    acceptDiscovery(deviceId) {
        const type = 'ACCEPT_DEVICE';

        const successEvent = 'discovery.accepted';

        const data = { type, deviceId };

        this.homie.publishToBroker(
            'events/create',
            JSON.stringify(data),
            { retain: false }
        );

        const successCb = payload => payload.id === deviceId;

        return this.homie
            .createPromisedEvent(
                successEvent,
                null,
                successCb,
                null
            );
    }

    // DEPRECATED: use discoveryEntity.deleteRequest() instead
    deleteDiscovery(deviceId) {
        const type = 'DISCOVERY';

        const successEvent = 'discovery.delete';

        const data = { type, deviceId };

        this.homie.publishToBroker(
            'events/delete',
            JSON.stringify(data),
            { retain: false }
        );

        const successCb = payload => payload.id === deviceId;

        return this.homie
            .createPromisedEvent(
                successEvent,
                null,
                successCb,
                null
            );
    }

    getEntities(type) {
        return this.homie.getEntities(type);
    }

    getEntityById(type, id) {
        return this.homie.getEntityById(type, id);
    }

    initializeEntityClass(type) {
        this.homie.initializeEntityClass(type);
        const EntityClass = this.homie.entitiesStore.classes[type];
        const { retained } = EntityClass;

        /* istanbul ignore next */
        if (!retained) return this.homie.request(type, 'republish');
    }

    destroyEntityClass(type) {
        this.homie.destroyEntityClass(type);
    }

    /**
     * MicroCloud API
     * Returns object with firmware names as keys and arrays of devices which have current
     * firmware name as values
     * @param {String[]} types - An array of firmware names
     */
    getDevicesByTypes(types) {
        return this.homie.getDevicesByTypes(types);
    }

    /**
     * MicroCloud API
     * Returns homie instance by topic
     * @param {String} topic
     */
    getInstanceByTopic(topic) {
        return this.homie.getInstanceByTopic(topic);
    }

    /**
     * Subscribe to a topic or topics.
     * @param topic {String|String[]} - a topic or topics to subscribe
     * @param cb {Function} - a callback fired on suback
     */
    subscribe(topic, cb) {
        this.homie.subscribe(topic, cb);
    }

    /**
     * Unsubscribe from a topic or topics.
     * @param topic {String|String[]} - a topic or topics to unsubscribe
     * @param cb {Function} - a callback fired on unsubscribe
     */
    unsubscribe(topic, cb) {
        this.homie.unsubscribe(topic, cb);
    }
}

module.exports = HomieClient;
