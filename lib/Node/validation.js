/* eslint-disable camelcase */
const _validate = require('../utils/validate');

const { COMMON_VALIDATION_RULES } = require('./../etc/config');

const rules = {
    id        : COMMON_VALIDATION_RULES.property.id,
    name      : [ 'not_empty', 'string' ],
    type      : 'string',
    state     : [ 'not_empty', COMMON_VALIDATION_RULES.state ],
    options   : 'property_validation',
    telemetry : 'property_validation',
    sensors   : 'sensor_validation'
};

const settingRules = {
    title        : 'string',
    hidden       : { 'one_of': [ 'true', 'false' ] },
    lastActivity : 'integer'
};

function validate(params) {
    const rulesByParams = {};
    const allRules = { ...rules, ...settingRules };

    Object.keys(params).forEach(param => {
        if (!allRules[param]) return;

        rulesByParams[param] = allRules[param];
    });

    return _validate(rulesByParams, params, 'Attributes validation error');
}

function validateStructure(params) {
    return _validate(rules, params, 'Attributes validation error');
}

module.exports = {
    validate,
    validateStructure
};
