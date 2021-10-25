const BasePropertyBridge = require('./../../Property'); // homie-sdk/lib/Bridge/Property

class PropertyBridge extends BasePropertyBridge {
    constructor(config, { type, transport, parser, debug }) {
        super(config, { type, transport, parser, debug });
    }
}

module.exports = PropertyBridge;
