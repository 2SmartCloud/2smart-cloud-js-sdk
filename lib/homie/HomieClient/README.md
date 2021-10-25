# HomieClient [DEPRECATED]

## API

- HomieClient(options)
- HomieClient.initWorld()
- HomieClient.acceptDevice(id)
- HomieClient.onNewDeviceAdded(cb)
- HomieClient.onNewNodeAdded(cb)
- HomieClient.onNewSensorAdded(cb)
- HomieClient.onNewDeviceTelemetryAdded(cb)
- HomieClient.onNewDeviceOptionAdded(cb)
- HomieClient.onNewNodeTelemetryAdded(cb)
- HomieClient.onNewNodeOptionAdded(cb)
- HomieClient.getDeviceById(id)
- HomieClient.getDevices()
- HomieClient.onThresholdPublish(cb)
- HomieClient.getThresholds()

***

**HomieClient(options)**

Create HomieClient instance

- options:
    - homie: Homie instance

***

**HomieClient.initWorld()**

Homie initialization: retrieve all topics from broker, translate topics to objects, create device instances

***

**HomieClient.acceptDevice(id)**

Asynchronous method to accept device in system. Returns: Promise for an object with `deviceId` or `error` properties;

***

**HomieClient.onNewDeviceAdded(cb)**

Handle new device event

- cb: `function({ deviceId })` Callback function to handle new device event

***

**HomieClient.onNewNodeAdded(cb)**

Handle new node event

- cb: `function({ deviceId, nodeId })` Callback function to handle new node event

***

**HomieClient.onNewSensorAdded(cb)**

Handle new sensor event

- cb: `function({ deviceId, nodeId, sensorId })` Callback function to handle new sensor event

***

**HomieClient.onNewDeviceTelemetryAdded(cb)**

Handle new device telemetry event

- cb: `function({ deviceId, telemetryId })` Callback function to handle new device telemetry event

***

**HomieClient.onNewDeviceOptionAdded(cb)**

Handle new device option event

- cb: `function({ deviceId, optionId })` Callback function to handle new device option event

***

**HomieClient.onNewNodeTelemetryAdded(cb)**

Handle new node telemetry event

- cb: `function({ deviceId, nodeId, telemetryId })` Callback function to handle new node telemetry event

***

**HomieClient.onNewNodeOptionAdded(cb)**

Handle new node option event

- cb: `function({ deviceId, nodeId, optionId })` Callback function to handle new node option event

***

**HomieClient.getDeviceById(id)**

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

**HomieClient.getDevices()**

Get object of device instances

Returns: `Object` of [device instances](../../Device/README.md). Example:
```
{
    "device-id": new Device(),
    ...
}
```

**HomieClient.getScenarios()**
Get object of scenarios

Returns: `Object`
{
    "scenario-id": {
        state: Boolean
        thresholds: [Threshold]
    }
}

***

**HomieClient.getScenariosState()**
Get objet of scenarios state

Returns: `Object`

{
    "scenario-id": Boolean
}
***

**HomieClient.getScenarioById(scenarioId)**
Get scenario

Returns: `Object`
{
        state: Boolean
        thresholds: [Threshold]
}
***

**HomieClient.onThresholdPublish(cb)**

Handle threshold publish event

- cb: `function(data)` Callback function to handle error
    - data:
        - threshold: `String`. Threshold topic;
        - value: `String`. Published value;

***

**HomieClient.getThresholds()**

Get thresholds. Returns `Object`.

***

**Homie.getDevicesByTypes(types)**

Returns object with firmware names as keys and arrays of devices which have current
firmware name as values. Returns `Object`.

- types: An array of firmware names `String[]`
