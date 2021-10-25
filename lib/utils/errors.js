const { ERROR_CODES } = require('../etc/config');
const X = require('./X');

const ERRORS = {};

for (const key in ERROR_CODES) {
    const code = ERROR_CODES[key];

    class DynamicError extends X {
        constructor(props) {
            if (!props) props = 'Something went wrong';
            if (typeof props === 'string') props = { message: props };
            super({ ...props, code });
        }
    }
    Object.defineProperty(DynamicError, 'name', { value: 'key' });
    ERRORS[key] = DynamicError;
}

module.exports = ERRORS;
