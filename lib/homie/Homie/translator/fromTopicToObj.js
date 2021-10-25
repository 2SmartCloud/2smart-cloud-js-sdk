const _find = require('lodash/find');
const { translateTopicToObj, getKeyByTopic } = require('./../../../etl');

const {
    DEVICE_ROOT_TOPIC,
    ERROR_TOPIC,
    SCENARIO_TOPIC,
    DEVICE_SETTINGS_TOPIC,
    EVENTS_TOPIC,
    DISCOVERY_TOPIC,
    REQUEST_TOPIC,
    RESPONSE_TOPIC,
    HEARTBEAT_ATTRIBUTE
} = require('./../config');

const {
    DEVICE_ATTRS,
    DEVICE_PROP_OPTION_ATTRS,
    DEVICE_PROP_OPTION_PROPS,
    SENSOR_PROPS,
    NODE_ATTRS,
    SENSOR_ATTRS,
    NODE_PROP_OPTION_PROPS,
    NODE_PROP_OPTION_ATTRS,
    SCENARIO_ATTR,
    THRESHOLD_ATTR,
    DEVICE_ATTR_TOPIC,
    DEVICE_NODE_TOPIC,
    DEVICE_NODE_SENSOR_TOPIC,
    NODE_TOPIC,
    HEARTBEAT_ATTR,
    ENTITY_ATTR,
    DISCOVERY_NEW,
    ENTITY,
    DEVICE_TOPIC
} = require('./translator-config');

class Translator {
    constructor({ entitiesScheme }) {
        this.deviceTopic = DEVICE_ROOT_TOPIC;
        this.errorTopic = ERROR_TOPIC;
        this.scenarioTopic = SCENARIO_TOPIC;
        this.requestTopic = REQUEST_TOPIC;
        this.deviceSettingsTopic = DEVICE_SETTINGS_TOPIC;
        this.eventsTopic = EVENTS_TOPIC;
        this.heartbeatAttribute = HEARTBEAT_ATTRIBUTE;
        this.discoveryTopic = DISCOVERY_TOPIC;
        this.responseTopic = RESPONSE_TOPIC;

        this.entitiesScheme = entitiesScheme;
    }

    // eslint-disable-next-line complexity
    parseTopic(topic, value) {
        let error;
        let event = null;
        let translated;

        const map = topic.split('/');

        let root = map.shift();

        if (root === this.errorTopic) {
            event = 'ERROR';
            error = JSON.parse(value);
            root = map.shift();
        }

        if (!event && map[map.length - 1] === 'set') { // check set
            switch (root) {
                case null:
                case this.requestTopic:
                case this.responseTopic:
                    break;
                case this.eventsTopic:
                case this.scenarioTopic:
                case this.deviceSettingsTopic:
                case this.deviceTopic: {
                    event = 'SET';
                    map.pop();
                    break;
                }
                default:
                    event = 'SET';
                    map.pop();
                    break;
            }
        }

        if (root === this.deviceTopic && map[map.length - 1] === this.heartbeatAttribute) { // check heartbeat
            root = null;
            map.pop();
            translated = { type: HEARTBEAT_ATTR, options: { translated: { value }, propertyId: map[0] } };
        }

        if (!event) {
            switch (root) {
                case null:
                case this.scenarioTopic:
                case this.deviceSettingsTopic:
                case this.deviceTopic:
                    break;
                case this.eventsTopic:
                    event = 'EVENT';
                    break;
                case this.requestTopic:
                    event = 'REQUEST';
                    break;
                case this.responseTopic:
                    event = 'RESPONSE';
                    break;
                case this.discoveryTopic:
                    /*
                     * discovery topics are now processed by discovery entity,
                     * handle only topics that starts with "discovery/new" to leave old
                     * interface for the receiving device announced message
                     */
                    if (map[0] === 'new') {
                        event = 'DISCOVERY';
                        break;
                    }
                // eslint-disable-next-line no-fallthrough
                default: {
                    if (map.length <= 2) {
                        const t = map[map.length - 1];

                        switch (t) {
                            case 'create':
                            case 'update':
                            case 'delete':
                                event = t.toUpperCase();
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }

        if (!event) {
            event = 'PUBLISH';
        }

        switch (root) {
            case null:
                break;
            case this.eventsTopic: {
                value = JSON.parse(value);
                translated = this._translateEvent({ map, value, error });
                break;
            }
            case this.requestTopic:
            case this.responseTopic: {
                value = JSON.parse(value);
                translated = { type: map[0].toUpperCase().replace('-', '_'), options: { translated: { value }, method: map[1] } };
                break;
            }
            case this.scenarioTopic: {
                translated = this._translateScenario({ map, value, error });
                break;
            }
            case this.deviceSettingsTopic:
                map.shift();
                translated = this._translateDeviceMap({ map, value, error });
                break;
            case this.deviceTopic: {
                translated = this._translateDeviceMap({ map, value, error });
                break;
            }
            case this.discoveryTopic:
                /*
                 * discovery topics are now processed by discovery entity,
                 * handle only topics that starts with "discovery/new" to leave old
                 * interface for the receiving device announced message
                 */
                if (map[0] === 'new') {
                    translated = this._translateDiscovery({ map, value });
                    break;
                }
            // eslint-disable-next-line no-fallthrough
            default: {
                if (map.length <= 2) {
                    const t = map[map.length - 1];

                    switch (t) {
                        case 'create':
                        case 'update':
                        case 'delete':
                            value = JSON.parse(value);
                            break;
                        // istanbul ignore next
                        default:
                            break;
                    }
                    const entity = _find(this.entitiesScheme, { rootTopic: root });

                    translated = this._translateEntityMap({ map, value, entity, error });
                }
            }
        }

        if (!translated) {
            return { event: undefined };
        }

        return { event, translated: { ...translated, topicLen: map.length } };
    }

    _translateEntityMap({ map, value, error, entity = {} }) {
        const property = map[map.length - 1];

        let translated;
        let type;

        if (property === 'create'
            || property === 'update'
            || property === 'delete') {
            type = ENTITY;
            translated = error ? { [property]: error } : { value };
        } else {
            type = ENTITY_ATTR;
            translated = error ?
                { [getKeyByTopic('ENTITY', property)]: error } :
                translateTopicToObj('ENTITY', { property, value });
        }

        return {
            type,
            options : {
                translated,
                entityId   : map[0],
                entityType : entity.type
            }
        };
    }

    _translateEvent(data) {
        const event = data.map[0];

        return { type: event, options: { translated: { value: data.value } } };
    }

    _translateDeviceMap(data) {
        const mapLength = data.map.length;

        const trMethod = {
            [DEVICE_TOPIC]             : this._translate1,
            [DEVICE_ATTR_TOPIC]        : this._translate2,
            [DEVICE_NODE_TOPIC]        : this._translate3,
            [DEVICE_NODE_SENSOR_TOPIC] : this._translate4,
            [NODE_TOPIC]               : this._translate5
        }[mapLength];

        const { type, options } = trMethod(data) || { type: null, options: null };

        // istanbul ignore next
        if (!options || !type) {
            return;
        }

        return { type, options };
    }

    _translate1(data) {
        const deviceId = data.map[0];

        return {
            type    : DEVICE_ATTRS,
            options : {
                translated : {},
                deviceId
            }
        };
    }

    _translate2(data) {
        const { map, value, error } = data;
        const property = map[1];
        const isDeviceProperty = Boolean(map[1].charAt(0) === '$');

        if (isDeviceProperty) {
            const translated = error ?
                { [getKeyByTopic('DEVICE', property)]: error } :
                translateTopicToObj('DEVICE', { property, value });

            return { type: DEVICE_ATTRS, options: { translated, deviceId: map[0] } };
        }

        return {
            type    : NODE_ATTRS,
            options : {
                translated : {},
                deviceId   : map[0],
                nodeId     : map[1]
            }
        };
    }

    _translate3(data) {
        const { map, value, error } = data;
        const isDeviceProperty = Boolean(map[1].charAt(0) === '$');
        let translated;

        if (isDeviceProperty) {
            // If topic is "$fw/<property>" then it's related to device attributes
            const isAttribute = Boolean(map[1] === '$fw');

            if (isAttribute) {
                const property = `${map[1]}/${map[2]}`;

                translated = error ?
                    { [getKeyByTopic('DEVICE', property)]: error } :
                    translateTopicToObj('DEVICE', { property, value });

                return { type: DEVICE_ATTRS, options: { translated, deviceId: data.map[0] } };
            }

            return {
                type    : DEVICE_PROP_OPTION_PROPS,
                options : {
                    translated : { value: error || value },
                    propertyId : map[2],
                    attribute  : map[1].substr(1),
                    deviceId   : map[0]
                }
            };
        }

        const isNodeAttr = Boolean(map[2].charAt(0) === '$');

        if (isNodeAttr) {
            const property = map[2];

            translated = error ?
                { [getKeyByTopic('NODE', property)]: error } :
                translateTopicToObj('NODE', { property, value });

            return {
                type    : NODE_ATTRS,
                options : {
                    translated,
                    nodeId    : map[1],
                    attribute : 'nodes',
                    deviceId  : map[0]
                }
            };
        }

        return {
            type    : SENSOR_PROPS,
            options : {
                translated : { value: error || value },
                nodeId     : map[1],
                propertyId : map[2],
                attribute  : 'sensors',
                deviceId   : map[0]
            }
        };
    }

    _translate4(data) {
        const { map, value, error } = data;
        const isProperty = Boolean(map[1].charAt(0) === '$' && map[3].charAt(0) === '$');
        let translated;

        if (isProperty) {
            const property = map[3];

            translated = error ?
                { [getKeyByTopic('PROPERTY', property)]: error } :
                translateTopicToObj('PROPERTY', { property, value });

            return {
                type    : DEVICE_PROP_OPTION_ATTRS,
                options : {
                    translated,
                    propertyId : map[2],
                    attribute  : map[1].substr(1),
                    deviceId   : map[0]
                }
            };
        }

        const isSensorAttrs = Boolean(map[3].charAt(0) === '$');

        if (isSensorAttrs) {
            const property = map[3];

            translated = error ?
                { [getKeyByTopic('PROPERTY', property)]: error } :
                translateTopicToObj('PROPERTY', { property, value });

            return {
                type    : SENSOR_ATTRS,
                options : {
                    translated,
                    attribute  : 'sensors',
                    nodeId     : map[1],
                    propertyId : map[2],
                    deviceId   : map[0]
                }
            };
        }

        const isNodeProps = Boolean(map[2].charAt(0) === '$');

        if (isNodeProps) {
            return {
                type    : NODE_PROP_OPTION_PROPS,
                options : {
                    translated : { value: error || value },
                    nodeId     : map[1],
                    propertyId : map[3],
                    attribute  : map[2].substr(1),
                    deviceId   : map[0]
                }
            };
        }
    }

    _translate5(data) {
        const { map, value, error } = data;
        const isNodeAttrs = Boolean(map[2].charAt(0) === '$' && map[4].charAt(0) === '$');

        if (isNodeAttrs) {
            const property = map[4];
            const translated = error ?
                { [getKeyByTopic('PROPERTY', property)]: error } :
                translateTopicToObj('PROPERTY', { property, value });

            return {
                type    : NODE_PROP_OPTION_ATTRS,
                options : {
                    translated,
                    attribute  : map[2].substr(1),
                    nodeId     : map[1],
                    propertyId : map[3],
                    deviceId   : map[0]
                }
            };
        }
    }


    _translateScenario(data) {
        const { map, value, error } = data;
        const scenarioId = map[0];

        let property = null;
        let thresholdId = null;
        let entity = null;
        let type = null;

        switch (map.length) {
            case 3: // used for threshold prop scenarios/<scId>/<thId>/$<prop>
                property = map[2];
                thresholdId = map[1];
                entity = 'THRESHOLD';
                type = THRESHOLD_ATTR;
                break;
            case 1: // used for homie.getEntityByRootTopic('scenarios/<scId>')
                property = null;
                thresholdId = null;
                entity = 'SCENARIO';
                type = SCENARIO_ATTR;
                break;
            default:
                if (map[1] === '$state' || map[1] === '$thresholds') { // used for scenario prop ; scenarios/<scId>/$<prop>
                    property = map[1];
                    entity = 'SCENARIO';
                    type = SCENARIO_ATTR;
                } else { // used for th value scenarios/<scId>/<thId>
                    property = '$value';
                    thresholdId = map[1];
                    entity = 'THRESHOLD';
                    type = THRESHOLD_ATTR;
                }
                break;
        }
        const translated = error ?
            { [getKeyByTopic(entity, property)]: error } :
            translateTopicToObj(entity, { property, value });

        return {
            type,
            options : {
                translated,
                thresholdId,
                scenarioId
            }
        };
    }

    _translateDiscovery(data) {
        const { map, value } = data;

        /**
         * discovery type: 'new'
         * deviceId: 'DEVICE_UUID'
         */
        const [ discoveryType, deviceId ] = map;

        let type;
        let translated;

        switch (discoveryType) {
            case 'new':
                type = DISCOVERY_NEW;
                translated = { value };
                break;
            default:
                // istanbul ignore next
                break;
        }

        return {
            type,
            options : {
                translated,
                deviceId
            }
        };
    }
}

module.exports = Translator;
