/* eslint-disable no-require-lodash/no-require-lodash */
/* eslint-disable newline-before-return */
/* eslint-disable max-len */
const _ = require('lodash');
const Debugger = require('./../utils/debugger');
const Node = require('./../Node');
const Property = require('./../Property');
const X = require('./../utils/X');
const etl = require('./../etl');
const { ERROR_CODES: { NOT_SETTABLE, NOT_FOUND, WRONG_FORMAT, EXISTS } } = require('./../etc/config');

const { validateStructure, validate } = require('./validation');
const { DEFAULT_ATTRIBUTES, SETTABLE_SETTINGS } = require('./config');

class Device {
    constructor({ id }) {
        const validated = validate({ id });

        this.id = validated.id;
        this.name = '';
        this.firmwareName = '';
        this.firmwareVersion = '';
        this.localIp = '';
        this.mac = '';
        this.implementation = '';
        this.state = '';
        this.nodes = [];
        this.options = [];
        this.telemetry = [];

        // DEVICE SETTINGS //

        this.title = '';

        // END //

        this._isValid = false;
        this._isAttached = false;
        this._homie = null;
        this._type = 'DEVICE';
        this._rawAttributes = {};
        this._isEmpty = true;
        this._groupsMap = {};

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;
        this._heartbeatCallback = null;

        this._publishHandler = this._publishHandler.bind(this);
        this._setHandler = this._setHandler.bind(this);
        this._errorHandler = this._errorHandler.bind(this);

        this.debug = new Debugger();
    }

    validateMyStructure() {
        const {
            id,
            name,
            firmwareName,
            firmwareVersion,
            localIp,
            mac,
            implementation,
            state,
            nodes,
            options,
            telemetry
        } = this;

        try {
            validateStructure({
                ...DEFAULT_ATTRIBUTES,
                options,
                telemetry,
                nodes,
                name,
                firmwareName,
                firmwareVersion,
                localIp,
                mac,
                implementation,
                state,
                ...this._rawAttributes,
                id
            });

            this._isValid = !this.isEmpty();
            if (!this._isValid) this.deleteHandlers();
        } catch (e) {
            this._isValid = false;
            this.deleteHandlers();
            throw e;
        }
    }

    onAttach(homie) {
        this._isAttached = true;
        this._homie = homie;

        this.nodes.forEach(node => {
            node.onAttach(homie);
        });

        this.options.forEach(option => {
            option.onAttach(homie);
        });

        this.telemetry.forEach(telemetry => {
            telemetry.onAttach(homie);
        });
    }

    onDetach() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
        this._homie = null;
        this._isAttached = false;

        this.nodes.forEach(node => {
            node.onDetach();
        });

        this.options.forEach(option => {
            option.onDetach();
        });

        this.telemetry.forEach(telemetry => {
            telemetry.onDetach();
        });
    }

    serialize() {
        return {
            id              : this.id,
            name            : this.name,
            nodes           : this.nodes.map(this._serializeInstance).filter(i => i),
            options         : this.options.map(this._serializeInstance).filter(i => i),
            telemetry       : this.telemetry.map(this._serializeInstance).filter(i => i),
            firmwareName    : this.firmwareName,
            firmwareVersion : this.firmwareVersion,
            localIp         : this.localIp,
            mac             : this.mac,
            implementation  : this.implementation,
            state           : this.state,
            rootTopic       : this.getRootTopic(),
            title           : this.title
        };
    }

    setSettingAttribute(attribute, value) {
        if (!SETTABLE_SETTINGS.includes(attribute)) {
            throw new X({
                code   : NOT_SETTABLE,
                fields : {
                    [attribute] : 'NOT_SETTABLE'
                },
                message : `Attribute ${attribute} not settable`
            });
        }

        const translated = etl.translateObjToTopic(this._type, { [attribute]: value }, this.getTopic());
        const topic = `${this._homie.deviceSettingsTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(`${topic}/set`, `${value}`, { retain: false });

        const handler = data => {
            if (data[attribute] !== undefined) return true;

            return false;
        };

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            handler,
            handler
        );
    }

    publishAttribute(attribute, value) {
        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.deviceTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, value);
    }

    publishSetting(attribute, value) {
        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.deviceSettingsTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, value);
    }

    publishSettingError(setting, error = { code: 'ERROR', message: 'Something went wrong' }) {
        const translated = etl.translateObjToTopic(this._type, {
            [setting] : ''
        }, this.getTopic());

        const topic = `${this._homie.errorTopic}/${this._homie.deviceSettingsTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, JSON.stringify(error), { retain: false });
    }

    getRootTopic() {
        return this._homie ? `${this._homie.deviceTopic}/${this.getTopic()}` : this.getTopic();
    }

    getRootSettingTopic() {
        return this._homie ? `${this._homie.deviceSettingsTopic}/${this.getTopic()}` : this.getTopic();
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getNodes() {
        return this.nodes;
    }

    getOptions() {
        return this.options;
    }

    getTelemetry() {
        return this.telemetry;
    }

    getTitle() {
        return this.title;
    }

    getNodeById(id) {
        const node = this.nodes.find(el => el.getId() === id);

        if (!node) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    node : 'NOT_FOUND'
                }
            });
        }

        return node;
    }

    getOptionById(id) {
        const option = this.options.find(el => el.getId() === id);

        if (!option) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    option : 'NOT_FOUND'
                }
            });
        }

        return option;
    }

    getTelemetryById(id) {
        const telemetry = this.telemetry.find(el => el.getId() === id);

        if (!telemetry) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    telemetry : 'NOT_FOUND'
                }
            });
        }

        return telemetry;
    }

    getFirmwareName() {
        return this.firmwareName;
    }

    getFirmwareVersion() {
        return this.firmwareVersion;
    }

    getLocalIp() {
        return this.localIp;
    }

    getMac() {
        return this.mac;
    }

    getImplementation() {
        return this.implementation;
    }

    getState() {
        return this.state;
    }

    updateAttribute(data) {
        for (const [ key, value ] of Object.entries(data)) {
            this._rawAttributes[key] = value;
        }
        this._isEmpty = !Object.values(this._rawAttributes).filter(v => v).length;

        try {
            const validated = validate(data);

            Object.keys(validated).forEach(attr => {
                this[attr] = validated[attr];
            });
        } catch (e) {
            this._isValid = false;
            this.deleteHandlers();
            throw e;
        }
    }
    isEmpty() {
        return this._isEmpty
            && this.nodes.every(e => e.isEmpty())
            && this.options.every(e => e.isEmpty())
            && this.telemetry.every(e => e.isEmpty());
    }

    addNode(node) {
        if (!(node instanceof Node)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    node : 'WRONG_FORMAT'
                }
            });
        }

        const n = this.nodes.find(({ id }) => id === node.id);

        if (n) {
            throw new X({
                code   : EXISTS,
                fields : {
                    node : 'EXISTS'
                }
            });
        }

        this.nodes.push(node);
        node.setDevice(this);
    }

    addOption(option) {
        if (!(option instanceof Property)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    option : 'WRONG_FORMAT'
                }
            });
        }

        const n = this.options.find(({ id }) => id === option.id);

        if (n) {
            throw new X({
                code   : EXISTS,
                fields : {
                    option : 'EXISTS'
                }
            });
        }

        this.options.push(option);
        option.setDevice(this);
    }

    addTelemetry(telemetry) {
        if (!(telemetry instanceof Property)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    telemetry : 'WRONG_FORMAT'
                }
            });
        }

        const t = this.telemetry.find(({ id }) => id === telemetry.id);

        if (t) {
            throw new X({
                code   : EXISTS,
                fields : {
                    telemetry : 'EXISTS'
                }
            });
        }

        this.telemetry.push(telemetry);
        telemetry.setDevice(this);
    }

    removeOptionById(id) {
        const option = this.options.find(el => el.getId() === id);

        if (!option) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    option : 'NOT_FOUND'
                }
            });
        }

        option.unsetDevice();
        _.remove(this.options, (o) => o.id === id);
    }

    removeTelemetryById(id) {
        const telemetry = this.telemetry.find(el => el.getId() === id);

        if (!telemetry) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    telemetry : 'NOT_FOUND'
                }
            });
        }

        telemetry.unsetDevice();
        _.remove(this.telemetry, (t) => t.id === id);
    }

    removeNodeById(id) {
        const node = this.nodes.find(el => el.getId() === id);

        if (!node) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    node : 'NOT_FOUND'
                }
            });
        }

        node.unsetDevice();
        _.remove(this.nodes, (n) => n.id === id);
    }

    deleteHandlers() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
        this.nodes.forEach(node => node.deleteHandlers());
        this.options.forEach(option => option.deleteHandlers());
        this.telemetry.forEach(telemetry => telemetry.deleteHandlers());
    }
    delete() {
        this.deleteHandlers();

        this.name = '';
        this.firmwareName = '';
        this.firmwareVersion = '';
        this.localIp = '';
        this.mac = '';
        this.implementation = '';
        this.state = '';

        this.title = '';
        this.lastHeartbeatAt = '';

        this._isValid = false;
        this._isAttached = false;
        this._groupsMap = {};

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;

        this.nodes.forEach(node => {
            node.delete();
            node.sensors.forEach(sensor => sensor._delete());
            node.options.forEach(option => option._delete());
            node.telemetry.forEach(telemetry => telemetry._delete());
        });
        this.options.forEach(option => option._delete());
        this.telemetry.forEach(telemetry => telemetry._delete());
    }

    getSettingTopics() {
        const settingTopics = etl.translateObjToTopic(this._type, {
            title           : this.title,
            lastHeartbeatAt : this.lastHeartbeatAt
        }, this.getRootSettingTopic());

        return settingTopics;
    }

    getTopics(allTopics = false) {
        let topics = etl.translateObjToTopic(this._type, {
            name            : this.name,
            firmwareName    : this.firmwareName,
            firmwareVersion : this.firmwareVersion,
            localIp         : this.localIp,
            mac             : this.mac,
            implementation  : this.implementation,
            state           : this.state,
            telemetry       : [],
            options         : [],
            nodes           : []
        }, this.getRootTopic());

        if (allTopics) {
            topics = {
                ...topics,
                ...this.getSettingTopics()
            };
        }

        this.nodes.forEach(node => topics = { ...topics, ...node.getTopics(allTopics) });
        this.options.forEach(option => topics = { ...topics, ...option.getTopics(allTopics) });
        this.telemetry.forEach(telemetry => topics = { ...topics, ...telemetry.getTopics(allTopics) });

        return topics;
    }

    onAttributePublish(cb) {
        this._subscribeToPublish(cb, { type: 'DEVICE', device: this });
        this.nodes.forEach(node => {
            node._subscribeToPublish(cb, { type: 'NODE', device: this, node });
            node.sensors.forEach(sensor => sensor._subscribeToPublish(cb, { type: 'SENSOR', device: this, node, property: sensor }));
            node.options.forEach(option => option._subscribeToPublish(cb, { type: 'NODE_OPTION', device: this, node, property: option }));
            node.telemetry.forEach(telemetry => telemetry._subscribeToPublish(cb, { type: 'NODE_TELEMETRY', device: this, node, property: telemetry }));
        });
        this.options.forEach(option => option._subscribeToPublish(cb, { type: 'DEVICE_OPTION', device: this, property: option }));
        this.telemetry.forEach(telemetry => telemetry._subscribeToPublish(cb, { type: 'DEVICE_TELEMETRY', device: this, property: telemetry }));
    }

    onAttributeSet(cb) {
        this._subscribeToSet(cb, { type: 'DEVICE', device: this });
        this.nodes.forEach(node => {
            node._subscribeToSet(cb, { type: 'NODE', device: this, node });
            node.sensors.forEach(sensor => sensor._subscribeToSet(cb, { type: 'SENSOR', device: this, node, property: sensor }));
            node.options.forEach(option => option._subscribeToSet(cb, { type: 'NODE_OPTION', device: this, node, property: option }));
            node.telemetry.forEach(telemetry => telemetry._subscribeToSet(cb, { type: 'NODE_TELEMETRY', device: this, node, property: telemetry }));
        });
        this.options.forEach(option => option._subscribeToSet(cb, { type: 'DEVICE_OPTION', device: this, property: option }));
        this.telemetry.forEach(telemetry => telemetry._subscribeToSet(cb, { type: 'DEVICE_TELEMETRY', device: this, property: telemetry }));
    }

    onErrorPublish(cb) {
        this._subscribeToError(cb, { type: 'DEVICE', device: this });
        this.nodes.forEach(node => {
            node._subscribeToError(cb, { type: 'NODE', device: this, node });
            node.sensors.forEach(sensor => sensor._subscribeToError(cb, { type: 'SENSOR', device: this, node, property: sensor }));
            node.options.forEach(option => option._subscribeToError(cb, { type: 'NODE_OPTION', device: this, node, property: option }));
            node.telemetry.forEach(telemetry => telemetry._subscribeToError(cb, { type: 'NODE_TELEMETRY', device: this, node, property: telemetry }));
        });
        this.options.forEach(option => option._subscribeToError(cb, { type: 'DEVICE_OPTION', device: this, property: option }));
        this.telemetry.forEach(telemetry => telemetry._subscribeToError(cb, { type: 'DEVICE_TELEMETRY', device: this, property: telemetry }));
    }

    handleHeartbeat(message) {
        if (!this._heartbeatCallback) return;

        this._heartbeatCallback(message);
    }

    onHeartbeat(cb) {
        const event = this._getSetHeartbeatEventName();

        if (this._heartbeatCallback) this._homie.off(event, this.handleHeartbeat);
        this._heartbeatCallback = cb;

        this._homie.on(event, this.handleHeartbeat.bind(this));
    }

    respondToHeartbeat(msg) {
        const { value } = msg;

        this._homie.publishToBroker(`${this.getRootTopic()}/${this._homie.heartbeatAttribute}`, value, { retain: false });
    }

    deleteRequest() {
        this._homie.publishToBroker(`${this._homie.eventsTopic}/delete`, JSON.stringify({ type: this._type, deviceId: this.id }), { retain: false });
    }

    getTopic() {
        return `${this.id}`;
    }

    _subscribeToPublish(cb) {
        if (!this._isValid) {
            this.debug.info('Device._subscribeToPublish', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getPublishEventName();

        if (this._publishEventCallback) this._homie.off(event, this._publishHandler);

        this._publishEventCallback = cb;
        this._homie.on(event, this._publishHandler);
    }

    _subscribeToSet(cb) {
        if (!this._isValid) {
            this.debug.info('Device._subscribeToSet', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getSetEventName();

        if (this._setEventCallback) this._homie.off(event, this._setHandler);

        this._setEventCallback = cb;
        this._homie.on(event, this._setHandler);
    }

    _subscribeToError(cb) {
        if (!this._isValid) {
            this.debug.info('Device._subscribeToError', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getErrorEventName();

        if (this._errorEventCallback) this._homie.off(event, this._errorHandler);

        this._errorEventCallback = cb;
        this._homie.on(event, this._errorHandler);
    }

    _prepareResponseOptions() {
        return {
            type   : 'DEVICE',
            device : this
        };
    }

    _setHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._setEventCallback({ ...options, field, value: data[field] });
    }

    _publishHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        // HARDCODED should be handled other way
        if (![ 'nodes', 'options', 'telemetry' ].includes(field)) this._publishEventCallback({ ...options, field, value: data[field] });
    }

    _errorHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._errorEventCallback({ ...options, field, value: data[field] });
    }

    _getSetEventName() {
        return `homie.set.${this.id}`;
    }

    _getPublishEventName() {
        return `homie.publish.${this.id}`;
    }

    _getPublishHeartbeatEventName() {
        return `homie.publish.heartbeat.${this.id}`;
    }

    _getSetHeartbeatEventName() {
        return `homie.set.heartbeat.${this.id}`;
    }

    _getErrorEventName() {
        return `homie.error.${this.id}`;
    }

    _serializeInstance(instance) {
        if (instance._isValid) return instance.serialize();
    }

    _attachNewInstance(instance, options) {
        if (!instance._isValid) return; // ignore until valid structure

        const { type, node, property } = options;

        switch (type) {
            case 'NODE':
                node.onAttach(this._homie);
                node._subscribeInstanceToEvents();
                node.sensors.forEach(sensor => sensor._subscribeInstanceToEvents());
                node.options.forEach(option => option._subscribeInstanceToEvents());
                node.telemetry.forEach(telemetry => telemetry._subscribeInstanceToEvents());
                break;
            case 'SENSOR':
            case 'NODE_TELEMETRY':
            case 'NODE_OPTION': {
                if (!node) break;
                property.onAttach(this._homie);
                property._subscribeInstanceToEvents();
                break;
            }
            case 'DEVICE_OPTION':
            case 'DEVICE_TELEMETRY':
                property.onAttach(this._homie);
                property._subscribeInstanceToEvents();
                break;
            default:
                // istanbul ignore next
                break;
        }
    }

    _updateGroupMap(data, remove = false) {
        const { type, groupId, nodeId, propertyId } = data;
        const hash = `${type}.${nodeId}.${propertyId}`;

        if (!this._groupsMap[groupId]) this._groupsMap[groupId] = {};

        if (remove) delete this._groupsMap[groupId][hash];
        else this._groupsMap[groupId][hash] = data;
    }

    getMapByGroupId(groupId) {
        return this._groupsMap[groupId];
    }

    deleteMapByGroupId(groupId) {
        delete this._groupsMap[groupId];
    }
}

module.exports = Device;
