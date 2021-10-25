/* istanbul ignore file */

const HomieMigrator = require('../homie/HomieMigrator');
const HomieServer = require('../homie/HomieServer');
const { COMMON_VALIDATION_RULES } = require('../etc/config');

class Bridge {
    constructor({ homie }) {
        this.homie = homie;
        this.migrator = new HomieMigrator({ homie });
        this.homieServer = new HomieServer({ homie });
        this.indicatorIds = [ 'signal', 'battery' ];
        this.states = COMMON_VALIDATION_RULES.STATE_TYPES;
    }

    initWorld(id) {
        return this.migrator.initWorld(id);
    }

    publishDevice(deviceObj) {
        this.migrator.attachDevice(deviceObj);
    }

    getDeviceById(id) {
        return this.homieServer.getDeviceById(id);
    }
}

module.exports = Bridge;
