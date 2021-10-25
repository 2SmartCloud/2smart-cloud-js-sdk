const BaseBridge = require('../../index'); // homie-sdk/lib/Bridge

class Bridge extends BaseBridge {
    constructor(config) {
        super({ ...config, device: null });

        // custom connection instance
        this.connection = config.connection;

        if (config.device) this.setDeviceBridge(config.device);
    }
}

module.exports = Bridge;
