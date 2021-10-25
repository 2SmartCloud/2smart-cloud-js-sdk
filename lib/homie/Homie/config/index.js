const {
    DEVICE_ATTRS,
    NODE_ATTRS,
    SENSOR_PROPS,
    DEVICE_PROP_OPTION_PROPS,
    DEVICE_PROP_OPTION_ATTRS,
    SENSOR_ATTRS,
    NODE_PROP_OPTION_PROPS,
    NODE_PROP_OPTION_ATTRS,
    THRESHOLD_ATTR,
    DEVICE_ATTR_TOPIC,
    DEVICE_NODE_TOPIC,
    DEVICE_NODE_SENSOR_TOPIC,
    NODE_TOPIC,
    ENTITY_ATTR,
    ENTITY_LIST_TOPIC,
    SCENARIO_ATTR
} = require('../translator/translator-config');

const UPD_METHODS = {
    [ENTITY_LIST_TOPIC] : {
        [ENTITY_ATTR] : '_updateEntityState'
    },
    [DEVICE_ATTR_TOPIC] : {
        [DEVICE_ATTRS]   : '_updateDeviceState',
        [SCENARIO_ATTR]  : '_updateScenarioState',
        [THRESHOLD_ATTR] : '_updateThresholdState',
        [ENTITY_ATTR]    : '_updateEntityState'
    },
    [DEVICE_NODE_TOPIC] : {
        [DEVICE_ATTRS]             : '_updateDeviceState',
        [NODE_ATTRS]               : '_updateDevicePropertyState',
        [SENSOR_PROPS]             : '_updateNodePropertyState',
        [DEVICE_PROP_OPTION_PROPS] : '_updateDevicePropertyState',
        [THRESHOLD_ATTR]           : '_updateThresholdState'
    },
    [DEVICE_NODE_SENSOR_TOPIC] : {
        [DEVICE_PROP_OPTION_ATTRS] : '_updateDevicePropertyState',
        [SENSOR_ATTRS]             : '_updateNodePropertyState',
        [NODE_PROP_OPTION_PROPS]   : '_updateNodePropertyState'
    },
    [NODE_TOPIC] : {
        [NODE_PROP_OPTION_ATTRS] : '_updateNodePropertyState'
    }
};

module.exports = {
    UPD_METHODS,
    DEVICE_ROOT_TOPIC     : 'sweet-home',
    ERROR_TOPIC           : 'errors',
    THRESHOLD_TOPIC       : 'scenarios', // legacy variable
    SCENARIO_TOPIC        : 'scenarios',
    HEARTBEAT_ATTRIBUTE   : '$heartbeat',
    DEVICE_SETTINGS_TOPIC : 'device-settings',
    EVENTS_TOPIC          : 'events',
    DISCOVERY_TOPIC       : 'discovery',
    REQUEST_TOPIC         : 'request',
    RESPONSE_TOPIC        : 'response',
    defaultInitOptions    : {
        setWill : true
    }
};
