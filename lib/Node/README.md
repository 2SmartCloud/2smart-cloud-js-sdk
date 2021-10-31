# Node

## API

**Node(options)**

Create empty Node instance

- options:
    - id: `String` Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`). Node id;
***

**Node.updateAttribute(attributes)**

Update node attributes

- attributes:
    - name: `String`. Node name;
    - type: `String`. Type of the node;
    - state: `String`. Default - `init`. There are 6 different states: init, ready, disconnected, sleeping, lost, alert;
    
***

**Node.validateMyStructure()**

Validate node attributes. Makes node `valid` if structure is correct. Throws exception if structure is invalid.
Error example:
```
{
    code   : 'VALIDATION_ERROR',
    fields : {
        // ... list of invalid attributes
    },
    message : 'Attributes validation error'
}
```

***

**Node.onAttach(homie, rootTopic, device)**

Inject node instance with homie environment

- homie: [homie](../homie/README.md) instance. Required;
- rootTopic: `String`. Root topic defined in `homie` environment. Required;
- device: [Device](../Device/README.md) instance. Parent device instance. Default: `null`;

***

**Property.onDetach()**

Remove homie instance and unsubscribe from events.

***

**Node.setSettingAttribute(attribute, value)**

Set node setting attribute to broker. Returns - `Promise`.

- attribute: `String`. One of - `name`. Required;
- value: `String`. Value to set. Required;

Throws exception if attribute invalid. Error example:
```
{
    code   : 'NOT_SETTABLE',
    fields : {
        state : 'NOT_SETTABLE'
    },
    message : 'Attribute state not settable'
}
```

***

**Node.publishAttribute(attribute, value)**

Publish node attribute to broker

- attribute: `String`. One of - `name`. Required;
- value: `String`. Value to publish. Required;

***

**Node.publishSetting(attribute, value)**

Publish node setting attribute to broker

- attribute: `String`. One of - `name`. Required;
- value: `String`. Value to publish. Required;

***

**Node.onAttributePublish(cb)**

Handle node attribute publish

- cb: `function(data)`. Callback to handle attribute publish event
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. One of - `DEVICE`, `NODE`, `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Node.onAttributeSet(cb)**

Handle node attribute set

- cb: `function(data)`. Callback to handle attribute set event
    - data:
        - field: `String`. Field to set;
        - value: `String`. New field value;
        - type: `String`. One of - `DEVICE`, `NODE`, `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Node.serialize()**

Get serialized node data

Returns: `Object`. Example -
```
{
    'id'      : 'thermometer',
    'sensors' : [
        {
            'id'       : 'temperature-sensor',
            'unit'     : '°C',
            'dataType' : 'float',
            'retained' : 'true',
            'settable' : 'false',
            'name'     : 'Current temperature',
            'value'    : '26'
        }
    ],
    'telemetry' : [],
    'options' : [],
    'state' : 'init',
    'type'  : 'V1',
    'name'  : 'Thermometer'
}
```
***

**Node.addSensor(sensor)**

Add node instance to node

- sensor: [Sensor](../Sensor/README.md) instance. Required;

***

**Node.addTelemetry(telemetry)**

Add telemetry instance to node

- telemetry: [Telemetry](../Property/README.md) instance. Required;

***

**Node.addOption(option)**

Add option instance to node

- option: [Option](../Property/README.md) instance. Required;

***

**Node.getId()**

Get node id

Returns: `String`

***

**Node.getName()**

Get node name

Returns: `String`

***

**Node.getSensors()**

Get list of node sensors

Returns: `Array`

***

**Node.getOptions()**

Get list of node options

Returns: `Array`

***

**Node.getTelemetry()**

Get list of node telemetry

Returns: `Array`

***

**Node.getState()**

Get node state

Returns: `String`

***

**Node.getSensorById(id)**

Get node sensor by id

- id: `String`. Sensor id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { sensor: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Node.getOptionById(id)**

Get node option by id

- id: `String`. Option id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { option: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Node.getTelemetryById(id)**

Get node telemetry by id

- id: `String`. Telemetry id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { nodetelemetry 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Node.getDevice()**

Get parent device instance.

Returns: [Device](../Device/README.md) instance

***

**Node.getDeviceId()**

Get parent device id.

Returns: `String`

Throws exception if parent device doesn't exist. Error example:
```
{
    code   : 'NOT_FOUND',
    fields : {
        device : 'NOT_FOUND'
    }
}
```

***

**Node.onErrorPublish(cb)**

Handle set validation error event

- cb: `function(data)`. Callback to handle error event
    - data:
        - value: `Object`. Error object:
            - code: `String`. Error code;
            - message: `String`. Error message;
        Default:
        ```
        {
            code: "ERROR",
            message: "Something went wrong"
        }
        ```
        - type: `String`. One of - `NODE`, `SENSOR`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Node.getType()**

Get node type

Returns: `String`

***

**Node.setDevice(device)**

Set [Device](../Device/README.md) for node.

***

**Node.getTitle()**

Get node title

Returns: `String`

***

**Node.getTopic()**

Get node topic.

Returns: `String`.

***

**Node.getRootTopic()**

Get root topic.

Returns: `String`.

***

**Node.isEmpty()**

Check if node doesn't contain any valid instance of Property

Returns: `Boolean`

***

**Node.delete()**

Unsubscribe from homie events and clear all attributes from instance.

***

**Node.deleteHandlers()**

Unsubscribe from homie events.

***

**Node.getTopics(all = false)**

Get an object of all topics and values from attributes.
`all = true` will return also a `setting topics`.

Returns: `Object`

***

**Node.deleteRequest()**

Send a request to delete node from system.
