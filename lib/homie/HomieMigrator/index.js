const {
    SCENARIO_TOPIC
} = require('../Homie/config');

const Debugger = require('./../../utils/debugger');
const X = require('./../../utils/X');
const Device = require('./../../Device');
const Scenario = require('./../../Scenario');
const Node = require('./../../Node');
const Property = require('./../../Property');
const Threshold = require('./../../Threshold');
const { ERROR_CODES: { WRONG_TYPE, NOT_FOUND, WRONG_FORMAT } } = require('./../../etc/config');
const Homie = require('./../Homie');

class HomieMigrator {
    constructor({ homie }) {
        if (!homie || !(homie instanceof Homie)) {
            throw new X({
                code    : WRONG_FORMAT,
                fields  : {},
                message : 'Instance of Homie is required'
            });
        }

        this.homie = homie;
        this.state = {};
        this.rootTopic = this.homie.getRootTopic();
        this.debug = new Debugger();
    }

    async initWorld(id, topicsToSubscribe, options) {
        await this.homie.init(id, topicsToSubscribe, options);
    }

    deleteDevice(device) {
        if (!(device instanceof Device)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    device : 'WRONG_TYPE'
                },
                message : 'Device required!'
            });
        }

        const topics = device.getTopics(true);

        // ! This method will be called in Homie._deleteDevice method
        // device.delete();

        Object.keys(topics).forEach(topic => {
            this.homie.publishToBroker(topic, '');
        });
    }

    // Completely delete node from the system(from broker and memory)
    //     node <Node> - a node instance to delete
    //     withAllTopics <boolean> - flag specified whether to delete all topics related
    //                               with node or not(e.g. device-settings/)
    deleteNode(node, withAllTopics = true) {
        if (!(node instanceof Node)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    instance : 'WRONG_TYPE'
                },
                message : 'Node required!'
            });
        }

        // const nodeId = node.id;

        const topics = node.getTopics(withAllTopics);

        // ! This methods will be called in Homie._deleteNode method
        // node.device.removeNodeById(nodeId);
        // node.delete();

        Object.keys(topics).forEach(topic => {
            this.homie.publishToBroker(topic, '');
        });
    }

    deleteScenario(scenario, withAllTopics = true) {
        if (!(scenario instanceof Scenario)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    scenario : 'WRONG_TYPE'
                },
                message : 'scenario required!'
            });
        }

        const topics = scenario.getTopics(withAllTopics);

        Object.keys(topics).forEach(topic => {
            this.homie.publishToBroker(topic, '');
        });
    }

    async deleteEntity(entity) {
        let EntityClass = null;

        for (const entityType in this.homie.entitiesStore.classes) {
            if (entity instanceof this.homie.entitiesStore.classes[entityType]) {
                EntityClass = this.homie.entitiesStore.classes[entityType];
                break;
            }
        }

        if (!EntityClass) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    instance : 'WRONG_TYPE'
                },
                message : 'Valid entity is required!'
            });
        }


        const attributes = entity.getAttributesList();
        const updated = {};

        for (const attribute of attributes) {
            updated[attribute] = '';
        }
        await entity.publish(updated, true);

        entity.delete();
    }

    /**
     * Delete all thresholds in array from broker and homie
     *
     * @param {Threshold[]} thresholds - An array of thresholds to delete.
     */
    deleteThresholds(thresholds) {
        if (!(thresholds instanceof Array)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    instance : 'WRONG_TYPE'
                },
                message : 'Thresholds must be an array!'
            });
        }

        const everyElementIsInstanceOfThreshold = thresholds.every(
            threshold => threshold instanceof Threshold
        );

        if (!everyElementIsInstanceOfThreshold) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    instance : 'WRONG_TYPE'
                },
                message : 'Thresholds required!'
            });
        }

        /**
         * Object which keys will be scenario IDs and value will be an
         * array of thresholds related to this scenario
         *
         * Example:
         * {
         *     "scenario1": [Threshold {}, Threshold {}, ...],
         *     "scenario2": [Threshold {}, Threshold {}, ...]
         * }
         */
        const thresholdsByScenarioIds = {};

        for (const threshold of thresholds) {
            const scenarioId = threshold.getScenarioId();

            if (!thresholdsByScenarioIds[scenarioId]) {
                thresholdsByScenarioIds[scenarioId] = [];
            }

            thresholdsByScenarioIds[scenarioId].push(threshold);

            this.homie._deleteThreshold(threshold);

            const topics = threshold.getTopics();

            // Publish empty value to every threshold topic to remove it
            Object.keys(topics).forEach(topic => {
                this.homie.publishToBroker(topic, '');
            });
        }

        Object
            .keys(thresholdsByScenarioIds)
            .forEach(scenarioId => {
                const homieThresholds = this.homie.getAllThresholds();

                // Make a string of threshold IDs separated by ',' (example: 'threshold1,threshold2,threshold3')
                const thresholdIds = Array.from(
                    homieThresholds[scenarioId] || [],
                    threshold => threshold.getId()
                ).toString();

                // Publish the remaining values of scenario's threshold IDs to broker
                this.homie.publishToBroker(
                    `${SCENARIO_TOPIC}/${scenarioId}/$thresholds`,
                    thresholdIds,
                    { retain: true }
                );
            });
    }

    attachScenario(scenarioObj) {
        let scenario = null;

        if (scenarioObj instanceof Scenario) scenario = scenarioObj;
        else if (this.homie.scenarios[scenarioObj.id]) scenario = this.homie.scenarios[scenarioObj.id];
        else scenario = new Scenario({ id: scenarioObj.id });

        if (this.homie.scenarios[scenario.id] && this.homie.scenarios[scenario.id] !== scenario) {
            this.homie.scenarios[scenario.id].delete();
        }

        scenario.updateAttribute({
            state : scenarioObj.state
        });

        scenario.validateMyStructure();

        this.homie.attachScenario(scenario);
        this.attachThresholds(scenario, scenarioObj.thresholds);
        this.homie.scenarios[scenario.id] = scenario;

        this.publishScenario(scenario);

        return scenario;
    }

    attachThresholds(scenario, thresholds = []) {
        if (!(scenario instanceof Scenario)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    scenario : 'WRONG_TYPE'
                },
                message : 'Scenario required!'
            });
        }

        thresholds.forEach(thresholdObj => {
            try {
                let threshold;

                if (thresholdObj instanceof Threshold) {
                    threshold = thresholdObj;
                } else {
                    threshold = new Threshold({ id: thresholdObj.id, scenarioId: thresholdObj.scenarioId });
                }

                threshold.updateAttribute({
                    name     : thresholdObj.name,
                    settable : thresholdObj.settable,
                    retained : thresholdObj.retained,
                    dataType : thresholdObj.dataType,
                    unit     : thresholdObj.unit,
                    format   : thresholdObj.format
                });

                threshold.validateMyStructure();

                scenario.addThreshold(threshold);

                this.homie.attachThreshold(threshold);
            } catch (err) {
                /* istanbul ignore next */
                this.debug.warning('HomieMigrator.attachThreshold', err);
            }
        });
    }

    publishScenario(scenario) {
        if (!(scenario instanceof Scenario)) throw new Error('scenario must be instance of Scenario');

        const topics = scenario.getTopics();

        Object.keys(topics).forEach(topic => {
            const value = topics[topic];

            this.homie.publishToBroker(topic, value);
        });
    }

    attachDevice(deviceObj) {
        let device;

        if (deviceObj instanceof Device) device = deviceObj;
        else if (this.homie.devices[deviceObj.id]) device = this.homie.devices[deviceObj.id];
        else device = new Device({ id: deviceObj.id });

        if (this.homie.devices[device.id] && this.homie.devices[device.id] !== device) {
            this.homie.devices[device.id].delete();
        }

        device.updateAttribute({
            name            : deviceObj.name,
            firmwareName    : deviceObj.firmwareName,
            firmwareVersion : deviceObj.firmwareVersion,
            localIp         : deviceObj.localIp,
            mac             : deviceObj.mac,
            implementation  : deviceObj.implementation,
            state           : deviceObj.state
        });

        device.validateMyStructure();

        this.attachNodes(device, deviceObj.nodes);
        this.attachProperties(device, deviceObj.telemetry, 'DEVICE_TELEMETRY');
        this.attachProperties(device, deviceObj.options, 'DEVICE_OPTION');

        this.homie.attach(device);
        this.homie.devices[device.getId()] = device;

        this.publishDevice(device);
    }
    publishDevice(device) {
        if (!(device instanceof Device)) throw new Error('device must be instanceof Device');

        const topics = device.getTopics();

        Object.keys(topics).forEach(topic => {
            this.homie.publishToBroker(topic, topics[topic]);
        });
    }

    attachNodes(device, nodes = []) {
        if (!(device instanceof Device)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    device : 'WRONG_TYPE'
                },
                message : 'Device required!'
            });
        }

        nodes.forEach(nodeObj => {
            try {
                let node;

                if (nodeObj instanceof Node) {
                    node = nodeObj;
                } else {
                    node = new Node({ id: nodeObj.id });
                }

                node.updateAttribute({
                    name  : nodeObj.name,
                    type  : nodeObj.type,
                    range : nodeObj.range,
                    state : nodeObj.state
                });

                node.validateMyStructure();

                device.addNode(node);

                this.attachProperties(node, nodeObj.sensors, 'SENSOR');
                this.attachProperties(node, nodeObj.telemetry, 'NODE_TELEMETRY');
                this.attachProperties(node, nodeObj.options, 'NODE_OPTION');
            } catch (err) {
                /* istanbul ignore next */
                this.debug.warning('HomieMigrator.attachNodes', err);
            }
        });
    }

    attachProperties(instance, properties = [], type = '') {
        if (!(instance instanceof Device) && !(instance instanceof Node)) {
            throw new X({
                code   : WRONG_TYPE,
                fields : {
                    instance : 'WRONG_TYPE'
                },
                message : 'Device or Node required!'
            });
        }

        switch (type) {
            case 'SENSOR': {
                this._callAttachByProp(instance, properties, 'addSensor');
                break;
            }
            case 'DEVICE_OPTION':
            case 'NODE_OPTION': {
                this._callAttachByProp(instance, properties, 'addOption', 'options');
                break;
            }
            case 'DEVICE_TELEMETRY':
            case 'NODE_TELEMETRY': {
                this._callAttachByProp(instance, properties, 'addTelemetry', 'telemetry');
                break;
            }
            /* istanbul ignore next */
            default:
                break;
        }
    }

    async attachEntity(entityType, entityObj) {
        const EntityClass = this.homie.entitiesStore.classes[entityType];

        if (!EntityClass) {
            throw new X({
                code   : NOT_FOUND,
                fields : {
                    entityType : 'NOT_FOUND'
                },
                message : `Entity class - ${entityType} not found!`
            });
        }
        const entity = new EntityClass({ id: entityObj.id });

        entity.updateAttribute(entityObj);
        entity.validateMyStructure();
        entity.onAttach(this.homie);

        this.homie.entities[entityType] = this.homie.entities[entityType] || {};
        this.homie.entities[entityType][entity.getId()] = entity;

        await entity.publish(entity.getAttributesList(), true);

        return entity;
    }

    _callAttachByProp(instance, properties, method, type = '') {
        properties.forEach(propObj => {
            try {
                let prop;

                if (propObj instanceof Property) {
                    prop = propObj;
                } else {
                    prop = new Property({ id: propObj.id });
                }

                prop._eventPrefix = type;
                prop.updateAttribute(propObj);
                prop.validateMyStructure();

                instance[method](prop);
            } catch (err) {
                /* istanbul ignore next */
                this.debug.warning('HomieMigrator._callAttachByProp', err);
            }
        });
    }

    initializeEntityClass(type) {
        this.homie.initializeEntityClass(type);
    }

    destroyEntityClass(type) {
        this.homie.destroyEntityClass(type);
    }
}

module.exports = HomieMigrator;
