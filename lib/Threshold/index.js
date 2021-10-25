/* eslint-disable newline-before-return */
const Property = require('../Property');
const etl = require('./../etl');
const X = require('./../utils/X');

const { validate } = require('./../Property/validation');
const { SETTABLE_ATTRIBUTES } = require('./config');
const { ERROR_CODES: { NOT_SETTABLE } } = require('./../etc/config');

class Threshold extends Property {
    constructor({ id, scenarioId }) {
        super({ id });
        const validated = validate({ id: scenarioId });

        this.scenarioId = validated.id;
        this._type = 'THRESHOLD';
    }

    onAttach(homie) {
        this._isAttached = true;
        this._homie = homie;
    }

    serialize() {
        return {
            id         : this.id,
            name       : this.name,
            value      : this.value,
            settable   : this.settable,
            retained   : this.retained,
            dataType   : this.dataType,
            unit       : this.unit,
            format     : this.format,
            rootTopic  : this.getRootTopic(),
            scenarioId : this.scenarioId
        };
    }

    _getSetEventName() {
        return `homie.set.threshold.${this.scenarioId}.${this.id}`;
    }

    _getPublishEventName() {
        return `homie.publish.threshold.${this.scenarioId}.${this.id}`;
    }

    _getErrorEventName() {
        return `homie.error.threshold.${this.scenarioId}.${this.id}`;
    }

    publishAttribute(attribute, value) {
        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.scenarioTopic}/${Object.keys(translated)[0]}`;
        const retain = attribute !== 'value' || this.retained === 'true';

        this._homie.publishToBroker(topic, value, { retain });
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

        const translated = etl.translateObjToTopic(this._type, { [attribute]: `${value}` }, this.getTopic());
        const topic = `${this._homie.scenarioTopic}/${Object.keys(translated)[0]}`;

        this._homie.publishToBroker(`${topic}/set`, `${value}`, { retain: false });

        const handler = data => data[attribute] !== undefined;

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            handler,
            handler
        );
    }

    getTopic() {
        return `${this.scenarioId}/${this.id}`;
    }

    publishError(error = { code: 'ERROR', message: 'Something went wrong' }) {
        const errorTopic = `${this._homie.errorTopic}/${this._homie.scenarioTopic}/${this.getTopic()}`;

        this._homie.publishToBroker(errorTopic, JSON.stringify(error), { retain: false });
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
        const topics = etl.translateObjToTopic(this._type, dataToTranslate, this.getRootTopic());

        return topics;
    }

    getRootTopic() {
        return this._homie ? `${this._homie.scenarioTopic}/${this.getTopic()}` : this.getTopic();
    }

    getScenarioId() {
        return this.scenarioId;
    }

    _prepareResponseOptions() {
        return {
            type      : 'THRESHOLD',
            threshold : this
        };
    }
}

module.exports = Threshold;
