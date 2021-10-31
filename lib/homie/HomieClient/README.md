# HomieClient

## API

- HomieClient(options)
- HomieClient.initWorld(deviceId, topicsToSubscribe, options)
- HomieClient.onNewDeviceAdded(cb)
- HomieClient.onNewNodeAdded(cb)
- HomieClient.onNewSensorAdded(cb)
- HomieClient.onNewThreshold(cb)
- HomieClient.onNewScenario(cb)
- HomieClient.onNewEntityAdded(cb)
- HomieClient.onDelete(cb)
- HomieClient.onNewDeviceTelemetryAdded(cb)
- HomieClient.onNewDeviceOptionAdded(cb)
- HomieClient.onNewNodeTelemetryAdded(cb)
- HomieClient.onNewNodeOptionAdded(cb)
- HomieClient.getDeviceById(id)
- HomieClient.getDevices()
- HomieClient.getThresholds()
- HomieClient.getThresholdById(scenarioId, id)
- HomieClient.getScenarios()
- HomieClient.getScenariosState()
- HomieClient.getScenarioById()
- HomieClient.getDevicesByTypes(types)
- HomieClient.createEntityRequest(type, data, customId, isCreatePromise = true)
- HomieClient.getEntities(type)
- HomieClient.getEntityById(type, id)
- HomieClient.initializeEntityClass(type)
- HomieClient.destroyEntityClass(type)
- HomieClient.getInstanceByTopic(topic)
- HomieClient.subscribe(topic, cb)
- HomieClient.unsubscribe(topic, cb)

***

**HomieClient(options)**

Create HomieClient instance

- options:
    - homie: Homie instance

***

**HomieClient.initWorld(deviceId, topicsToSubscribe, options)**

Homie initialization: retrieve all topics from broker, translate topics to objects, create device instances

- deviceId: Device ID to process broker messages `String`. Default: `null`
- topicsToSubscribe: List of topics to subscribe `Array<String>`. Default: `['#']`
- options:
    - setWill: Whether to set "will" message about changing device state to "lost" when the transport disconnect badly `Boolean`. Default: `true`
    - subscribeToBridgeTopics: Whether to subscribe to device bridge topics, only works when `deviceId` is specified `Boolean`. Default: `false`

Returns: `Promise<undefined>`

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

**HomieClient.onNewThreshold(cb)**

Handle new threshold event

- cb: `function({ thresholdId, scenarioId })` Callback function to handle new threshold event

***

**HomieClient.onNewScenario(cb)**

Handle new scenario event

- cb: `function({ scenarioId })` Callback function to handle new scenario event

***

**HomieClient.onNewEntityAdded(cb)**

Handle new entity event

- cb: `function({ entityId, type })` Callback function to handle new entity event

***

**HomieClient.onDelete(cb)**

Handle delete event

- cb: `function({ type, deviceId, nodeId, scenarioId, thresholdId, entityId })` Callback function to handle delete event

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

**HomieClient.getThresholds()**

Get thresholds. Returns `Object`.

***

**HomieClient.getThresholdById(scenarioId, id)**

Get threshold instance by scenario id and threshold id and attach it to homie

- scenarioId: a scenario id to which threshold is related `String`
- id: a threshold id `String`

Returns: [Threshold](../../Threshold/README.md) instance

***

**HomieClient.getDevicesByTypes(types)**

Returns object with firmware names as keys and arrays of devices which have current
firmware name as values. Returns `Object`.

- types: An array of firmware names `String[]`

***

**HomieClient.createEntityRequest(type, data, customId, isCreatePromise = true)**

Publishes data to specific topic in broker to create entity and wait for its creation if "isCreatePromise" is true

- type: an entity type `String`
- data: a data to publish `any`
- customId: optional, a custom id for the entity, `String`
- isCreatePromise: where to return a promise and wait for event completion

Returns: `Promise <response.data>|Promise<new X(response.error)>`

***

**HomieClient.getEntities(type)**

Get all valid entities of provided type

- type: type of entities `String`

Returns: `Array` of [entities](../../EntitiesStore/README.md)

***

**HomieClient.getEntityById(type, id)**

Returns [Entity](../../EntitiesStore/README.md) instance by provided type and id

- type: type of entity `String`
- id: id of entity `String`

Returns: [Entity](../../EntitiesStore/README.md) instance

***

**HomieClient.initializeEntityClass(type)**

Create and initialize entity class for the provided entity type and makes a "republish" request if current entity type is retained

Throws exception if type not found. Error example:
```
{
    fields: { 'BRIDGE': 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: 'EntityClass for entity type - BRIDGE not found!'
}
```

- type: an entity type `String`

***

**HomieClient.destroyEntityClass(type)**

Delete all entity instances with provided type and its class

- type: an entity type `String`

***

**HomieClient.getInstanceByTopic(topic)**

2SmartCloud API  
Returns homie entity instance by provided topic

- topic: an entity topic `String`

Returns: `Device|Node|Property|Scenario|Threshold|Entity`

***

**HomieClient.subscribe(topic, cb)**

Subscribe to the provided topic or array of topics

- topic: a topic to subscribe to `String|Array<String>`
- cb: `function(err, granted)` a callback fired on suback, see https://github.com/mqttjs/MQTT.js#subscribe

***

**HomieClient.unsubscribe(topic, cb)**

Unsubscribe from a topic or topics

- topic: a topic to unsubscribe from `String|Array<String>`
- cb: `function(err)` a callback fired on unsuback, see https://github.com/mqttjs/MQTT.js#unsubscribe
