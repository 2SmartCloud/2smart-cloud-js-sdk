const Homie = require('./../Homie');
const X = require('./../../utils/X');
const { ERROR_CODES: { WRONG_FORMAT } } = require('./../../etc/config');

class HomieServer {
    constructor({ homie }) {
        if (!homie || !(homie instanceof Homie)) {
            throw new X({
                code    : WRONG_FORMAT,
                fields  : {},
                message : 'Instance of Homie is required'
            });
        }

        this.homie = homie;
    }

    initWorld() {
        return this.homie.init();
    }

    onDeleteRequest(cb) {
        this.homie.on('events.delete', cb);
    }

    onNewThreshold(cb) {
        this.homie.on('new_threshold', cb);
    }

    getThresholdById(scenarioId, id) {
        const threshold = this.homie.getThresholdById(scenarioId, id);

        this.homie.attachThreshold(threshold);

        return threshold;
    }

    getDeviceById(id) {
        const device = this.homie.getDeviceById(id);

        this.homie.attach(device);

        return device;
    }

    getScenarios() {
        return this.homie.getScenarios();
    }

    getScenariosState() {
        return this.homie.getScenariosState();
    }

    getDevices() {
        const devices = this.homie.getDevices();

        Object.keys(devices).forEach(id => {
            this.homie.attach(devices[id]);
        });

        return devices;
    }

    // DEPRECATED: use HomieClient.getEntities('DISCOVERY') instead
    getDiscovery() {
        return this.homie.getDiscovery();
    }

    getThresholds() {
        const thresholds = this.homie.getThresholds();

        Object.keys(thresholds).forEach(id => {
            thresholds[id].forEach(threshold => this.homie.attachThreshold(threshold));
        });

        return thresholds;
    }

    getEntities(type) {
        return this.homie.getEntities(type);
    }

    getEntityById(type, id) {
        return this.homie.getEntityById(type, id);
    }

    onNewDeviceAdded(cb) {
        this.homie.on('new_device', cb);
    }

    onDelete(cb) {
        this.homie.on('events.delete.success', cb);
    }
}

module.exports = HomieServer;
