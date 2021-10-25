/* eslint-disable newline-before-return */
const Threshold = require('../Threshold');
const etl = require('./../etl');
const Debugger = require('./../utils/debugger');
const X = require('./../utils/X');
const { validateStructure, validate } = require('./validation');

const { ERROR_CODES: {  NOT_FOUND, EXISTS, WRONG_FORMAT, NOT_SETTABLE, UNKNOWN_ERROR } } = require('./../etc/config');
const { SETTABLE_ATTRIBUTES } = require('./config');

class Scenario {
    constructor({ id }) {
        const validated = validate({ id });

        this.id = validated.id;
        this.state = null;
        this.thresholds = [];

        this._homie = null;
        this._type = 'SCENARIO';
        this._isValid = false;
        this._isAttached = false;
        this._rawAttributes = {};

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
            state,
            thresholds
        } = this;

        try {
            validateStructure({
                id,
                state,
                thresholds,
                ...this._rawAttributes
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

        this.thresholds.forEach(th => th.onAttach(homie));
    }

    serialize() {
        return {
            id         : this.id,
            state      : this.state,
            rootTopic  : this.getRootTopic(),
            thresholds : this.thresholds.map(this._serializeInstance).filter(i => i)
        };
    }

    publishAttribute(attribute, value) {
        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.scenarioTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(topic, value);
    }

    async setAttribute(attribute, value) {
        if (!SETTABLE_ATTRIBUTES.includes(attribute)) {
            throw new X({
                code   : NOT_SETTABLE,
                fields : {
                    [attribute] : 'NOT_SETTABLE'
                },
                message : `Attribute ${attribute} not settable`
            });
        }

        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.scenarioTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(`${topic}/set`, `${value}`,  { retain: false, qos: 1 });

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

    getRootTopic() {
        return this._homie ? `${this._homie.scenarioTopic}/${this.getTopic()}` : this.getTopic();
    }

    getId() {
        return this.id;
    }

    getState() {
        return this.state;
    }

    getThresholds() {
        return this.thresholds;
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
            && this.thresholds.every(th => th.isEmpty());
    }

    deleteHandlers() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
        this.thresholds.forEach(th => th.deleteHandlers());
    }

    delete() {
        this.deleteHandlers();
        this.state = null;

        this._isValid = false;
        this._isAttached = false;

        this._publishEventCallback = null;
        this._setEventCallback = null;
        this._errorEventCallback = null;

        this.thresholds.forEach(th => th.delete());
    }

    getTopics(allTopics = false) {
        let topics = etl.translateObjToTopic(this._type, {
            state : this.state
        }, this.getRootTopic());

        if (allTopics) {
            topics = {
                ...topics,
                ...etl.translateObjToTopic(this._type, {
                    thresholds : this.thresholds
                }, this.getRootTopic())
            };

            this.thresholds.forEach(th => topics = { ...topics, ...th.getTopics(allTopics) });
        }

        return topics;
    }

    onAttributePublish(cb) {
        this._subscribeToPublish(cb);
        // will be used when threshold and scenario becomes one entity
        // this.thresholds.forEach(th => th._subscribeToPublish(cb));
    }

    onAttributeSet(cb) {
        this._subscribeToSet(cb);
        // this.thresholds.forEach(th => th._subscribeToSet(cb));
    }

    onErrorPublish(cb) {
        this._subscribeToError(cb);
        // this.thresholds.forEach(th => th._subscribeToError(cb));
    }

    getTopic() {
        return `${this.id}`;
    }

    getThresholdById(thresholdId) {
        const threshold = this.thresholds.find(th => th.getId() === thresholdId);

        if (!threshold) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    threshold : 'NOT_FOUND'
                }
            });
        }

        return threshold;
    }

    addThreshold(threshold) {
        if (!(threshold instanceof Threshold)) {
            throw new X({
                code   : WRONG_FORMAT,
                fields : {
                    threshold : 'WRONG_FORMAT'
                }
            });
        }

        const isExist = this.thresholds.find(th => th.getId() === threshold.getId());

        if (isExist) {
            throw new X({
                code   : EXISTS,
                fields : {
                    threshold : 'EXISTS'
                }
            });
        }

        this.thresholds.push(threshold);
    }

    removeThresholdById(thresholdId) {
        this.thresholds = this.thresholds.filter(th => th.getId() !== thresholdId);
    }

    publishError(error, topic) {
        try {
            const preparedError = this._prepareError(error);
            const jsonErrorString = JSON.stringify(preparedError);

            this.debug.info('Scenario.publishError', {
                code    : preparedError.code,
                fields  : preparedError.fields,
                message : preparedError.message
            });

            this._homie.publishToBroker(`${this._homie.errorTopic}/${topic}`, jsonErrorString, { retain: false });
        } catch (err) {
            this.debug.warning('Scenario.publishError', err);
        }
    }

    _prepareError(error) {
        if (!(error instanceof X)) {
            error = new X({
                code    : UNKNOWN_ERROR,
                fields  : {},
                message : 'Something went wrong'
            });
        }

        return error;
    }

    _subscribeToPublish(cb) {
        if (!this._isValid) {
            this.debug.info('Scenario._subscribeToPublish', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getPublishEventName();

        if (this._publishEventCallback) this._homie.off(event, this._publishHandler);

        this._publishEventCallback = cb;
        this._homie.on(event, this._publishHandler);
    }

    _subscribeToSet(cb) {
        if (!this._isValid) {
            this.debug.info('Scenario._subscribeToSet', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getSetEventName();

        if (this._setEventCallback) this._homie.off(event, this._setHandler);

        this._setEventCallback = cb;
        this._homie.on(event, this._setHandler);
    }

    _subscribeToError(cb) {
        if (!this._isValid) {
            this.debug.info('Scenario._subscribeToError', `${this._type} is not valid. Sync process still in progress...`);
            return;
        }
        const event = this._getErrorEventName();

        if (this._errorEventCallback) this._homie.off(event, this._errorHandler);

        this._errorEventCallback = cb;
        this._homie.on(event, this._errorHandler);
    }

    _prepareResponseOptions() {
        return {
            type     : 'SCENARIO',
            scenario : this
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

        this._publishEventCallback({ ...options, field, value: data[field] });
    }

    _errorHandler(data) {
        const field = Object.keys(data)[0];
        const options = this._prepareResponseOptions();

        this._errorEventCallback({ ...options, field, value: data[field] });
    }

    _getSetEventName() {
        return `homie.set.scenario.${this.id}`;
    }

    _getPublishEventName() {
        return `homie.publish.scenario.${this.id}`;
    }

    _getErrorEventName() {
        return `homie.error.scenario.${this.id}`;
    }

    _serializeInstance(instance) {
        if (instance._isValid) return instance.serialize();
    }
}

module.exports = Scenario;
