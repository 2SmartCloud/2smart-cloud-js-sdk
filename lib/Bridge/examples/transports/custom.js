const BasePropertyTransport = require('../../Property/transport'); // homie-sdk/lib/Bridge/Property/transport

class CustomTransport extends BasePropertyTransport {
    constructor(config) {
        super({
            ...config,
            type : 'custom'
        });
    }

    async set(data) {
        if (data > 100) throw new Error(`Value: ${data} is not in range!`);

        return data;
    }
}

module.exports = CustomTransport;
