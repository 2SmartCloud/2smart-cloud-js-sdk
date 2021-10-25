const _validate = require('../utils/validate');
const X = require('../utils/X');
const { COMMON_VALIDATION_RULES, COLOR_MODELS, ERROR_CODES: { VALIDATION } } = require('./../etc/config');

const rules = COMMON_VALIDATION_RULES.property;
const settingRules = {
    title     : [ 'not_empty', 'string' ],
    displayed : { 'one_of': [ 'true', 'false' ] }
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
    const validated = _validate(rules, params, 'Attributes validation error');

    const errors = {};
    let isWrongType = false;
    const { dataType, format, value } = validated;

    if (value === '') return;
    if (typeof value !== 'string') isWrongType = true;

    switch (dataType) {
        case 'integer':
        case 'float':
            if (!new RegExp('^[+-]?\\d+(\\.\\d+)?$').test(value)) isWrongType = true;

            if (format) {
                if (!new RegExp('^\\d+:\\d+$').test(format)) {
                    errors.format = 'WRONG_FORMAT';
                    isWrongType = true;
                }

                const range = format.split(':');

                if (Number(range[0]) > Number(range[1])) {
                    errors.format = 'WRONG_FORMAT';
                    isWrongType = true;
                }
            }

            break;
        case 'boolean':
            if (![ 'true', 'false' ].includes(value)) isWrongType = true;

            break;
        case 'enum':
            if (!format) {
                isWrongType = true;
                errors.format = 'WRONG_FORMAT';
            }

            break;
        case 'color':
            // for $datatype -> color, $format is required and can be one of COLOR_MODELS const
            if (!format || !COLOR_MODELS.includes(format)) {
                isWrongType = true;
                errors.format = 'WRONG_FORMAT';
            }

            break;
        default:
            break;
    }

    if (isWrongType) {
        errors.value = 'WRONG_TYPE';

        throw new X({
            code   : VALIDATION,
            fields : {
                ...errors
            },
            message : 'Attributes validation error'
        });
    }

    return validated;
}

module.exports = {
    validate,
    validateStructure
};
