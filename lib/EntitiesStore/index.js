/* eslint-disable no-param-reassign */
const validate   = require('../utils/validate');
const utils      = require('../utils');
const BaseEntity = require('./Entity');

const entityValidationRules = {
    rootTopic  : [ 'required', 'string', { like: '(^[a-z0-9]$|^[a-z0-9][a-z0-9]$|^[a-z0-9][a-z-0-9-]+[a-z0-9]$)' } ],
    type       : [ 'required', 'string' ],
    attributes : [ 'required', 'any_object' ],
    methods    : [ 'any_object' ]
};

class EntitiesStore {
    constructor({ scheme, defaultAttributes = {} }) {
        this.classes           = {};
        this.defaultAttributes = defaultAttributes;

        for (const entityDefinition of (scheme || [])) {
            this.initializeEntity(entityDefinition);
        }
    }

    initializeEntity(entityDefinition) {
        const validated = validate(entityValidationRules, entityDefinition);

        if (this.classes[validated.type]) return this.classes[validated.type];

        this.classes[validated.type] = this._makeClass(validated);

        return this.classes[validated.type];
    }

    destroyEntity(type) {
        delete this.classes[type];
    }

    _makeClass(definition) {
        const GeneratedEntity = class GeneratedEntity extends BaseEntity {
            constructor(data) {
                super(data);
            }
        };

        const { rootTopic, attributes, type, methods } = definition;
        const validationRules = {};
        const validatedAttributes = {};

        // eslint-disable-next-line max-len
        let retained = (definition.retained === undefined || definition.retained === null) ? null : !!definition.retained;

        const commonAttributeValidationRules = {
            validation  : { default: 'string' },
            settable    : [ { 'one_of': [ true, false ] }, { default: false } ],
            retained    : [ { 'one_of': [ true, false ] }, { default: false } ],
            dataType    : [ { 'one_of': [ 'json', 'string' ] }, { default: 'string' } ],
            description : 'string'
        };
        const defaultAttributeValidationRules = {
            ...commonAttributeValidationRules,
            defaultValue : [ 'not_empty' ]
        };

        const validateAttribute = (attribute, properties, rules) => {
            validatedAttributes[attribute] = validate(rules, properties);
            validationRules[attribute] = validatedAttributes[attribute].validation;

            if (retained === null
                && validatedAttributes[attribute].retained === false
                &&  Array.isArray(validationRules[attribute])
                && validationRules[attribute].includes('required')) retained = false;
        };

        Object
            .entries(this.defaultAttributes)
            .forEach(([ attribute, properties ]) => {
                validateAttribute(attribute, properties, defaultAttributeValidationRules);

                const { defaultValue } = validatedAttributes[attribute];

                validatedAttributes[attribute].defaultValue = defaultValue;

                // if (defaultValue instanceof Function) {
                //     validatedAttributes[attribute].defaultValue = defaultValue();
                // }
            });

        Object
            .entries(attributes)
            .forEach(([ attribute, properties ]) => {
                validateAttribute(attribute, properties, commonAttributeValidationRules);
            });

        // Assign methods defined in entity scheme
        if (methods) {
            Object.keys(methods).forEach(methodName => {
                GeneratedEntity.prototype[methodName] = methods[methodName];
            });
        }

        if (retained === null) retained = true;

        GeneratedEntity.prototype._attributes = validatedAttributes;
        GeneratedEntity.prototype._rootTopic = rootTopic;
        GeneratedEntity.prototype._type = type;
        GeneratedEntity.prototype._validationRules = validationRules;

        GeneratedEntity.rootTopic = rootTopic;
        GeneratedEntity.retained = retained;

        return GeneratedEntity;
    }

    getUniqueId() {
        return utils.getRandomId();
    }
}

module.exports = EntitiesStore;
