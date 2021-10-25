/* eslint-disable newline-before-return */
/* eslint-disable no-require-lodash/no-require-lodash */
/* eslint-disable no-empty */
/* eslint-disable max-len */
const EventEmitter   = require('events');
const createHash     = require('create-hash/browser');
const _              = require('lodash');

const entityDefaultAttributes = require('../../etc/entity_default_attributes');
const X                       = require('./../../utils/X');
const {
    DEVICE_ATTRS,
    NODE_ATTRS,
    SENSOR_PROPS,
    DEVICE_PROP_OPTION_PROPS,
    DEVICE_PROP_OPTION_ATTRS,
    SENSOR_ATTRS,
    NODE_PROP_OPTION_PROPS,
    NODE_PROP_OPTION_ATTRS,
    HEARTBEAT_ATTR,
    THRESHOLD_ATTR,
    ENTITY_ATTR,
    DISCOVERY_NEW,
    ENTITY,
    EVENT_PUBLISH,
    EVENT_SET,
    EVENT_CREATE,
    EVENT_UPDATE,
    EVENT_DELETE,
    EVENT_ERROR,
    EVENT_EVENT,
    EVENT_DISCOVERY,
    EVENT_REQUEST,
    EVENT_RESPONSE,
    SCENARIO_ATTR
} = require('./translator/translator-config');
const Device = require('./../../Device');
const Scenario = require('./../../Scenario');
const Node = require('./../../Node');
const Property = require('./../../Property');
const Sensor = require('./../../Sensor');
const Threshold = require('./../../Threshold');
const entitiesScheme = require('./../../etc/entities_scheme');
const {
    DEVICE_ROOT_TOPIC,
    ERROR_TOPIC,
    THRESHOLD_TOPIC,
    SCENARIO_TOPIC,
    DEVICE_SETTINGS_TOPIC,
    EVENTS_TOPIC,
    REQUEST_TOPIC,
    RESPONSE_TOPIC,
    UPD_METHODS,
    HEARTBEAT_ATTRIBUTE,
    defaultInitOptions
} = require('./config');

const BRIDGE_TOPIC = entitiesScheme.find(scheme => scheme.type === 'BRIDGE').rootTopic;
const EntitiesStore = require('./../../EntitiesStore');
const Translator = require('./translator/fromTopicToObj');
const { ERROR_CODES: { WRONG_FORMAT, NOT_FOUND, BROKER_ERROR, VALIDATION, TIMEOUT, REQUIRED } } = require('./../../etc/config');
const Debugger = require('./../../utils/debugger');
const { getRandomId } = require('./../../utils');

class Homie extends EventEmitter {
    constructor({ transport, debug = false, rootTopic = '', syncMaxDelay = 10000, syncResetTimeout = 1000 }) {
        if (!transport) {
            throw new X({
                code    : REQUIRED,
                fields  : {},
                message : 'Transport is required'
            });
        }

        super();
        this._handleMessage = this._handleMessage.bind(this);
        this._handleSubscribe = this._handleSubscribe.bind(this);
        this._handleBrokerError = this._handleBrokerError.bind(this);
        this._handleOnline = this._handleOnline.bind(this);
        this._handleOffline = this._handleOffline.bind(this);

        this.rootTopic = rootTopic;
        this.deviceTopic = DEVICE_ROOT_TOPIC;
        this.errorTopic = ERROR_TOPIC;
        this.thresholdsTopic = THRESHOLD_TOPIC;
        this.scenarioTopic = SCENARIO_TOPIC;
        this.requestTopic = REQUEST_TOPIC;
        this.deviceSettingsTopic = `${DEVICE_SETTINGS_TOPIC}/${this.deviceTopic}`;
        this.eventsTopic = EVENTS_TOPIC;
        this.heartbeatAttribute = HEARTBEAT_ATTRIBUTE;
        this.responseTopic = RESPONSE_TOPIC;
        this.bridgeTopic = BRIDGE_TOPIC;

        this.devices = {};
        this.devicesPartialState = {};
        this.scenarios = {};
        this.entities = {};
        this.discovery = {};

        this.transport = transport;
        this.transport.on('error', this._handleBrokerError);
        this.transport.on('message', this._handleMessage);
        this.transport.on('connect', this._handleOnline);
        this.transport.on('close', this._handleOffline);
        this.transport.on('reconnect', this._handleOffline);
        this.transport.on('disconnect', this._handleOffline);
        this.transport.on('offline', this._handleOffline);
        this.transport.on('end', this._handleOffline);

        this.debugMode = debug;
        this.debug = new Debugger(this.debugMode ? '*' : '');

        this.debug.initEvents();

        this.entitiesStore = undefined;
        this.syncPromise = undefined;

        this.translator = new Translator({ entitiesScheme });

        this.syncMaxDelay = syncMaxDelay;
        this.syncResetTimeout = syncResetTimeout;

        this.setMaxListeners(0);
    }

    async init(deviceId = null, topicsToSubscribe = [ '#' ], options = {}) {
        const initOptions = { ...defaultInitOptions, ...options };

        if (deviceId && initOptions.setWill) {
            this.transport.setWill({
                retain  : true,
                topic   : `${this.deviceTopic}/${deviceId}/$state`,
                payload : 'lost'
            });
        }

        this._initEntitiesStore();

        if (this.transport.isConnected()) {
            this._handleOnline();
        } else {
            await this.transport.connect();
        }

        // eslint-disable-next-line no-unused-expressions
        !deviceId ? this._initGlobal(topicsToSubscribe) : this._initDeviceWorld(deviceId, initOptions);

        // synthetic timeout to sync state
        return new Promise(resolve => this.syncPromise = resolve);
    }

    end() {
        this.transport.end();
    }

    attach(device) {
        if (!(device instanceof Device)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    device : 'WRONG_FORMAT'
                },
                message : 'Instance of Device is required'
            });
        }

        device.onAttach(this);
    }

    attachThreshold(threshold) {
        if (!(threshold instanceof Threshold)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    threshold : 'WRONG_FORMAT'
                },
                message : 'Instance of Threshold is required'
            });
        }

        threshold.onAttach(this);
    }

    attachScenario(scenario) {
        if (!(scenario instanceof Scenario)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    scenario : 'WRONG_FORMAT'
                },
                message : 'Instance of Scenario is required'
            });
        }

        scenario.onAttach(this);
    }


    publishToBroker(topic, value, options = {}, cb = null) {
        value = value && typeof value === 'string' ? value.trim() : value;
        if (topic) topic = this.appendRootTopicIfExists(topic);
        this.transport.publish(topic, value, { ...options }, cb || this._handleBrokerError);
    }

    static getRootTopicFrom(userEmail, algorithm = 'sha256') {
        const rootTopic = createHash(algorithm).update(userEmail).digest('hex');

        return rootTopic;
    }

    getRootTopic() {
        return this.deviceTopic;
    }

    getDevices() {
        return _.pickBy(this.devices, d => d._isValid);
    }

    getDiscovery() {
        return this.discovery;
    }

    getThresholds() {
        const res = {};

        for (const scenarioId in this.scenarios) {
            res[scenarioId] = _.filter(this.scenarios[scenarioId].thresholds, th => th._isValid);
        }

        return res;
    }

    getAllThresholds() {
        const res = {};

        for (const scenarioId in this.scenarios) {
            res[scenarioId] = this.scenarios[scenarioId].thresholds;
        }

        return res;
    }

    getThresholdById(scenarioId, id = 'setpoint') {
        const scenario = this.scenarios[scenarioId];

        if (!scenario) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    scenario : 'NOT_FOUND'
                },
                message : `Scenario with id - ${scenarioId} not found`
            });
        }

        return scenario.getThresholdById(id);
    }

    getDeviceById(id) {
        if (!this.devices[id]) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    device : 'NOT_FOUND'
                },
                message : `Device with id - ${id} not found`
            });
        }

        return this.devices[id];
    }

    getScenarioById(id) {
        if (!this.scenarios[id]) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    scenario : 'NOT_FOUND'
                },
                message : `Scenario with id - ${id} not found`
            });
        }

        return this.scenarios[id];
    }

    getScenarios() {
        const res = {};

        for (const scenarioId in this.scenarios) {
            const scenario = this.scenarios[scenarioId];

            if (scenario._isValid) res[scenarioId] = scenario;
        }

        return res;
    }

    getScenariosState() {
        const res = {};

        for (const scenarioId in this.scenarios) {
            const scenario = this.scenarios[scenarioId];

            if (scenario._isValid) res[scenarioId] = scenario.state;
        }

        return res;
    }

    scenarioFindOneOrCreate(scenarioId) {
        this.debug.info('Homie.scenarioFindOneOrCreate', `create with scenarioId=${scenarioId}`);
        const scenario = this.scenarios[scenarioId];

        if (scenario) return scenario;

        const newScenario = new Scenario({ id: scenarioId });

        this.scenarios[scenarioId] = newScenario;

        return newScenario;
    }

    getEntities(type) {
        const list = this.entities[type] || {};

        return _.pickBy(list, e => e._isValid);
    }

    getEntityById(type, id) {
        const entities = this.entities[type];

        if (!entities) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    [type] : 'NOT_FOUND'
                },
                message : `Entities - ${type} not found!`
            });
        }

        const entity = entities[id];

        if (!entity || !entity._isValid) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    id : 'NOT_FOUND'
                },
                message : `Entity - ${type} with id - ${id} not found!`
            });
        }

        return entity;
    }

    getEntityRootTopicByType(type) {
        const EntityClass = this.entitiesStore.classes[type];

        if (!EntityClass) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    [type] : 'NOT_FOUND'
                },
                message : `EntityClass for entity type - ${type} not found!`
            });
        }

        return EntityClass.rootTopic;
    }

    initializeEntityClass(type) {
        const entityDefinition = entitiesScheme.find((E) => E.type === type);

        if (!entityDefinition) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    [type] : 'NOT_FOUND'
                },
                message : `EntityClass for entity type - ${type} not found!`
            });
        }

        this.entitiesStore.initializeEntity(entityDefinition);

        this.entities[type] = this.entities[type] || {};
    }

    destroyEntityClass(type) {
        for (const id in this.entities[type]) this.entities[type][id].delete();
        delete this.entities[type];
        this.entitiesStore.destroyEntity(type);
    }

    request(type, method, payload = {}) {
        const typeTopic = type.toLowerCase().replace('_', '-');
        const requestTopic = `${REQUEST_TOPIC}/${typeTopic}/${method}`;
        const responseEvent = `response.${type}.${method}`;

        const id = getRandomId();

        this.publishToBroker(requestTopic, JSON.stringify({ id, data: payload }), { retain: false });

        return this.createPromisedEvent(responseEvent, null, (response) => {
            if (response.id !== id) return false;
            if (response.error) throw new X(response.error);
            return response.data || {};
        });
    }

    response(type, method, data) {
        if (!data) {
            throw new X({
                code    : WRONG_FORMAT,
                fields  : {},
                message : 'data param is not provided'
            });
        }
        if (!data.id) {
            throw new X({
                code    : WRONG_FORMAT,
                fields  : {},
                message : 'data.id is required'
            });
        }
        const typeTopic = type.toLowerCase().replace('_', '-');
        const responseTopic = `${this.responseTopic}/${typeTopic}/${method}`;

        this.publishToBroker(responseTopic, JSON.stringify(data), { retain: false });
    }

    createPromisedEvent(success, error, successCb = () => false, errorCb = () => false, errorTimeout = 20000) {
        let resolve;
        let reject;

        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        const tId = setTimeout(timeout, errorTimeout);

        const clear = () => {
            resolve = () => {};
            reject = () => {};
            this.off(error, onError);
            this.off(success, onSuccess);
            clearTimeout(tId);
        };

        function timeout() {
            reject(new X({ code: TIMEOUT }));
            clear();
        }

        function onError(data) {
            if (!errorCb(data)) return;

            const field = Object.keys(data)[0];

            reject(new X({ code: VALIDATION, ...data[field] }));
            clear();
        }

        function onSuccess(data) {
            try {
                const res = successCb(data);

                if (res === false) return;
                if (res === true) resolve(data);
                else resolve(res);
                clear();
            } catch (e) {
                reject(e);
                clear();
            }
        }

        if (error) this.on(error, onError);
        if (success) this.on(success, onSuccess);

        return promise;
    }

    _handleBrokerError(error) {
        if (error) {
            const err = {
                code    : BROKER_ERROR,
                fields  : error,
                message : error.message
            };

            this.debug.warning('Homie._handleBrokerError', err);
            this.emit('error', new X(err));
        }
    }

    _initDeviceWorld(id, { subscribeToBridgeTopics = false }) {
        const deviceTopic = `${this.deviceTopic}/${id}/#`;
        const deviceErrTopic = `${this.errorTopic}/${deviceTopic}`;

        let topicsToSubscribe = [
            deviceTopic,
            deviceErrTopic
        ];

        if (subscribeToBridgeTopics) {
            const deviceBridgeTopic = `${this.bridgeTopic}/${id}/#`;

            topicsToSubscribe.push(deviceBridgeTopic);
        }

        topicsToSubscribe = this.appendRootTopicIfExists(topicsToSubscribe);
        this.transport.subscribe(topicsToSubscribe, this._handleSubscribe);
    }

    _initEntitiesStore() {
        if (this.entitiesStore) return;
        this.entitiesStore = new EntitiesStore({
            scheme            : entitiesScheme.filter(({ autoInitialize }) => autoInitialize),
            defaultAttributes : entityDefaultAttributes
        });

        const entitiesTopics = [];

        for (const type in this.entitiesStore.classes) {
            const { rootTopic } = this.entitiesStore.classes[type];

            if (rootTopic) {
                entitiesTopics.push(`${rootTopic}/#`);
            }

            this.entities[type] = {};
        }
    }

    _initGlobal(topicsToSubscribe = [ '#' ]) {
        /**
         * Subscription to # works 3x time faster
         * rather than subscription to each topic
         */
        topicsToSubscribe = this.appendRootTopicIfExists(topicsToSubscribe);
        this.transport.subscribe(topicsToSubscribe, this._handleSubscribe);
    }

    _handleSubscribe() {
        this._waitSyncing();
        if (!this.synced) {
            this.on('synced', () => {
                this.syncPromise();
            });
        } else this.syncPromise();
    }

    _waitSyncing() {
        if (this.synced || this.syncing) return;
        this.syncing = true;
        let timeout;

        const MAX_DELAY = this.syncMaxDelay;
        const startedAt = new Date();
        const synced = () => {
            clearTimeout(timeout);
            this.transport.off('message', resetTimeout);
            this.syncing = false;
            this.synced = true;
            this.emit('synced');
        };
        const resetTimeout = () => {
            if (MAX_DELAY < (new Date() - startedAt)) {
                if (!this.synced) synced();
                return;
            }
            clearTimeout(timeout);
            timeout = setTimeout(synced, this.syncResetTimeout);
        };

        setTimeout(resetTimeout, MAX_DELAY);

        this.transport.on('message', resetTimeout);
    }

    _handleOnline() {
        this.online = true;
        this.emit('online');
        this._waitSyncing();
    }

    _handleOffline() {
        if (this.online === false) return;

        this.online = false;
        this.synced = false;
        this.emit('offline');
    }

    _handleMessage(topic, message) {
        try {
            if (this.rootTopic) {
                if (topic.slice(0, this.rootTopic.length + 1) === `${this.rootTopic}/`) {
                    topic = topic.slice(this.rootTopic.length + 1);
                } else return; // ignore
            }

            const value = message.toString();

            const { event, translated } = this.translator.parseTopic(topic, value);

            switch (event) {
                case EVENT_PUBLISH:
                    this._handlePublishMessage(translated);
                    break;
                case EVENT_SET:
                    this._handleSetMessage(translated);
                    break;
                case EVENT_CREATE:
                    this._handleCreateMessage(translated);
                    break;
                case EVENT_UPDATE:
                    this._handleUpdateMessage(translated);
                    break;
                case EVENT_DELETE:
                    this._handleDeleteMessage(translated);
                    break;
                case EVENT_ERROR:
                    this._handleErrorMessage(translated);
                    break;
                case EVENT_EVENT:
                    this._handleEventMessage(translated);
                    break;
                case EVENT_DISCOVERY:
                    this._handleDiscoveryMessage(translated);
                    break;
                case EVENT_REQUEST:
                    this._handleRequestMessage(translated);
                    break;
                case EVENT_RESPONSE:
                    this._handleResponseMessage(translated);
                    break;
                default:
                    return;
            }
        } catch (e) {
            this.debug.warning('Homie._handleMessage', e);
        }
    }

    /**
     * Emitting events
     *
     * DEVICE_ATTRS - "homie.publish.<device_id>"
     * NODE_ATTRS - "homie.publish.<device_id>.<node_id>"
     * SENSOR_PROPS | SENSOR_ATTRS - "homie.publish.<device_id>.<node_id>.<sensor_id>"
     * DEVICE_PROP_OPTION_PROPS | DEVICE_PROP_OPTION_ATTRS - "homie.publish.<device_id>.options|telemetry.<property_id>"
     * NODE_PROP_OPTION_PROPS | NODE_PROP_OPTION_ATTRS - "homie.publish.<device_id>.<node_id>.options|telemetry.<property_id>"
     * THRESHOLD_ATTR - "homie.publish.threshold.<scenario_id>.<threshold_id>"
     * ENTITY_ATTR - "homie.publish.entity.<entity_alias>.<entity_id>"
     */
    _handlePublishMessage(data) {
        const { type, options, topicLen } = data;
        const {
            deviceId,
            nodeId,
            propertyId,
            translated,
            attribute,
            entityId,
            entityType,
            thresholdId,
            scenarioId
        } = options;
        let eventName = 'homie.publish';

        switch (type) {
            case DEVICE_ATTRS:
                eventName += `.${deviceId}`;
                break;
            case NODE_ATTRS:
                eventName += `.${deviceId}.${nodeId}`;
                break;
            case SENSOR_ATTRS:
            case SENSOR_PROPS:
                eventName += `.${deviceId}.${nodeId}.${propertyId}`;
                break;
            case DEVICE_PROP_OPTION_ATTRS:
            case DEVICE_PROP_OPTION_PROPS:
                eventName += `.${deviceId}.${attribute}.${propertyId}`;
                break;
            case NODE_PROP_OPTION_ATTRS:
            case NODE_PROP_OPTION_PROPS:
                eventName += `.${deviceId}.${nodeId}.${attribute}.${propertyId}`;
                break;
            case HEARTBEAT_ATTR:
                eventName += `.heartbeat.${propertyId}`;
                break;
            case SCENARIO_ATTR:
                eventName += `.scenario.${scenarioId}`;
                break;
            case THRESHOLD_ATTR:
                eventName += `.threshold.${scenarioId}.${thresholdId}`;
                break;
            case ENTITY_ATTR:
                eventName += `.entity.${entityType}.${entityId}`;
                break;
            default:
                return;
        }

        this.debug.info('Homie._handlePublishMessage', `eventName=${eventName} options=${JSON.stringify(options)}`);
        this._update(options, type, topicLen);
        this.emit(eventName, translated);
    }

    /**
     * Emitting events
     *
     * DEVICE_ATTRS - "homie.set.<device_id>"
     * NODE_ATTRS - "homie.set.<device_id>.<node_id>"
     * SENSOR_PROPS - "homie.set.<device_id>.<node_id>.<sensor_id>"
     * SENSOR_ATTRS - "homie.set.<device_id>.<node_id>.<sensor_id>"
     * DEVICE_PROP_OPTION_PROPS - "homie.set.<device_isd>.options|telemetry.<property_id>"
     * NODE_PROP_OPTION_PROPS - "homie.set.<device_id>.<node_id>.options|telemetry.<property_id>"
     * NODE_PROP_OPTION_ATTRS - "homie.set.<device_id>.<node_id>.options|telemetry.<property_id>"
     * HEARTBEAT_ATTR - "homie.set.heartbeat.<device_id>"
     * THRESHOLD_ATTR - "homie.set.threshold.<scenario_id>.<threshold_id>"
     * ENTITY_ATTR - "homie.set.entity.<entity_alias>.<entity_id>"
     */
    _handleSetMessage(data) {
        const { type, options } = data;
        const {
            deviceId,
            nodeId,
            propertyId,
            translated,
            attribute,
            entityId,
            entityType,
            thresholdId,
            scenarioId
        } = options;
        let eventName = 'homie.set';

        switch (type) {
            case DEVICE_ATTRS:
                eventName += `.${deviceId}`;
                break;
            case NODE_ATTRS:
                eventName += `.${deviceId}.${nodeId}`;
                break;
            case SENSOR_ATTRS:
            case SENSOR_PROPS:
                eventName += `.${deviceId}.${nodeId}.${propertyId}`;
                break;
            case DEVICE_PROP_OPTION_PROPS:
            case DEVICE_PROP_OPTION_ATTRS:
                eventName += `.${deviceId}.${attribute}.${propertyId}`;
                break;
            case NODE_PROP_OPTION_ATTRS:
            case NODE_PROP_OPTION_PROPS:
                eventName += `.${deviceId}.${nodeId}.${attribute}.${propertyId}`;
                break;
            case HEARTBEAT_ATTR:
                eventName += `.heartbeat.${propertyId}`;
                break;
            case ENTITY_ATTR:
                eventName += `.entity.${entityType}.${entityId}`;
                break;
            case SCENARIO_ATTR:
                eventName += `.scenario.${scenarioId}`;
                break;
            case THRESHOLD_ATTR:
                eventName += `.threshold.${scenarioId}.${thresholdId}`;
                break;
            default:
                return;
        }

        this.debug.info('Homie._handleSetMessage', `eventName=${eventName} options=${JSON.stringify(options)}`);
        this.emit(eventName, translated);
    }

    _handleCreateMessage(data) {
        const { options } = data;
        const {
            entityType
        } = options;
        const eventName = `homie.entity.${entityType}.create`;

        options.entityId = options.entityId || this.entitiesStore.getUniqueId();
        this.emit(eventName, options);
    }

    _handleUpdateMessage(data) {
        const { options } = data;
        const {
            translated,
            entityId,
            entityType
        } = options;
        const eventName = `homie.entity.${entityType}.${entityId}.update`;

        this.emit(eventName, translated);
    }

    _handleDeleteMessage(data) {
        const { options } = data;
        const {
            entityId,
            entityType
        } = options;
        const eventName = `homie.entity.${entityType}.${entityId}.delete`;

        this.emit(eventName);
    }

    /**
     * Emitting events
     *
     * DEVICE_ATTRS - "homie.error.<device_id>"
     * NODE_ATTRS - "homie.error.<device_id>.<node_id>"
     * SENSOR_PROPS - "homie.error.<device_id>.<node_id>.<sensor_id>"
     * DEVICE_PROP_OPTION_PROPS - "homie.error.<device_id>.options|telemetry.<property_id>"
     * NODE_PROP_OPTION_PROPS - "homie.error.<device_id>.<node_id>.options|telemetry.<property_id>"
     * THRESHOLD_ATTR - "homie.error.threshold.<scenario_id>.<threshold_id>"
     * ENTITY_ATTR - "homie.error.entity.<entity_alias>.<entity_id>"
     * ENTITY - "homie.error.entity.<entity_alias>.<entity_id>"
     */
    _handleErrorMessage(data) {
        const { type, options } = data;
        const {
            deviceId,
            nodeId,
            propertyId,
            translated,
            attribute,
            entityId,
            entityType,
            scenarioId,
            thresholdId
        } = options;
        let eventName = 'homie.error';

        switch (type) {
            case DEVICE_ATTRS:
                eventName += `.${deviceId}`;
                break;
            case NODE_ATTRS:
                eventName += `.${deviceId}.${nodeId}`;
                break;
            case SENSOR_ATTRS:
            case SENSOR_PROPS:
                eventName += `.${deviceId}.${nodeId}.${propertyId}`;
                break;
            case DEVICE_PROP_OPTION_PROPS:
            case DEVICE_PROP_OPTION_ATTRS:
                eventName += `.${deviceId}.${attribute}.${propertyId}`;
                break;
            case NODE_PROP_OPTION_PROPS:
            case NODE_PROP_OPTION_ATTRS:
                eventName += `.${deviceId}.${nodeId}.${attribute}.${propertyId}`;
                break;
            case ENTITY_ATTR:
                eventName += `.entity.${entityType}.${entityId}`;
                break;
            case ENTITY:
                eventName += `.entity.${entityType}.${entityId}`;
                break;
            case SCENARIO_ATTR:
                eventName += `.scenario.${scenarioId}`;
                break;
            case THRESHOLD_ATTR:
                eventName += `.threshold.${scenarioId}.${thresholdId}`;
                break;
            default:
                return;
        }

        this.debug.info('Homie._handleErrorMessage', `eventName=${eventName} options=${JSON.stringify(options)}`);
        this.emit(eventName, translated);
    }

    _handleEventMessage(data) {
        const { type, options } = data;
        const { translated } = options;
        const event = `events.${type}`;

        this.emit(event, translated);
    }
    _handleRequestMessage({ type, options }) {
        const { translated, method } = options;
        const { value } = translated;
        const event = `request.${type}.${method}`;

        this.emit(event, value);
    }
    _handleResponseMessage({ type, options }) {
        const { translated, method } = options;
        const { value } = translated;
        const event = `response.${type}.${method}`;

        this.emit(event, value);
    }

    _handleDiscoveryMessage(data) {
        const { type, options } = data;
        const {
            translated,
            deviceId
        } = options;

        let eventName = 'discovery';

        const payload = {
            id : deviceId
        };

        switch (type) {
            case DISCOVERY_NEW:
                eventName += '.new';
                payload.name = translated.value;

                break;
            default:
                return;
        }

        this.debug.info('Homie._handleDiscoveryMessage', `eventName=${eventName} options=${JSON.stringify(options)}`);
        this.emit(eventName, payload);
    }

    _deleteDevice(device) {
        try {
            const deviceId = device.id;

            this.debug.info('Homie._deleteDevice', `deleting device=${deviceId}`);

            device.delete();

            _.unset(this.devices, `${deviceId}`);
            // this.emit('events.delete.success', { type: 'DEVICE', deviceId });
        } catch (e) {
            this.debug.warning('Homie._deleteDevice', e);
        }
    }

    _deleteNode(node) {
        try {
            const device = node.device;
            const deviceId = device.id;
            const nodeId = node.id;

            this.debug.info('Homie._deleteNode', `deleting device=${deviceId} node=${nodeId}`);

            device.removeNodeById(node.id);
            node.delete();
            // this.emit('events.delete.success', { type: 'NODE', deviceId, nodeId });
        } catch (e) {
            this.debug.warning('Homie._deleteNode', e);
        }
    }

    _deleteEntity(entity) {
        try {
            const entityId = entity.id;
            const type = entity.getType();

            this.debug.info('Homie._deleteEntity', `deleting ${type} entity=${entityId}`);

            entity.delete();

            _.unset(this.entities[type], `${entityId}`);
            // this.emit('events.delete.success', { type, entityId });
        } catch (e) {
            this.debug.warning('Homie._deleteEntity', e);
        }
    }

    _deleteThreshold(threshold) {
        try {
            const scenarioId = threshold.getScenarioId();
            const thresholdId = threshold.getId();
            const scenario = this.scenarios[scenarioId];

            this.debug.info('Homie._deleteThreshold', `deleting threshold threshodId=${thresholdId} scenarioId=${scenarioId}`);

            if (!scenario) {
                throw new X({
                    code   : NOT_FOUND,
                    fields : {
                        scenario : 'NOT_FOUND'
                    },
                    message : `Scenario with id - ${scenarioId} not found`
                });
            }

            threshold._delete();

            scenario.removeThresholdById(thresholdId);
            // this.emit('events.delete.success', {
            //     type : 'THRESHOLD',
            //     scenarioId,
            //     thresholdId
            // });
        } catch (e) {
            this.debug.warning('Homie._deleteThreshold', e);
        }
    }

    _deleteScenario(scenarioId) {
        try {
            this.debug.info('Homie._deleteScenario', `deleting scenario scenarioId=${scenarioId}`);
            const scenario = this.scenarios[scenarioId];

            if (!scenario) {
                throw new X({
                    code   : NOT_FOUND,
                    fields : {
                        scenario : 'NOT_FOUND'
                    },
                    message : `Scenario with id - ${scenarioId} not found`
                });
            }

            scenario.delete();

            _.unset(this.scenarios, `${scenarioId}`);
        } catch (e) {
            this.debug.warning('Homie._deleteScenario', e);
        }
    }

    _update(options, type, topicLen) {
        const { translated } = options;
        const key = Object.keys(translated)[0];

        if (!key) {
            this.debug.warning('Homie._update', `skip translation for topic that not declared in ETL config options=${JSON.stringify(options)}`);
            return;
        }

        options.key = key;

        const updMethod = UPD_METHODS[topicLen][type];

        if (!this[updMethod]) {
            this.debug.warning('Homie._update', `updMethod not found for options=${JSON.stringify(options)}`);
            return;
        }

        this.debug.info('Homie._update', `updMethod=${updMethod} options=${JSON.stringify(options)}`);
        this[updMethod](options);
    }

    _thresholdFindOneOrCreate({ id, scenarioId }) {
        // eslint-disable-next-line more/force-native-methods
        const scenario = this.scenarios[scenarioId];
        const th = _.find(scenario.thresholds, { id });

        if (th) return th;
        this.debug.info('Homie._thresholdFindOneOrCreate', `create with id=${id} scenarioId=${scenarioId}`);
        const newTh = new Threshold({ id, scenarioId });

        scenario.addThreshold(newTh);

        return newTh;
    }

    _deviceFindOneOrCreate({ id }) {
        if (this.devices[id]) return this.devices[id];
        if (!this.devicesPartialState[id]) {
            this.debug.info('Homie._deviceFindOneOrCreate', `create with id=${id}`);
            this.devicesPartialState[id] = new Device({ id });
        }

        return this.devicesPartialState[id];
    }

    _nodeFindOneOrCreate({ device, id }) {
        let node = device.nodes.find(n => n.id === id);

        if (!node) {
            this.debug.info('Homie._nodeFindOneOrCreate', `create with id=${id}`);
            node = new Node({ id });
            node.setDevice(device);
            device.nodes.push(node);
        }

        return node;
    }

    _propertyFindOneOrCreate({ device, id, attribute, node = null }) {
        if (node) {
            let nProp = node[attribute].find(prop => prop.id === id);

            if (!nProp) {
                this.debug.info('Homie._nodeFindOneOrCreate', `NODE create ${attribute} with id=${id}`);
                nProp = attribute === 'sensors' ? new Sensor({ id }) : new Property({ id });

                nProp._eventPrefix = attribute === 'sensors' ? '' : attribute;
                nProp.setNode(node);
                nProp.setDevice(device);
                node[attribute].push(nProp);
            }

            return nProp;
        }

        let dProp = device[attribute].find(prop => prop.id === id);

        if (!dProp) {
            this.debug.info('Homie._nodeFindOneOrCreate', `DEVICE create ${attribute} with id=${id}`);
            dProp = new Property({ id });

            dProp._eventPrefix = attribute;
            dProp.setDevice(device);
            device[attribute].push(dProp);
        }

        return dProp;
    }

    _entityFindOneOrCreate({ entityId, entityType }) {
        if (!this.entities[entityType]) this.entities[entityType] = {};
        if (!this.entities[entityType][entityId]) this.entities[entityType][entityId] = new this.entitiesStore.classes[entityType]({ id: entityId });

        return this.entities[entityType][entityId];
    }

    _addDevice(device) {
        const id = device.getId();

        this.devices[id] = device;

        this.attach(device);

        delete this.devicesPartialState[id];

        this.debug.info('Homie._addDevice', `id=${id}`);
        this.emit('new_device', { deviceId: id });
    }

    _addNode(node) {
        try {
            const { device } = node;
            const deviceId = device.getId();
            const id = node.getId();

            if (!device._isValid) return; // device in sync process

            this.debug.info('Homie._addNode', `id=${id}`);
            this.emit('new_node', { deviceId, nodeId: id });
            device._attachNewInstance(node, { type: 'NODE', device, node });
        } catch (e) {
            this.debug.warning('Homie._addNode', e);
        }
    }

    _addProperty(property, type) {
        try {
            const { device, node } = property;
            const deviceId = device.getId();
            const nodeId = node ? node.getId() : null;
            const id = property.getId();

            if (!device._isValid) return; // device in sync process
            if (node && !node._isValid) return; // node in sync process

            this.debug.info('Homie._addProperty', `property=${type} id=${id}`);
            switch (type) {
                case 'sensor':
                    this.emit(`new_${type}`, { deviceId, nodeId, sensorId: id });
                    break;
                case 'device_option':
                case 'node_option':
                    this.emit(`new_${type}`, { deviceId, nodeId, optionId: id });
                    break;
                case 'device_telemetry':
                case 'node_telemetry':
                    this.emit(`new_${type}`, { deviceId, nodeId, telemetryId: id });
                    break;
                default:
                    break;
            }

            device._attachNewInstance(property, { type: type.toUpperCase(), device, node, property });
        } catch (e) {
            this.debug.warning('Homie._addProperty', e);
        }
    }

    _updateNodePropertyState({ translated, deviceId, nodeId, propertyId, attribute, key }) {
        const device = this._deviceFindOneOrCreate({ id: deviceId });
        const node = this._nodeFindOneOrCreate({ device, id: nodeId });

        switch (attribute) {
            case 'sensors': {
                const sensor = this._propertyFindOneOrCreate({ device, node, id: propertyId, attribute });

                this._updatePropertyState({ translated, property: sensor, type: 'sensor', key });
                break;
            }
            case 'options': {
                const option = this._propertyFindOneOrCreate({ device, node, id: propertyId, attribute });

                this._updatePropertyState({ translated, property: option, type: 'node_option', key });
                break;
            }
            case 'telemetry': {
                const telemetry = this._propertyFindOneOrCreate({ device, node, id: propertyId, attribute });

                this._updatePropertyState({ translated, property: telemetry, type: 'node_telemetry', key });
                break;
            }
            default:
                break;
        }
    }

    _updateDevicePropertyState({ translated, deviceId, nodeId, propertyId, attribute, key }) {
        const device = this._deviceFindOneOrCreate({ id: deviceId });

        switch (attribute) {
            case 'nodes': {
                const node = this._nodeFindOneOrCreate({ device, id: nodeId });

                this._updateNodeState({ translated, node, key });
                break;
            }
            case 'options': {
                const option = this._propertyFindOneOrCreate({ device, id: propertyId, attribute });

                this._updatePropertyState({ translated, property: option, type: 'device_option', key });
                break;
            }
            case 'telemetry': {
                const telemetry = this._propertyFindOneOrCreate({ device, id: propertyId, attribute });

                this._updatePropertyState({ translated, property: telemetry, type: 'device_telemetry', key });
                break;
            }
            default:
                break;
        }
    }

    _updatePropertyState({ translated, property, type, key }) {
        if (Array.isArray(translated[key])) {
            translated[key].forEach(id => {
                switch (key) {
                    case 'groups':
                        this._entityFindOneOrCreate({ entityId: id, entityType: 'GROUP_OF_PROPERTIES' });
                        property.addGroup(id);
                        break;
                    default:
                        break;
                }
            });

            return;
        }

        try {
            property.updateAttribute(translated);
            if (!property._isValid) {
                property.validateMyStructure();

                this._addProperty(property, type);
            }
        } catch (e) {
            this.debug.warning('Homie._updatePropertyState', `validation error property=${property.id}`, translated);
        }
        if (!property._isValid) {
            if (property.device.isEmpty()) {
                this._deleteDevice(property.device);
            } else if (property.node.isEmpty()) {
                this._deleteNode(property.node);
            }
        }
    }

    _updateNodeState({ translated, node, key }) {
        const { device } = node;

        if (Array.isArray(translated[key])) {
            translated[key].forEach(id => {
                this._propertyFindOneOrCreate({ device, id, attribute: key, node });
            });

            return;
        }

        const validBefore = node._isValid;

        try {
            node.updateAttribute(translated);

            if (!node._isValid) {
                node.validateMyStructure();

                this._addNode(node);
            }
        } catch (e) {
            this.debug.warning('Homie._updateNodeState', `validation error node=${node.id}`, translated);
        }
        if (!node._isValid) {
            if (validBefore) {
                this.emit('events.delete.success', { type: 'NODE', deviceId: device.id, nodeId: node.id });
            }
            if (device.isEmpty()) {
                this._deleteDevice(device);
            } else if (node.isEmpty()) {
                this._deleteNode(node);
            }
        }
    }

    _updateDeviceState({ translated, deviceId, key }) {
        const device = this._deviceFindOneOrCreate({ id: deviceId });

        if (Array.isArray(translated[key])) {
            translated[key].forEach(id => {
                switch (key) {
                    case 'nodes':
                        this._nodeFindOneOrCreate({ device, id });
                        break;
                    case 'telemetry':
                    case 'options': {
                        this._propertyFindOneOrCreate({ device, id, attribute: key });
                        break;
                    }
                    default:
                        break;
                }
            });

            return;
        }

        const validBefore = device._isValid;

        try {
            device.updateAttribute(translated);
            if (!device._isValid) {
                device.validateMyStructure();

                this._addDevice(device);
            }
        } catch (e) {
            this.debug.info('Homie._updateDeviceState', `validation error device=${device.id}`, translated);
        }
        if (!device._isValid) {
            if (validBefore) {
                this.emit('events.delete.success', { type: 'DEVICE', deviceId: device.id });
            }
            if (device.isEmpty()) {
                this._deleteDevice(device);
            }
        }
    }

    _updateScenarioState({ translated, scenarioId, key }) {
        if (!scenarioId) return;

        const scenario = this.scenarioFindOneOrCreate(scenarioId);

        if (Array.isArray(translated[key])) {
            translated[key].forEach(id => {
                if (key === 'thresholds') this._thresholdFindOneOrCreate({ id, scenarioId });
            });

            return;
        }

        const validBefore = scenario._isValid;

        try {
            scenario.updateAttribute(translated);
            if (!scenario._isValid) {
                scenario.validateMyStructure();
                this.attachScenario(scenario);

                this.emit('new_scenario', { scenarioId });
            }
        } catch (e) {
            this.debug.info('Homie._updateScenarioState', `validation error scenario=${scenarioId}`, translated);
        }

        if (!scenario._isValid) {
            if (validBefore) {
                this.emit('events.delete.success', {
                    type : 'SCENARIO',
                    scenarioId
                });
            }

            if (scenario.isEmpty()) this._deleteScenario(scenarioId);
        }
    }

    _updateThresholdState({ translated, scenarioId, thresholdId }) {
        if (!thresholdId) return;

        this.scenarioFindOneOrCreate(scenarioId);
        const threshold = this._thresholdFindOneOrCreate({ id: thresholdId, scenarioId });

        const validBefore = threshold._isValid;

        try {
            threshold.updateAttribute(translated);
            if (!threshold._isValid) {
                threshold.validateMyStructure();

                this.emit('new_threshold', { thresholdId: threshold.id, scenarioId: threshold.scenarioId });
            }
        } catch (e) {
            this.debug.info('Homie._updateThresholdState', `validation error threshold=${threshold.id}`, translated);
        }

        if (!threshold._isValid) {
            if (validBefore) {
                this.emit('events.delete.success', {
                    type : 'THRESHOLD',
                    scenarioId,
                    thresholdId
                });
            }
            if (threshold.isEmpty()) this._deleteThreshold(threshold);
        }
    }

    _updateEntityState({ translated, entityId, entityType, key }) {
        if (Array.isArray(translated[key])) {
            translated[key].forEach(id => this._entityFindOneOrCreate({ entityId: id, entityType }));

            return;
        }

        const entity = this._entityFindOneOrCreate({ entityId, entityType });

        const validBefore = entity._isValid;

        try {
            entity.updateAttribute(translated);

            if (entity.isEmpty()) return this._deleteEntity(entity);

            if (!entity._isValid) {
                entity.validateMyStructure();
                entity.onAttach(this);

                const payload = { entityId: entity.id, type: entity.getType() };

                this.emit('new_entity', payload);
            }
        } catch (e) {
            this.debug.info('Homie._updateEntityState', `validation error entity=${entity.id}`, translated);
        }

        if (!entity._isValid && validBefore) {
            this.emit('events.delete.success', { type: entityType, entityId });
            this._deleteEntity(entity);
        }
    }

    /**
     * MicroCloud API
     * Returns homie instance by topic
     * @param {String} topic
     */
    getInstanceByTopic(topic) {
        if (!topic) return;

        this.debug.info('Homie.getInstanceByTopic', topic);

        try {
            const { event, translated } = this.translator.parseTopic(topic);

            switch (event) {
                case EVENT_PUBLISH:
                    return this._getInstanceByParsedTopic(translated);
                default:
                    return;
            }
        } catch (e) {
            this.debug.warning('Homie.getInstanceByTopic', e);
        }
    }

    _getInstanceByParsedTopic(data) {
        this.debug.info('Homie._getInstanceByParsedTopic', data);

        const { type, options } = data;

        const {
            deviceId,
            nodeId,
            propertyId,
            attribute,
            entityId,
            entityType,
            thresholdId,
            scenarioId
        } = options;

        let instance;
        let instanceType;

        switch (type) {
            case DEVICE_ATTRS:
                instance = this.getDeviceById(deviceId);
                instanceType = 'DEVICE';
                break;
            case NODE_ATTRS:
                instance = this.getDeviceById(deviceId).getNodeById(nodeId);
                instanceType = 'NODE';
                break;
            case SENSOR_ATTRS:
            case SENSOR_PROPS:
                instance = this.getDeviceById(deviceId).getNodeById(nodeId).getSensorById(propertyId);
                instanceType = 'SENSOR';
                break;
            case DEVICE_PROP_OPTION_ATTRS:
            case DEVICE_PROP_OPTION_PROPS:
                switch (attribute) {
                    case 'options':
                        instance = this.getDeviceById(deviceId).getOptionById(propertyId);
                        instanceType = 'DEVICE_OPTION';
                        break;
                    case 'telemetry':
                        instance = this.getDeviceById(deviceId).getTelemetryById(propertyId);
                        instanceType = 'DEVICE_TELEMETRY';
                        break;
                    default:
                        break;
                }
                break;
            case NODE_PROP_OPTION_ATTRS:
            case NODE_PROP_OPTION_PROPS:
                switch (attribute) {
                    case 'options':
                        instance = this.getDeviceById(deviceId).getNodeById(nodeId).getOptionById(propertyId);
                        instanceType = 'NODE_OPTION';
                        break;
                    case 'telemetry':
                        instance = this.getDeviceById(deviceId).getNodeById(nodeId).getTelemetryById(propertyId);
                        instanceType = 'NODE_TELEMETRY';
                        break;
                    default:
                        break;
                }
                break;
            case SCENARIO_ATTR:
                instance = this.getScenarioById(scenarioId);
                instanceType = 'SCENARIO';
                break;
            case THRESHOLD_ATTR:
                instance = this.getThresholdById(scenarioId, thresholdId);
                instanceType = 'THRESHOLD';
                break;
            case ENTITY_ATTR:
                instance = this.getEntityById(entityType, entityId);
                instanceType = entityType;
                break;
            default:
                break;
        }

        return { instance, type: instanceType };
    }

    /**
     * MicroCloud API
     * Returns object with firmware names as keys and arrays of devices which have current
     * firmware name as values
     * @param {String[]} types - An array of firmware names
     */
    getDevicesByTypes(types) {
        const devices = this.getDevices();
        const res = {};

        for (const type of types) {
            res[type] = [];
        }

        for (const deviceId of Object.keys(devices)) {
            const device = devices[deviceId];
            const fwName = device.getFirmwareName();

            if (types.includes(fwName)) res[fwName].push(device);
        }

        return res;
    }

    appendRootTopicIfExists(topic) {
        if (!this.rootTopic) return topic;

        return Array.isArray(topic) ?
            topic.map(x => `${this.rootTopic}/${x}`) :
            `${this.rootTopic}/${topic}`;
    }

    subscribe(topic, cb) {
        this.transport.subscribe(this.appendRootTopicIfExists(topic), cb);
    }

    unsubscribe(topic, cb) {
        this.transport.unsubscribe(this.appendRootTopicIfExists(topic), cb);
    }
}

module.exports = Homie;
