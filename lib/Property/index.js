/* eslint-disable newline-before-return */
const _remove = require('lodash/remove');
const _union = require('lodash/union');
const X = require('../utils/X');
const Debugger = require('../utils/debugger');
const etl = require('./../etl');
const { ERROR_CODES: { NOT_SETTABLE, NOT_FOUND } } = require('./../etc/config');

const { SETTABLE_ATTRIBUTES, SETTABLE_SETTINGS } = require('./config');
const { validate, validateStructure } = require('./validation');

class Property {
    constructor({ id }) {
        const validated = validate({ id });

        this.title = '';
        this.displayed = false;
        this.id = validated.id;
        this.name = '';
        this.value = '';
        this.settable = false;
        this.retained = true;
        this.dataType = 'string';
        this.unit = '#';
        this.format = '';
        this.groups = [];

        this.device = null;
        this.node = null;

        this._isAttached = false;
        this._homie = null;
        this._type = 'PROPERTY';
        this._eventPrefix = '';
        this._isValid = false;
        this._rawAttributes = {};
        this._isEmpty = true;

        this._publishHandler = this._publishHandler.bind(this);
        this._setHandler = this._setHandler.bind(this);
        this._errorHandler = this._errorHandler.bind(this);

        this.debug = new Debugger();
    }

    validateMyStructure() {
        const {
            id,
            settable,
            retained,
            dataType,
            unit,
            format,
            name,
            value
        } = this;

        try {
            validateStructure({
                settable,
                retained,
                dataType,
                unit,
                format,
                name,
                value,
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

    setAttribute(attribute, value) {
        if (!SETTABLE_ATTRIBUTES.includes(attribute)) {
            throw new X({
                code   : NOT_SETTABLE,
                fields : {
                    [attribute] : 'NOT_SETTABLE'
                },
                message : `Attribute ${attribute} not settable`
            });
        }

        const translated = etl.translateObjToTopic(this._type, { [attribute]: value }, this.getTopic());
        const topic = `${this._homie.deviceTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(`${topic}/set`, `${value}`, { retain: false, qos: 1 });

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
        const retain = attribute !== 'value' || this.retained === 'true';

        this._homie.publishToBroker(topic, value, { retain });
    }

    publishError(error = { code: 'ERROR', message: 'Something went wrong' }) {
        const translated = etl.translateObjToTopic(this._type, {
            value : ''
        }, this.getTopic());

        const topic = `${this._homie.errorTopic}/${this._homie.deviceTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, JSON.stringify(error), { retain: false });
    }

    publishSettingError(setting, error = { code: 'ERROR', message: 'Something went wrong' }) {
        const translated = etl.translateObjToTopic(this._type, {
            [setting] : ''
        }, this.getTopic());

        const topic = `${this._homie.errorTopic}/${this._homie.deviceSettingsTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, JSON.stringify(error), { retain: false });
    }

    onAttach(homie) {
        this._isAttached = true;
        this._homie = homie;
    }

    onDetach() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
        this._homie = null;
        this._isAttached = false;
    }

    serialize() {
        return {
            id        : this.id,
            name      : this.name,
            value     : this.value,
            settable  : this.settable,
            retained  : this.retained,
            dataType  : this.dataType,
            unit      : this.unit,
            format    : this.format,
            rootTopic : this.getRootTopic(),
            groups    : this.groups,
            title     : this.title,
            displayed : this.displayed
        };
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

    getValue() {
        return this.value;
    }

    getSettable() {
        return this.settable;
    }

    getRetained() {
        return this.retained;
    }

    getDataType() {
        return this.dataType;
    }

    getUnit() {
        return this.unit;
    }

    getFormat() {
        return this.format;
    }

    getDevice() {
        return this.device;
    }

    getTitle() {
        return this.title;
    }

    getDisplayed() {
        return this.displayed;
    }

    getNode() {
        return this.node;
    }

    getDeviceId() {
        if (!this.device) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    device : 'NOT_FOUND'
                }
            });
        }

        return this.device.getId();
    }

    getNodeId() {
        if (!this.node) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    node : 'NOT_FOUND'
                }
            });
        }

        return this.node.getId();
    }

    setValue(value) {
        this.value = value;
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
        return this._isEmpty;
    }

    setDevice(device) {
        this.device = device;
        if (device._isAttached) this.onAttach(device._homie);
    }

    unsetDevice() {
        if (this._isAttached) this.onDetach();
        this.device = null;
    }

    setNode(node) {
        if (node._isAttached) this.onAttach(node._homie);
        this.node = node;
    }

    unsetNode() {
        if (this._isAttached) this.onDetach();
        this.node = null;
    }


    getTopic() {
        let prefix = this.device ? this.device.id : this.id;

        if (this.node) prefix = `${prefix}/${this.node.id}`;

        prefix = `${prefix}${this._eventPrefix ? `/$${this._eventPrefix}` : ''}/${this.id}`;

        return prefix;
    }

    _subscribeToPublish(cb) {
        if (!this._isValid) {
            this.debug.info('Property._subscribeToPublish', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getPublishEventName();

        if (this._publishEventCallback) this._homie.off(event, this._publishHandler);

        this._publishEventCallback = cb;
        this._homie.on(event, this._publishHandler);
    }

    _subscribeToSet(cb) {
        if (!this._isValid) {
            this.debug.info('Property._subscribeToSet', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getSetEventName();

        if (this._setEventCallback) this._homie.off(event, this._setHandler);

        this._setEventCallback = cb;
        this._homie.on(event, this._setHandler);
    }

    _subscribeToError(cb) {
        if (!this._isValid) {
            this.debug.info('Property._subscribeToError', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getErrorEventName();

        if (this._errorEventCallback) this._homie.off(event, this._errorHandler);

        this._errorEventCallback = cb;
        this._homie.on(event, this._errorHandler);
    }

    onErrorPublish(cb) {
        this._subscribeToError(cb);
    }

    onAttributePublish(cb) {
        this._subscribeToPublish(cb);
    }

    onAttributeSet(cb) {
        this._subscribeToSet(cb);
    }

    _prepareResponseOptions() {
        return {
            type     : this._getPropertyType(),
            device   : this.device,
            node     : this.node,
            property : this
        };
    }

    _prepareRequestOptions() {
        return {
            type       : this._getPropertyType(),
            deviceId   : this.device ? this.device.id : null,
            nodeId     : this.node ? this.node.id : null,
            propertyId : this.id
        };
    }

    _getPropertyType() {
        switch (this._eventPrefix) {
            case 'options':
                return this.node ? 'NODE_OPTION' : 'DEVICE_OPTION';
            case 'telemetry':
                return this.node ? 'NODE_TELEMETRY' : 'DEVICE_TELEMETRY';
            default:
                return 'SENSOR';
        }
    }

    _setHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._setEventCallback({ ...options, field, value: data[field] });
    }

    _publishHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._publishEventCallback({ ...options, field, value: data[field] });
    }

    _errorHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._errorEventCallback({ ...options, field, value: data[field] });
    }

    _getSetEventName() {
        let prefix = `homie.set.${this.device.id}`;

        if (this.node) prefix = `${prefix}.${this.node.id}`;

        prefix = `${prefix}${this._eventPrefix ? `.${this._eventPrefix}` : ''}.${this.id}`;

        return prefix;
    }

    _getPublishEventName() {
        let prefix = `homie.publish.${this.device.id}`;

        if (this.node) prefix = `${prefix}.${this.node.id}`;

        prefix = `${prefix}${this._eventPrefix ? `.${this._eventPrefix}` : ''}.${this.id}`;

        return prefix;
    }

    _getErrorEventName() {
        let prefix = `homie.error.${this.device.id}`;

        if (this.node) prefix = `${prefix}.${this.node.id}`;

        prefix = `${prefix}${this._eventPrefix ? `.${this._eventPrefix}` : ''}.${this.id}`;

        return prefix;
    }

    _subscribeInstanceToEvents() {
        if (!this.device) {
            this.debug.info('Property._subscribeInstanceToEvents', 'Device not specified. Couldn\'t subscribe to events...');
            return;
        }

        if (this.device._publishEventCallback) this._subscribeToPublish(this.device._publishEventCallback);
        if (this.device._setEventCallback) this._subscribeToSet(this.device._setEventCallback);
        if (this.device._errorEventCallback) this._subscribeToError(this.device._errorEventCallback);
    }


    deleteHandlers() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
    }
    _delete() {
        this.deleteHandlers();

        this.title = '';
        this.displayed = '';
        this.name = '';
        this.value = '';
        this.settable = '';
        this.retained = '';
        this.dataType = '';
        this.unit = '';
        this.format = '';

        this._isValid = false;
        this._isAttached = false;

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;
    }

    getSettingTopics() {
        const settingTopics = etl.translateObjToTopic(this._type, {
            title     : this.title,
            groups    : this.groups,
            displayed : this.displayed
        }, this.getRootSettingTopic());

        return settingTopics;
    }

    getTopics(allTopics = false) {
        const dataToTranslate = {
            name     : this.name,
            settable : this.settable,
            retained : this.retained,
            dataType : this.dataType,
            unit     : this.unit,
            format   : this.format
        };

        if (allTopics || this.retained === 'true') dataToTranslate.value = this.value;
        let topics = etl.translateObjToTopic(this._type, dataToTranslate, this.getRootTopic());

        if (allTopics) {
            topics = {
                ...topics,
                ...this.getSettingTopics()
            };
        }

        return topics;
    }

    addGroup(groupId) {
        this.groups = _union(this.groups, [ groupId ]);

        if (this.device) {
            this.device._updateGroupMap({
                type       : this._getPropertyType(),
                nodeId     : this.node ? this.node.id : undefined,
                propertyId : this.id,
                groupId
            });
        }

        return this.groups;
    }

    deleteGroup(groupId) {
        _remove(this.groups, id => id === groupId);

        if (this.device) {
            this.device._updateGroupMap({
                type       : this._getPropertyType(),
                nodeId     : this.node ? this.node.id : undefined,
                propertyId : this.id,
                groupId
            }, true);
        }

        return this.groups;
    }

    addGroupRequest(groupId) {
        const payload = {
            ...this._prepareRequestOptions(),
            groupId,
            event : 'GROUP_OF_PROPERTIES'
        };

        this._homie.publishToBroker(`${this._homie.eventsTopic}/update`, JSON.stringify(payload), { retain: false });

        const onSuccess = data => {
            if (data.groups.includes(groupId)) return true;

            // istanbul ignore next
            return false;
        };

        const onError = data => {
            if (data.groups) return true;

            // istanbul ignore next
            return false;
        };

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            onSuccess,
            onError
        );
    }

    deleteGroupRequest(groupId) {
        const payload = {
            ...this._prepareRequestOptions(),
            groupId,
            event : 'GROUP_OF_PROPERTIES'
        };

        this._homie.publishToBroker(`${this._homie.eventsTopic}/delete`, JSON.stringify(payload), { retain: false });

        const onSuccess = data => {
            if (!data.groups.includes(groupId)) return true;

            // istanbul ignore next
            return false;
        };

        const onError = data => {
            if (data.groups) return true;

            // istanbul ignore next
            return false;
        };

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            onSuccess,
            onError
        );
    }

    publishSetting(attribute, value) {
        const translated = etl.translateObjToTopic(this._type, { [attribute]: value }, this.getTopic());
        const topic = `${this._homie.deviceSettingsTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, value);
    }
}

module.exports = Property;
