const LIVR = require('./singletonLIVR');
const X = require('./X');
const { ERROR_CODES: { VALIDATION } } = require('./../etc/config');

function validate(rules, data, message = 'Validation error!') {
    const validator = new LIVR.Validator(rules);
    const validated = validator.validate(data);

    if (!validated) {
        throw new X({
            code   : VALIDATION,
            fields : {
                ...validator.getErrors()
            },
            message
        });
    }

    return validated;
}

module.exports = validate;
