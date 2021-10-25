const Promise = require('bluebird');
const _keys = require('lodash/keys');
const _isEqual = require('lodash/isEqual');
const Debugger = require('./../utils/debugger');
const validate = require('./../utils/validate');
const { NOT_FOUND, NOT_SETTABLE } = require('./../utils/errors');
const { COMMON_VALIDATION_RULES } = require('./../etc/config');
const etl = require('./../etl');

class Entity {
    /**
     * _attributes/_rootTopic/_type/_validationRules are defining in EntitiesStore._makeClassPrototype
     */
    constructor({ id }) {
        const validated = this.validateId(id);

        this.id = validated.id;

        this._isAttached = false;
        this._homie = undefined;
        this._isValid = false;
        this._rawAttributes = {};
        this._isEmpty = true;

        this.entityTopic = `${this._rootTopic}/${this.id}`;

        for (const attributeName in this._attributes) {
            const { defaultValue } = this._attributes[attributeName];

            if (!defaultValue) {
                this[attributeName] = undefined;
            } else {
                this.updateAttribute({
                    [attributeName] : defaultValue instanceof Function ? defaultValue() : defaultValue
                });
            }
        }

        this._publishHandler = this._publishHandler.bind(this);
        this._setHandler = this._setHandler.bind(this);
        this._errorHandler = this._errorHandler.bind(this);

        this.debug = new Debugger();
    }

    validateId(id) {
        const rule = { id: COMMON_VALIDATION_RULES.property.id };

        return validate(rule, { id });
    }

    validateMyStructure() {
        const data = {};

        for (const attribute in this._attributes) {
            data[attribute] = this[attribute];
        }


        try {
            validate(this._validationRules, data);

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
    }

    serialize() {
        const serialized = { id: this.id, entityTopic: this.entityTopic };

        for (const attribute in this._attributes) {
            serialized[attribute] = this[attribute];
        }

        return serialized;
    }

    getAttribute(attribute) {
        return this[attribute];
    }
    getAttributesList() {
        return _keys(this._attributes);
    }

    async publish(attributes, updateObject, forcePublish) {
        if (!Array.isArray(attributes)) {
            forcePublish = updateObject;
            updateObject = attributes;
            attributes = null;
        }
        if (typeof updateObject === 'boolean') {
            forcePublish = updateObject;
            updateObject = {};
        }
        updateObject = updateObject || {};
        attributes = attributes || _keys(updateObject);

        if (typeof forcePublish !== 'boolean') forcePublish = true;

        if (!forcePublish) {
            const { rules, dataToValidate } = this._prepareValidation(updateObject);

            validate(rules, dataToValidate);
        }

        return Promise.all(attributes.map(async (attribute) => {
            let value = updateObject[attribute];

            if (value === undefined) value = this.getAttribute(attribute);

            if (value !== undefined) return this.publishAttribute(attribute, value, forcePublish);
        }));
    }

    async publishAttribute(attribute, value, forcePublish = true) {
        const attributeProps = this._attributes[attribute];

        if (!attributeProps) {
            throw new NOT_FOUND({
                fields : {
                    [attribute] : 'NOT_FOUND'
                },
                message : `Attribute ${attribute} not found!`
            });
        }

        if (!forcePublish) {
            const { rules, dataToValidate } = this._prepareValidation({ [attribute]: value });
            const validated = validate(rules, dataToValidate);

            if (_isEqual(validated[attribute], this.getAttribute(attribute))) return;
        }

        const topic = `${this.getTopic()}/$${attribute}`;

        if (attributeProps.dataType === 'json') if (typeof value !== 'string') value = JSON.stringify(value);

        this._homie.publishToBroker(topic, value, { retain: attributeProps.retained && true });

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            'null.error.event',
            (translated) => _keys(translated)[0] === attribute,
            () => false
        );
    }

    publishError(attribute, error = { code: 'ERROR', message: 'Something went wrong' }) {
        const attributeProps = this._attributes[attribute];

        if (!attributeProps) {
            throw new NOT_FOUND({
                fields : {
                    [attribute] : 'NOT_FOUND'
                },
                message : `Attribute ${attribute} not found!`
            });
        }

        const topic = `${this._homie.errorTopic}/${this.getTopic()}/$${attribute}`;

        this._homie.publishToBroker(topic, JSON.stringify(error), { retain: false });
    }

    async setAttribute(attribute, value) {
        const attributeProps = this._attributes[attribute];

        if (!attributeProps || !attributeProps.settable) {
            throw new NOT_SETTABLE({
                fields : {
                    [attribute] : 'NOT_SETTABLE'
                },
                message : `Attribute ${attribute} not settable!`
            });
        }

        const topic = `${this.getTopic()}/$${attribute}`;

        if (attributeProps.dataType === 'json') if (typeof value !== 'string') value = JSON.stringify(value);

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

    getId() {
        return this.id;
    }

    getTopic() {
        return this.entityTopic;
    }

    getTopics() {
        const attributes = {};

        for (const attribute in this._attributes) {
            let value = this[attribute];
            const attributeProps = this._attributes[attribute];

            if (attributeProps.dataType === 'json') if (typeof value !== 'string') value = JSON.stringify(value);
            attributes[attribute] = value;
        }

        const topics = etl.translateObjToTopic('ENTITY', attributes, this.getTopic());

        return topics;
    }

    getType() {
        return this._type;
    }

    updateAttribute(data) {
        for (const [ key, value ] of Object.entries(data)) {
            this._rawAttributes[key] = value;
        }
        this._isEmpty = !Object.values(this._rawAttributes).filter(v => v).length;

        try {
            const { rules, dataToValidate } = this._prepareValidation(data);
            const validated = validate(rules, dataToValidate);

            for (const attr in validated) {
                this[attr] = validated[attr];
            }
        } catch (e) {
            this._isValid = false;
            this.deleteHandlers();
            throw e;
        }
    }
    isEmpty() {
        return this._isEmpty;
    }

    _prepareValidation(data) {
        const rules = {};
        const dataToValidate = {};

        for (const attr in data) {
            const attributeProps = this._attributes[attr];

            if (!attributeProps) continue;
            rules[attr] = this._validationRules[attr];
            let value = data[attr];

            if (attributeProps.dataType === 'json') if (typeof value === 'string') value = JSON.parse(data[attr]);

            dataToValidate[attr] = value;
        }

        return { rules, dataToValidate };
    }

    onAttributePublish(cb) {
        this._subscribeToPublish(cb, this._prepareResponseOptions());
    }

    onAttributeSet(cb) {
        this._subscribeToSet(cb, this._prepareResponseOptions());
    }

    onErrorPublish(cb) {
        this._subscribeToError(cb, this._prepareResponseOptions());
    }

    async deleteRequest() {
        this._homie.publishToBroker(`${this.getTopic()}/delete`, JSON.stringify({ type: this._type, entityId: this.id }), { retain: false });

        // eslint-disable-next-line no-unused-vars
        const onSuccess = data => {
            // try {
            //     if (this._isValid) {
            //         const { rules, dataToValidate } = this._prepareValidation(data);
            //
            //         validate(rules, dataToValidate);
            //     }
            // } catch (e) {
            //     // Entity is deleted if state is invalid
            //     return true;
            // }
            return !this._isValid;
        };

        const onError = () => {
            return true;
        };

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            onSuccess.bind(this),
            onError
        );
    }

    // istanbul ignore next
    async updateRequest(payload) {
        this._homie.publishToBroker(`${this.getTopic()}/update`, JSON.stringify(payload), { retain: false });

        const handler = () => {
            return true; // THINK ABOUT HANDLING
        };

        return this._homie.createPromisedEvent(
            this._getPublishEventName(),
            this._getErrorEventName(),
            handler,
            handler
        );
    }

    _subscribeToPublish(cb) {
        if (!this._isValid) {
            this.debug.info('Entity._subscribeToPublish', `${this._type} is not valid. Sync process still in progress...`);

            return;
        }
        const event = this._getPublishEventName();

        if (this._publishEventCallback) this._homie.off(event, this._publishHandler);

        this._publishEventCallback = cb;
        this._homie.on(event, this._publishHandler);
    }

    _subscribeToSet(cb) {
        if (!this._isValid) {
            this.debug.info('Entity._subscribeToSet', `${this._type} is not valid. Sync process still in progress...`);

            return;
        }
        const event = this._getSetEventName();

        if (this._setEventCallback) this._homie.off(event, this._setHandler);

        this._setEventCallback = cb;
        this._homie.on(event, this._setHandler);
    }

    _subscribeToError(cb) {
        if (!this._isValid) {
            this.debug.info('Entity._subscribeToError', `${this._type} is not valid. Sync process still in progress...`);

            return;
        }
        const event = this._getErrorEventName();

        if (this._errorEventCallback) this._homie.off(event, this._errorHandler);

        this._errorEventCallback = cb;
        this._homie.on(event, this._errorHandler);
    }

    _prepareResponseOptions() {
        return {
            type   : this._type,
            entity : this
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
        return `homie.set.entity.${this._type}.${this.id}`;
    }

    _getPublishEventName() {
        return `homie.publish.entity.${this._type}.${this.id}`;
    }

    _getErrorEventName() {
        return `homie.error.entity.${this._type}.${this.id}`;
    }

    deleteHandlers() {
        if (this._homie) {
            this._homie.off(this._getSetEventName(), this._setHandler);
            this._homie.off(this._getPublishEventName(), this._publishHandler);
            this._homie.off(this._getErrorEventName(), this._errorHandler);
        }
    }
    delete() {
        this.deleteHandlers();

        this._isAttached = false;
        this._homie = undefined;
        this._isValid = false;

        for (const attribute in this._attributes) {
            this[attribute] = undefined;
        }

        this._publishEventCallback = undefined;
        this._setEventCallback = undefined;
        this._errorEventCallback = undefined;
    }
}

module.exports = Entity;
