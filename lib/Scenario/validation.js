/* eslint-disable camelcase */
const _validate = require('../utils/validate');

const { COMMON_VALIDATION_RULES } = require('./../etc/config');

const rules = {
    id         : COMMON_VALIDATION_RULES.property.id,
    state      : [ { 'one_of': [ 'true', 'false' ] }, 'string', 'required' ],
    thresholds : 'threshold_validation'
};

function validate(params) {
    const rulesByParams = {};

    Object.keys(params).forEach(param => {
        // istanbul ignore next
        if (!rules[param]) return;

        rulesByParams[param] = rules[param];
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
