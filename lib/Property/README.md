# Property [DEPRECATED]

## API

- Property(options)
- Property.updateAttribute(data)
- Property.validateMyStructure()
- Property.onAttach(homie, rootTopic, deviceId, nodeId)
- Property.setAttribute(attribute, value)
- Property.publishAttribute(attribute, value)
- Property.publishError(error)
- Property.onAttributePublish(cb)
- Property.onAttributeSet(cb)
- Property.serialize()
- Property.addSensor(sensor)
- Property.addTelemetry(telemetry)
- Property.addOption(option)
- Property.getId()
- Property.getName()
- Property.getState()
- Property.getValue()
- Property.getSettable()
- Property.getRetained()
- Property.getDataType()
- Property.getUnit()
- Property.getFormat()
- Property.getDevice()
- Property.getNode()
- Property.getDeviceId()
- Property.getNodeId()
- Property.setValue(value)
- Property.setDevice(device)
- Property.setNode(node)

***

**Property(options)**

Create empty Property instance

- options:
    - id: `String` Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`). Property id;

***

**Property.updateAttribute(attributes)**

Update property attributes

- attributes:
    - name: `String` Required. Property name;
    - value: `String` property value;
    - settable: `Boolean`. Is property settable. Default: `false`;
    - retained: `Boolean`. Is property retained. Default: `true`;
    - dataType: `String`. One of: `integer`, `float`, `boolean`, `string`, `enum`, `color`. Default: `string`;
    - unit: `String`. A string containing the unit of this property. You are not limited to the recommended values, although they are the only well known ones that will have to be recognized by any Homie consumer;
    - format: `String`. Describes what are valid values for this property. Required for data types `enum` and `color`.
    Formats for data types:
        - `integer`, `float`: `from:to` (for example - `10:15`);
        - `enum`: `value,value,value` (for example - `ON,OFF,PAUSE`);
        - `color`: `rgb` or `hsv` (for example - `255,255,0` or `60,100,100`)
    
***

**Property.validateMyStructure()**

Validate property attributes. Makes property `valid` if structure is correct. Throws exception if structure is invalid.
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

**Property.onAttach(homie, rootTopic, device, node)**

Inject property instance with homie environment

- homie: [homie](../homie/README.md) instance. Required;
- rootTopic: `String`. Root topic defined in `homie` environment. Required;
- device: [Device](../Device/README.md) instance. Parent device instance. Default: `null`;
- node: [Node](../Node/README.md) instance. Parent node instance. Default: `null`;

***

**Property.setAttribute(attribute, value)**

Set property attribute to broker

- attribute: `String`. One of - `value`. Required;
- value: `String`. Value to set. Required;

Throws exception if attribute invalid. Error example:
```
{
    code   : 'NOT_SETTABLE',
    fields : {
        state : 'NOT_SETTABLE'
    },
    message : 'Property state not settable'
}
```

***

**Property.publishAttribute(attribute, value)**

Publish property attribute to broker

- attribute: `String`. Required;
- value: `String`. Value to publish. Required;

***

**Property.publishError(error)**

Publish error to broker

- error: `Object`. Error object. Default - `{ code: 'ERROR', message: 'Something went wrong' }`;

***

**Property.onAttributePublish(cb, type)**

Subscribe to publish event. Subscribing on property attribute value change.

- cb: `function(data)`. Callback to handle attribute publish event.
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](../Device/README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.
- type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;

***

**Property.onAttributeSet(cb, type)**

Handle property attribute set

- cb: `function(data)`. Callback to handle attribute set event
    - data:
        - field: `String`. Field to set;
        - value: `String`. New field value;
        - type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](../Device/README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.
- type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;

***

**Property.serialize()**

Get serialized property data

Returns: `Object`. Example -
```
{
    {
        'id'       : 'property-id',
        'unit'     : '°C',
        'dataType' : 'float',
        'retained' : 'true',
        'settable' : 'false',
        'name'     : 'Current temperature',
        'value'    : '26'
    }
}
```

***

**Property.getId()**

Get property ID

Returns: `String`

***

**Property.getName()**

Get property name

Returns: `String`

***

**Property.getState()**

Get property state

Returns: `String`

***

**Property.getValue()**

Get property value

Returns: `String`

***

**Property.getSettable()**

Get property settable value

Returns: `String`

***

**Property.getRetained()**

Get property retained value

Returns: `String`

***

**Property.getDataType()**

Get property data type

Returns: `String`

***

**Property.getUnit()**

Get property unit value

Returns: `String`

***

**Property.getFormat()**

Get property format value

Returns: `String`

***

**Property.getDeviceId()**

Get property device ID

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

**Property.getNodeId()**

Get property node ID

Returns: `String`

Throws exception if parent node doesn't exist. Error example:
```
{
    code   : 'NOT_FOUND',
    fields : {
        node : 'NOT_FOUND'
    }
}
```

***

**Property.getDevice()**

Get parent device instance.

Returns: [Device](../Device/README.md) instance

***

**Property.getNode()**

Get parent node instance.

Returns: [Node](../Node/README.md) instance

***

**Property.onErrorPublish(cb, type)**

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
        - type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.
- type: `String`. One of - `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;

***

**Property.publishError(error)**

Publish error to broker

- error: `Object`. Error object with error code and message to publish
    - code: `String`. Error code. Default: `ERROR`;
    - message: `String`. Error message. Default: `Something went wrong`;

***

**Property.getDeviceId()**

Get parent device id.

Returns `String`

***

**Property.getNodeId()**

Get parent node id.

Returns `String`

***

**Property.setValue(value)**

Set property value

- value: `String`

***

**Property.setDevice(device)**

Set parent device

- device: `Object` [Device](../Device/README.md)

***

**Property.setNode(node)**

Set parent node

- node: `Object` [Node](../Node/README.md)