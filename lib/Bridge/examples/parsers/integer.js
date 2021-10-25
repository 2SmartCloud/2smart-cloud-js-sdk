const BaseParser = require('../../Parser'); // homie-sdk/lib/Bridge/Parser

class IntegerParser extends BaseParser {
    constructor({ mode } = {}) {
        super({ type: 'only-negative-parser', homieDataType: 'integer' });

        this.mode = mode === 'negative' ? 'negative' : 'positive';
    }

    fromHomie(data) {
        const value = Number(data);

        if (!this.isInt(data)) throw new Error('Integer is required!');
        if (!this.isValidValue(value)) throw new Error('Invalid value!');

        return [ value ];
    }

    toHomie(data) {
        return `${data}`;
    }

    isInt(value) {
        return !isNaN(value) && value % 1 === 0;
    }

    isValidValue(value) {
        if (this.mode === 'negative' && value <= 0) return true;
        else if (this.mode === 'positive' && value >= 0) return true;

        return false;
    }
}

module.exports = IntegerParser;
