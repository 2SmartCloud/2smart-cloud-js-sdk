/**
 * Description for constants. Data that can be described in topics
 *
 * ENTITY_LIST_TOPIC        - list of entities id's ($list)
 *
 * DEVICE_TOPIC             - topic with device id
 *
 * DEVICE_ATTR_TOPIC        - only device attributes (device/$name, device/$state, etc)
 *
 * DEVICE_NODE_TOPIC        - node attributes (device/node/$name, device/node/$type, etc),
 *                            sensor prop (device/node/sensor),
 *                            device attributes (device/$fw/name, device/$fw/version),
 *                            device property/options props (device/$telemetry/battery, etc)
 *
 * DEVICE_NODE_SENSOR_TOPIC - device property/options attributes (device/$telemetry/battery/$name, etc)
 *                            sensor attributes (device/node/sensor/$datatype, etc)
 *                            node property/options property (device/node/$telemetry/telemetry ID, etc)
 *
 * NODE_TOPIC               - node property/options attributes (device/node/$telemetry/telemetry ID/$name, etc)
 *
 */

const ENTITY_LIST_TOPIC = 1;
const DEVICE_TOPIC = 1;
const DEVICE_ATTR_TOPIC = 2;
const DEVICE_NODE_TOPIC = 3;
const DEVICE_NODE_SENSOR_TOPIC = 4;
const NODE_TOPIC = 5;

const DEVICE_ATTRS = 'device_attributes';
const NODE_ATTRS = 'node_attributes';
const SENSOR_PROPS = 'sensor_properties';
const DEVICE_PROP_OPTION_PROPS = 'device_property_option_properties';
const DEVICE_PROP_OPTION_ATTRS = 'device_property_option_attributes';
const SENSOR_ATTRS = 'sensor_attributes';
const NODE_PROP_OPTION_PROPS = 'node_property_option_properties';
const NODE_PROP_OPTION_ATTRS = 'node_property_option_attributes';
const THRESHOLD_ATTR = 'threshold_attributes';
const SCENARIO_ATTR = 'scenario_attributes';
const HEARTBEAT_ATTR = 'heartbeat_attribute';
const ENTITY_ATTR = 'entity_attributes';
const DISCOVERY_NEW = 'discovery_new';
const ENTITY = 'entity';

const EVENT_PUBLISH = 'PUBLISH';
const EVENT_SET = 'SET';
const EVENT_CREATE = 'CREATE';
const EVENT_UPDATE = 'UPDATE';
const EVENT_DELETE = 'DELETE';
const EVENT_ERROR = 'ERROR';
const EVENT_EVENT = 'EVENT';
const EVENT_DISCOVERY = 'DISCOVERY';
const EVENT_REQUEST = 'REQUEST';
const EVENT_RESPONSE = 'RESPONSE';

module.exports = {
    DEVICE_ATTR_TOPIC,
    DEVICE_NODE_TOPIC,
    DEVICE_NODE_SENSOR_TOPIC,
    NODE_TOPIC,
    DEVICE_ATTRS,
    NODE_ATTRS,
    SENSOR_PROPS,
    DEVICE_PROP_OPTION_PROPS,
    DEVICE_PROP_OPTION_ATTRS,
    SENSOR_ATTRS,
    NODE_PROP_OPTION_PROPS,
    NODE_PROP_OPTION_ATTRS,
    THRESHOLD_ATTR,
    SCENARIO_ATTR,
    HEARTBEAT_ATTR,
    ENTITY_ATTR,
    DISCOVERY_NEW,
    ENTITY,
    ENTITY_LIST_TOPIC,
    EVENT_PUBLISH,
    EVENT_SET,
    EVENT_CREATE,
    EVENT_UPDATE,
    EVENT_DELETE,
    EVENT_ERROR,
    EVENT_EVENT,
    EVENT_DISCOVERY,
    EVENT_REQUEST,
    EVENT_RESPONSE,
    DEVICE_TOPIC
};
