/* eslint-disable camelcase */
const _validate = require('../utils/validate');

const { COMMON_VALIDATION_RULES } = require('./../etc/config');

const rules = {
    id              : COMMON_VALIDATION_RULES.property.id,
    homie           : [ 'required', 'not_empty', 'string' ],
    name            : [ 'required', 'not_empty', 'string' ],
    localIp         : [ 'required', 'not_empty', 'string' ],
    mac             : [ 'required', 'not_empty', 'string' ],
    implementation  : [ 'required', 'not_empty', 'string' ],
    state           : COMMON_VALIDATION_RULES.state,
    firmwareName    : [ 'required', 'not_empty', 'string' ],
    firmwareVersion : [ 'required', 'not_empty', 'string' ],
    options         : 'property_validation',
    telemetry       : 'property_validation',
    nodes           : 'node_validation'
};

const settingRules = {
    title : 'string'
};

function validate(params) {
    const rulesByParams = {};
    const allRules = { ...rules, ...settingRules };

    Object.keys(params).forEach(param => {
        // istanbul ignore next
        if (!allRules[param]) return;

        rulesByParams[param] = allRules[param];
    });

    return _validate(rulesByParams, params, 'Attributes validation error');
}

function validateStructure(params) {
    return _validate(rules, params, 'Attributes validation error');
}

module.exports = {
    validateStructure,
    validate
};
