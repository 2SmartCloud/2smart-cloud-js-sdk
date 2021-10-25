# Homie [DEPRECATED]

## API

- Homie(options)
- Homie.init(deviceId = null)
- Homie.attach(device)
- Homie.onNewDeviceAdded(cb)
- Homie.onNewNodeAdded(cb)
- Homie.onNewSensorAdded(cb)
- Homie.onNewDeviceTelemetryAdded(cb)
- Homie.onNewDeviceOptionAdded(cb)
- Homie.onNewNodeTelemetryAdded(cb)
- Homie.onNewNodeOptionAdded(cb)
- Homie.publishToBroker(topic, value, options = {})
- Homie.onAttributePublish(topics, cb, options = {})
- Homie.onDeviceSettingPublish(topics, cb, options = {})
- Homie.onAttributeSet(topic, cb, options = {})
- Homie.onDeviceSettingSet(topic, cb, options = {})
- Homie.onErrorPublish(topics, cb, options = {})
- Homie.onDeviceSettingError(topics, cb, options = {})
- Homie.getRootTopic()
- Homie.getDevices()
- Homie.getDeviceById(id)
- Homie.end()
- Homie.onThresholdPublish(cb)
- Homie.getThresholds()

***

**Homie(options)**

Create Homie instance

- options:
    - transport: Transport instance. One of [Broker](../../Broker)

***

**Homie.init(deviceId)**

- deviceId: Device ID to process broker messages. Default: `null`.

Connect to transport, subscribe to root topic, add message event handler.
Create device instances from broker state. If `deviceId` specified, only this device will be processed.

Returns: Promise

***

**Homie.attach(device)**

Inject homie to device instace

- device: Device instance. [Device](../../Device/README.md)

Throws exception if not a device instance. Error example:
```
{
    code   : 'WRONG_FORMAT',
    fields : {
        device : 'WRONG_FORMAT'
    },
    message : 'Instance of Device is required'
}
```

***

**Homie.onNewDeviceAdded(cb)**

Handle new device event

- cb: `function({ deviceId })` Callback function to handle new device event

***

**Homie.onNewNodeAdded(cb)**

Handle new node event

- cb: `function({ deviceId, nodeId })` Callback function to handle new node event

***

**Homie.onNewSensorAdded(cb)**

Handle new sensor event

- cb: `function({ deviceId, nodeId, sensorId })` Callback function to handle new sensor event

***

**Homie.onNewDeviceTelemetryAdded(cb)**

Handle new device telemetry event

- cb: `function({ deviceId, telemetryId })` Callback function to handle new device telemetry event

***

**Homie.onNewDeviceOptionAdded(cb)**

Handle new device option event

- cb: `function({ deviceId, optionId })` Callback function to handle new device option event

***

**Homie.onNewNodeTelemetryAdded(cb)**

Handle new node telemetry event

- cb: `function({ deviceId, nodeId, telemetryId })` Callback function to handle new node telemetry event

***

**Homie.onNewNodeOptionAdded(cb)**

Handle new node option event

- cb: `function({ deviceId, nodeId, optionId })` Callback function to handle new node option event

***

**Homie.publishToBroker(topic, value, options = {})**

Publish message to broker

- topic: The topic to publish `String`
- value: The message to publish `String`
- options: The options to publish with `Object`:
    - retain: retain flag `Boolean`. Default: `false`

***

**Homie.onAttributePublish(topics, cb, options = {})**

Handle attribute publish event

- topics: List of topics `Array`
- cb: `function(data)` Callback function to handle published value
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
- options: Additional data to send via callback `Object`

***

**Homie.onDeviceSettingPublish(topics, cb, options = {})**

Handle setting attribute publish event

- topics: List of topics `Array`
- cb: `function(data)` Callback function to handle published value
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
- options: Additional data to send via callback `Object`

***

**Homie.onAttributeSet(topic, cb, options = {})**

Handle set attribute to broker event

- topic: The topic to listen `String`
- cb: `function(data)` Callback function to handle setted value
    - data:
        - field: `String`. Field to set;
        - value: `String`. New field value;
- options: Additional data to send via callback `Object`

***

**Homie.onDeviceSettingSet(topic, cb, options = {})**

Handle set setting attribute to broker event

- topic: The topic to listen `String`
- cb: `function(data)` Callback function to handle setted value
    - data:
        - field: `String`. Field to set;
        - value: `String`. New field value;
- options: Additional data to send via callback `Object`

***

**Homie.onErrorPublish(topic, cb, options = {})**

Handle attribute error event

- topic: The topic to listen `String`
- cb: `function(data)` Callback function to handle error
    - data:
        - field: `String`. Error field;
        - value: `Object`. Error object;
- options: Additional data to send via callback `Object`

***

**Homie.onDeviceSettingError(topic, cb, options = {})**

Handle setting attribute error event

- topic: The topic to listen `String`
- cb: `function(data)` Callback function to handle error
    - data:
        - field: `String`. Error field;
        - value: `Object`. Error object;
- options: Additional data to send via callback `Object`

***

**Homie.getRootTopic()**

Get root topic

Returns: `String` root topic

***

**Homie.getDevices()**

Get object of device instances

Returns: `Object` of [device instances](../../Device/README.md). Example:
```
{
    "device-id": new Device(),
    ...
}
```

***

**Homie.getDeviceById(id)**

Get device instance by id

- id: device id `String`

Returns: [Device](../../Device/README.md) instance

Throws exception if instance not found. Error example:
```
{
    fields: { device: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Homie.end()**

Close transport connection

***

**Homie.onThresholdPublish(cb)**

Handle threshold publish event

- cb: `function(data)` Callback function to handle error
    - data:
        - threshold: `String`. Threshold topic;
        - value: `String`. Published value;

***

**Homie.getThresholds()**

Get thresholds. Returns `Object`.

***

**Homie.getDevicesByTypes(types)**

Returns object with firmware names as keys and arrays of devices which have current
firmware name as values. Returns `Object`.

- types: An array of firmware names `String[]`
