/* eslint-disable newline-before-return */
const _remove = require('lodash/remove');
const X = require('./../utils/X');
const Debugger = require('./../utils/debugger');
const etl = require('./../etl');
const { ERROR_CODES: { NOT_FOUND } } = require('./../etc/config');

const { validateStructure, validate } = require('./validation');
const { SETTABLE_SETTINGS } = require('./config');

const Property = require('./../Property');

class Node {
    constructor({ id }) {
        const validated = validate({ id });

        this.id = validated.id;
        this.name = '';
        this.type = '';
        this.state = '';
        this.lastActivity = '';
        this.sensors = [];
        this.options = [];
        this.telemetry = [];
        this.device = null;

        // NODE SETTINGS //

        this.title = '';
        this.hidden = 'false';

        // END //

        this._isValid = false;
        this._isAttached = false;
        this._homie = null;
        this._type = 'NODE';
        this._rawAttributes = {};
        this._isEmpty = true;

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;

        this._publishHandler = this._publishHandler.bind(this);
        this._setHandler = this._setHandler.bind(this);
        this._errorHandler = this._errorHandler.bind(this);

        this.debug = new Debugger();
    }

    validateMyStructure() {
        const {
            id,
            name,
            type,
            state,
            lastActivity,
            sensors,
            options,
            telemetry
        } = this;


        try {
            validateStructure({
                sensors,
                options,
                telemetry,
                name,
                type,
                state,
                lastActivity,
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

        this.sensors.forEach(sensor => {
            sensor.onAttach(homie);
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


        this.sensors.forEach(sensor => {
            sensor.onDetach();
        });

        this.options.forEach(option => {
            option.onDetach();
        });

        this.telemetry.forEach(telemetry => {
            telemetry.onDetach();
        });
    }

    setSettingAttribute(attribute, value) {
        if (!SETTABLE_SETTINGS.includes(attribute)) {
            throw new X({
                code   : 'NOT_SETTABLE',
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

    getTopic() {
        return this.device ? `${this.device.id}/${this.id}` : this.id;
    }

    serialize() {
        return {
            id           : this.id,
            name         : this.name,
            sensors      : this.sensors.map(this._serializeInstance).filter(i => i),
            options      : this.options.map(this._serializeInstance).filter(i => i),
            telemetry    : this.telemetry.map(this._serializeInstance).filter(i => i),
            type         : this.type,
            state        : this.state,
            rootTopic    : this.getRootTopic(),
            title        : this.title,
            hidden       : this.hidden,
            lastActivity : this.lastActivity
        };
    }

    _serializeInstance(instance) {
        if (instance._isValid) return instance.serialize();
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getSensors() {
        return this.sensors;
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

    getHidden() {
        return this.hidden;
    }

    getLastActivity() {
        return this.lastActivity;
    }

    getSensorById(id) {
        const sensor = this.sensors.find(el => el.getId() === id);

        if (!sensor) {
            throw new X({
                code   : 'NOT_FOUND',
                fields : {
                    sensor : 'NOT_FOUND'
                }
            });
        }

        return sensor;
    }

    getOptionById(id) {
        const option = this.options.find(el => el.getId() === id);

        if (!option) {
            throw new X({
                code   : 'NOT_FOUND',
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
                code   : 'NOT_FOUND',
                fields : {
                    telemetry : 'NOT_FOUND'
                }
            });
        }

        return telemetry;
    }

    getType() {
        return this.type;
    }

    getState() {
        return this.state;
    }

    getDevice() {
        return this.device;
    }

    getDeviceId() {
        if (!this.device) {
            throw new X({
                code   : 'NOT_FOUND',
                fields : {
                    device : 'NOT_FOUND'
                }
            });
        }

        return this.device.getId();
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
            && this.sensors.every(e => e.isEmpty())
            && this.options.every(e => e.isEmpty())
            && this.telemetry.every(e => e.isEmpty());
    }

    setDevice(device) {
        this.device = device;
        for (const option of this.options) option.setDevice(device);
        for (const telemetry of this.telemetry) telemetry.setDevice(device);
        for (const sensor of this.sensors) sensor.setDevice(device);
        if (device._isAttached) this.onAttach(device._homie);
    }
    unsetDevice() {
        if (this._isAttached) this.onDetach();
        this.device = null;
        for (const option of this.options) option.unsetDevice();
        for (const telemetry of this.telemetry) telemetry.unsetDevice();
        for (const sensor of this.sensors) sensor.unsetDevice();
    }

    addSensor(sensor) {
        if (!(sensor instanceof Property)) {
            throw new X({
                code   : 'WRONG_FORMAT',
                fields : {
                    sensor : 'WRONG_FORMAT'
                }
            });
        }

        const n = this.sensors.find(({ id }) => id === sensor.id);

        if (n) {
            throw new X({
                code   : 'EXISTS',
                fields : {
                    sensor : 'EXISTS'
                }
            });
        }

        this.sensors.push(sensor);
        if (this.device) sensor.setDevice(this.device);
        sensor.setNode(this);
    }

    addOption(option) {
        if (!(option instanceof Property)) {
            throw new X({
                code   : 'WRONG_FORMAT',
                fields : {
                    option : 'WRONG_FORMAT'
                }
            });
        }

        const n = this.options.find(({ id }) => id === option.id);

        if (n) {
            throw new X({
                code   : 'EXISTS',
                fields : {
                    option : 'EXISTS'
                }
            });
        }

        this.options.push(option);
        if (this.device) option.setDevice(this.device);
        option.setNode(this);
    }

    addTelemetry(telemetry) {
        if (!(telemetry instanceof Property)) {
            throw new X({
                code   : 'WRONG_FORMAT',
                fields : {
                    telemetry : 'WRONG_FORMAT'
                }
            });
        }

        const t = this.telemetry.find(({ id }) => id === telemetry.id);

        if (t) {
            throw new X({
                code   : 'EXISTS',
                fields : {
                    telemetry : 'EXISTS'
                }
            });
        }

        this.telemetry.push(telemetry);
        if (this.device) telemetry.setDevice(this.device);
        telemetry.setNode(this);
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

        option.unsetNode();
        option.unsetDevice();
        _remove(this.options, (o) => o.id === id);
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

        telemetry.unsetNode();
        telemetry.unsetDevice();
        _remove(this.telemetry, (t) => t.id === id);
    }

    removeSensorById(id) {
        const sensor = this.sensors.find(el => el.getId() === id);

        if (!sensor) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    sensor : 'NOT_FOUND'
                }
            });
        }

        sensor.unsetNode();
        sensor.unsetDevice();
        _remove(this.sensors, (s) => s.id === id);
    }

    deleteHandlers() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
        this.sensors.forEach(sensor => sensor.deleteHandlers());
        this.options.forEach(option => option.deleteHandlers());
        this.telemetry.forEach(telemetry => telemetry.deleteHandlers());
    }
    delete() {
        this.deleteHandlers();

        this.name = '';
        this.type = '';
        this.state = '';
        this.lastActivity = '';

        this.title = '';
        this.hidden = 'false';

        this._isValid = false;
        this._isAttached = false;

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;

        this.sensors.forEach(sensor => sensor._delete());
        this.options.forEach(option => option._delete());
        this.telemetry.forEach(telemetry => telemetry._delete());
    }

    getSettingTopics() {
        const settingTopics = etl.translateObjToTopic(this._type, {
            title        : this.title,
            hidden       : this.hidden,
            lastActivity : this.lastActivity
        }, this.getRootSettingTopic());

        return settingTopics;
    }

    getTopics(allTopics = false) {
        let topics = etl.translateObjToTopic(this._type, {
            name      : this.name,
            type      : this.type,
            state     : this.state,
            telemetry : [],
            options   : [],
            sensors   : []
        }, this.getRootTopic());

        if (allTopics) {
            topics = {
                ...topics,
                ...this.getSettingTopics()
            };
        }

        this.sensors.forEach(sensor => topics = { ...topics, ...sensor.getTopics(allTopics) });
        this.options.forEach(option => topics = { ...topics, ...option.getTopics(allTopics) });
        this.telemetry.forEach(telemetry => topics = { ...topics, ...telemetry.getTopics(allTopics) });

        return topics;
    }

    deleteRequest() {
        this._homie.publishToBroker(`${this._homie.eventsTopic}/delete`, JSON.stringify({ type: this._type, deviceId: this.device.id, nodeId: this.id }), { retain: false });
    }

    _subscribeToPublish(cb) {
        if (!this._isValid) {
            this.debug.info('Node._subscribeToPublish', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getPublishEventName();

        if (this._publishEventCallback) this._homie.off(event, this._publishHandler);

        this._publishEventCallback = cb;
        this._homie.on(event, this._publishHandler);
    }

    _subscribeToSet(cb) {
        if (!this._isValid) {
            this.debug.info('Node._subscribeToSet', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getSetEventName();

        if (this._setEventCallback) this._homie.off(event, this._setHandler);

        this._setEventCallback = cb;
        this._homie.on(event, this._setHandler);
    }

    _subscribeToError(cb) {
        if (!this._isValid) {
            this.debug.info('Node._subscribeToError', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getErrorEventName();

        if (this._errorEventCallback) this._homie.off(event, this._errorHandler);

        this._errorEventCallback = cb;
        this._homie.on(event, this._errorHandler);
    }

    _prepareResponseOptions() {
        return {
            type   : 'NODE',
            device : this.device,
            node   : this
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
        if (![ 'sensors', 'options', 'telemetry' ].includes(field)) this._publishEventCallback({ ...options, field, value: data[field] });
    }

    _errorHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._errorEventCallback({ ...options, field, value: data[field] });
    }

    _getSetEventName() {
        return `homie.set.${this.device.id}.${this.id}`;
    }

    _getPublishEventName() {
        return `homie.publish.${this.device.id}.${this.id}`;
    }

    _getErrorEventName() {
        return `homie.error.${this.device.id}.${this.id}`;
    }

    _subscribeInstanceToEvents() {
        if (!this.device) {
            this.debug.info('Node._subscribeInstanceToEvents', 'Device not specified. Couldn\'t subscribe to events...');
            return;
        }

        if (this.device._publishEventCallback) this._subscribeToPublish(this.device._publishEventCallback);
        if (this.device._setEventCallback) this._subscribeToSet(this.device._setEventCallback);
        if (this.device._errorEventCallback) this._subscribeToError(this.device._errorEventCallback);
    }
}

module.exports = Node;
