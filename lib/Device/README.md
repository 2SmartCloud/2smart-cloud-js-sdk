# Device

## API

**Device(options)**

Create empty Device instance

- options:
    - id: `String` Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`). Device id;

***

**Device.updateAttribute(attributes)**

Update device attributes

- attributes: `Object`
    - name: `String`. Device name;
    - firmwareName: `String`. Name of the firmware running on the device. Allowed characters are the same as the device ID;
    - firmwareVersion: `String`. Version of the firmware running on the device;
    - localIp: `String` device local IP;
    - mac: `String` device MAC address;
    - implementation: `String` an identifier for the Homie implementation;
    - state: `String`. There are 6 different states: init, ready, disconnected, sleeping, lost, alert;

***

**Device.validateMyStructure()**

Validate device attributes. Makes device `valid` if structure is correct. Throws exception if structure is invalid and making device `invalid`.
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

**Device.onAttach(homie)**

Inject device instance with homie environment

- homie: [homie](../homie/README.md) instance. Required;

***

**Device.onDetach()**

Remove homie instance and unsubscribe from events.

***

**Device.setSettingAttribute(attribute, value)**

Set device setting attribute to broker. Returns - `Promise`.

- attribute: `String`. One of - `name`. Required;
- value: `String`. Value to set. Required;

`Promise` will be resolved if `set` was successfull and rejected in case of error or timeout (20s)

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

**Device.publishAttribute(attribute, value)**

Publish device attribute to broker

- attribute: `String`. One of - `name`. Required;
- value: `String`. Value to publish. Required;

***

**Device.publishSetting(attribute, value)**

Publish device setting attribute to broker

- attribute: `String`. One of - `title`. Required;
- value: `String`. Value to publish. Required;

***

**Device.onAttributePublish(cb)**

Subscribe to publish events. Subscribes automatically to all child elements(nodes, telemetry, options, sensors).

- cb: `function(data)`. Callback to handle attribute publish event
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. One of - `DEVICE`, `NODE`, `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Device.onAttributeSet(cb)**

Subscribe to set events. Subscribes automatically to all child elements(nodes, telemetry, options, sensors).

- cb: `function(data)`. Callback to handle attribute set event
    - data:
        - field: `String`. Field to set;
        - value: `String`. New field value;
        - type: `String`. One of - `DEVICE`, `NODE`, `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Device.onErrorPublish(cb)**

Subscribe to error events. Subscribes automatically to all child elements(nodes, telemetry, options, sensors).

- cb: `function(data)`. Callback to handle error event
    - data:
        - value: `Object`. Error object:
            - code: `String`. Error code;
            - message: `String`. Error message;
        Default:
        ```
        {
            code    : "ERROR",
            message : "Something went wrong"
        }
        ```
        - type: `String`. One of - `DEVICE`, `NODE`, `SENSOR`, `DEVICE_TELEMETRY`, `DEVICE_OPTION`, `NODE_TELEMETRY`, `NODE_OPTION`;
        - device: [Device](README.md) instance. Default: `null`.
        - node: [Node](../Node/README.md) instance. Default: `null`.
        - property: [Property](../Property/README.md) instance. Default: `null`.

***

**Device.onHeartbeat(cb)**

Subscribe to heartbeat events

***

**Device.respondToHeartbeat({ value })**

Send heartbeat message.

***

**Device.deleteRequest()**

Send a request to delete device from system.

***

**Device.getTopic()**

Get device topic.

Returns: `String`.

***

**Device.getRootTopic()**

Get root topic.

Returns: `String`.

***

**Device.getMapByGroupId()**

Get cached map by group id.

***

**Device.deleteMapByGroupId()**

Delete cached map by group id.

***

**Device.serialize()**

Get serialized device data.

Returns: `Object`. Example -
```
{
    'id'                : 'device-id',
    'name'              : 'Weather',
    'state'             : 'init',
    'implementation'    : 'dafs',
    'mac'               : 'ab:cd:ef:gh:ij',
    'localIp'           : '127.0.0.1',
    'firmwareName'      : 'test device',
    'firmwareVersion'   : '1.2-rc',
    'rootTopic'         : 'sweet-home/device-id',
    'telemetry'         : [],
    'options'           : [],
    'nodes'             : [
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
    ]
}
```
***

**Device.addNode(node)**

Add node instance to device

- node: [Node](../Node/README.md) instance. Required;

Throws exeption if node is invalid or node already exists

***

**Device.addTelemetry(telemetry)**

Add telemetry instance to device

- telemetry: [Telemetry](../Property/README.md) instance. Required;

Throws exeption if telemetry is invalid or already exists

***

**Device.addOption(option)**

Add option instance to device

- option: [Option](../Property/README.md) instance. Required;

Throws exeption if option is invalid or already exists

***

**Device.getId()**

Get device id

Returns: `String`

***

**Device.getName()**

Get device name

Returns: `String`

***

**Device.getNodes()**

Get list of device nodes

Returns: `Array`

***

**Device.getOptions()**

Get list of device options

Returns: `Array`

***

**Device.getTelemetry()**

Get list of device telemetry

Returns: `Array`

***

**Device.getFirmware()**

Get device firmware

Returns: `String`

***

**Device.getLocalIp()**

Get device local IP

Returns: `String`

***

**Device.getMac()**

Get device mac address

Returns: `String`

***

**Device.getImplementation()**

Get device implementation

Returns: `String`

***

**Device.getState()**

Get device state

Returns: `String`

***

**Device.getNodeById(id)**

Get device node by id

- id: `String`. Node id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { node: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Device.getOptionById(id)**

Get device option by id

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

**Device.getTelemetryById(id)**

Get device telemetry by id

- id: `String`. Telemetry id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { telemetry: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Device.getTitle()**

Get device title

Returns: `String`

***

**Device.isEmpty()**

Check if device doesn't contain any valid instance of Node or Property

Returns: `Boolean`

***

**Device.deleteHandlers()**

Unsubscribe from homie events.

***

**Device.delete()**

Unsubscribe from homie events and clear all attributes from instance.

***

**Device.getTopics(all = false)**

Get an object of all topics and values from attributes.
`all = true` will return also a `setting topics`.

Returns: `Object`
