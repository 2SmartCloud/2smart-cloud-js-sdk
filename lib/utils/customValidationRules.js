/* istanbul ignore file */
/* eslint-disable camelcase */
function property_validation() {
    const Property = require('../Property');

    return properties => {
        if (!properties.length) return;

        let isValid = true;

        properties.forEach(property => {
            if (!(property instanceof Property)) isValid = false;
        });

        if (!isValid) return 'WRONG_TYPE';
    };
}

function range_validation() {
    return value => {
        if (!value) return;

        if (!new RegExp('^\\d+-\\d+$').test(value)) return 'WRONG_FORMAT';

        const range = value.split('-');

        if (Number(range[0] > Number(range[1]))) return 'WRONG_FORMAT';
    };
}

function node_validation() {
    const Node = require('../Node');

    return nodes => {
        if (!nodes.length) return;

        let isValid = true;

        nodes.forEach(node => {
            if (!(node instanceof Node)) isValid = false;
        });

        if (!isValid) return 'WRONG_TYPE';
    };
}

function threshold_validation() {
    const Threshold = require('../Threshold');

    return thresholds => {
        if (!thresholds.length) return;

        let isValid = true;

        thresholds.forEach(th => {
            if (!(th instanceof Threshold)) isValid = false;
        });

        if (!isValid) return 'WRONG_TYPE';
    };
}

function sensor_validation() {
    const Sensor = require('../Sensor');

    return sensors => {
        if (!sensors.length) return;

        let isValid = true;

        sensors.forEach(sensor => {
            if (!(sensor instanceof Sensor)) isValid = false;
        });

        if (!isValid) return 'WRONG_TYPE';
    };
}

module.exports = {
    property_validation,
    range_validation,
    node_validation,
    sensor_validation,
    threshold_validation
};
