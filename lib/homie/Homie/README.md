# Homie

## API

- Homie(options)
- Homie.init(deviceId = null, topicsToSubscribe = ['#'], options = {})
- Homie.attach(device)
- Homie.attachThreshold(threshold)
- Homie.attachScenario(scenario)
- static Homie.getRootTopicFrom(userEmail, algorithm = 'sha256')
- Homie.publishToBroker(topic, value, options = {}, cb = null)
- Homie.getRootTopic()
- Homie.getDevices()
- Homie.getScenarios()
- Homie.getScenariosState()
- Homie.getDiscovery()
- Homie.getEntities(type)
- Homie.getEntityById(type, id)
- Homie.getDeviceById(id)
- Homie.getScenarioById(id)
- Homie.getThresholdById(scenarioId, id = 'setpoint')
- Homie.end()
- Homie.getThresholds()
- Homie.getAllThresholds()
- Homie.scenarioFindOneOrCreate(scenarioId)
- Homie.getEntityRootTopicByType(type)
- Homie.initializeEntityClass(type)
- Homie.destroyEntityClass(type)
- Homie.createPromisedEvent(success, error, successCb = () => false, errorCb = () => false, errorTimeout = 20000)
- Homie.request(type, method, payload = {})
- Homie.response(type, method, data)
- Homie.getInstanceByTopic(topic)
- Homie.getDevicesByTypes(types)
- Homie.appendRootTopicIfExists(topic)
- Homie.subscribe(topic, cb)
- Homie.unsubscribe(topic, cb)
***

**Homie(options)**

Create Homie instance

- options:
    - transport: Transport instance. One of [Broker](../../Broker)
    - debug: Enables debug mode `Boolean`. Default: `false`
    - rootTopic: Top level(root) topic for all topics `String`. Default: `''`
    - syncMaxDelay: Max time to sync state from broker, in milliseconds `Number`. Default: `10000`
    - syncResetTimeout: Time after incoming message to consider that state was fully synced and reset syncing process, in milliseconds `Number`. Default: `1000`

***

**Homie.init(deviceId, topicsToSubscribe, options)**

Connect to transport, subscribe to root topic, add message event handler.
Create device instances from broker state. If `deviceId` specified, only this device will be processed.

- deviceId: Device ID to process broker messages `String`. Default: `null`
- topicsToSubscribe: List of topics to subscribe `Array<String>`. Default: `['#']`
- options:
    - setWill: Whether to set "will" message about changing device state to "lost" when the transport disconnect badly `Boolean`. Default: `true`
    - subscribeToBridgeTopics: Whether to subscribe to device bridge topics, only works when `deviceId` is specified `Boolean`. Default: `false`

Returns: `Promise<undefined>`

***

**Homie.attach(device)**

Inject homie to device instance

- device: Device instance `Device`. [Device](../../Device/README.md)

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

**Homie.attachThreshold(threshold)**

Inject homie to threshold instance

- threshold: Threshold instance `Threshold`. [Threshold](../../Threshold/README.md)

Throws exception if not a threshold instance. Error example:
```
{
    code   : 'WRONG_FORMAT',
    fields : {
        device : 'WRONG_FORMAT'
    },
    message : 'Instance of Threshold is required'
}
```

***

**Homie.attachScenario(scenario)**

Inject homie to scenario instance

- scenario: Scenario instance `Scenario`. [Scenario](../../Scenario/README.md)

Throws exception if not a scenario instance. Error example:
```
{
    code   : 'WRONG_FORMAT',
    fields : {
        device : 'WRONG_FORMAT'
    },
    message : 'Instance of Scenario is required'
}
```

***

**static Homie.getRootTopicFrom(userEmail, algorithm = 'sha256')**

Returns root topic for the provided user email. This root topic can be used in 2Smart Cloud

- userEmail: a user email `String`
- algorithm: an algorithm to use for root topic generating `String`. Default: `'sha256'`

Returns `String` root topic

***

**Homie.publishToBroker(topic, value, options = {}, cb = null)**

Publish message to broker

- topic: The topic to publish `String`
- value: The message to publish `String`
- options: The options to publish with `Object`:
    - retain: retain flag `Boolean`. Default: `false`
- cb: `function(err)`, fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting

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

**Homie.getScenarios()**

Get object with valid scenarios

Returns: `Object` of [scenario instances](../../Scenario/README.md). Example:
```
{
    "scenario-id": new Scenario(),
    ...
}
```

***

**Homie.getScenariosState()**

Get object with scenarios states, where keys are scenarios ids and value are its states

Returns: `Object`. Example:
```
{
    "scenario-id-1": "true",
    "scenario-id-2": "false"
    ...
}
```

***

**Homie.getDiscovery()**

Return object with discovery objects

Returns: `Object`

***

**Homie.getEntities(type)**

Get all valid entities of provided type

- type: type of entities `String`

Returns: `Array` of [entities](../../EntitiesStore/README.md)

***

**Homie.getEntityById(type, id)**

Returns [Entity](../../EntitiesStore/README.md) instance by provided type and id

- type: type of entity `String`
- id: id of entity `String`

Returns: [Entity](../../EntitiesStore/README.md) instance

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

**Homie.getScenarioById(id)**

Get scenario instance by id

- id: scenario id `String`

Returns: [Scenario](../../Scenario/README.md) instance

***

**Homie.getThresholdById(scenarioId, id = 'setpoint')**

Get threshold instance by scenario id and threshold id

- scenarioId: a scenario id to which threshold is related `String`
- id: a threshold id `String`

Returns: [Threshold](../../Threshold/README.md) instance

***

**Homie.end()**

Close transport connection

***

**Homie.getThresholds()**

Get valid thresholds

Returns: `Object` of [threshold instances](../../Threshold/README.md). Example:
```
{
    "scenario-id": [ new Threshold(), new Threshold(), ... ],
    ...
}
```

***

**Homie.getAllThresholds()**

Get all thresholds, both valid and invalid

Returns: `Object` of [threshold instances](../../Threshold/README.md). Example:
```
{
    "scenario-id": [ new Threshold(), new Threshold(), ... ],
    ...
}
```

***

**Homie.getDevicesByTypes(types)**

Returns object with firmware names as keys and arrays of devices which have current
firmware name as values. Returns `Object`.

- types: An array of firmware names `String[]`

***

**Homie.scenarioFindOneOrCreate(scenarioId)**

Returns existing scenario instance by id or creates new one

- scenarioId: id of scenario

Returns: [Scenario](../../Scenario/README.md)

***

**Homie.getEntityRootTopicByType(type)**

Returns root topic for the provided entity type

Example:  
`homie.getEntityRootTopicByType('BRIDGE'); // -> 'bridges'`

- type: an entity type `String`

Returns: a root topic for the provided entity type `String`

***

**Homie.initializeEntityClass(type)**

Create and initialize entity class for the provided entity type

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

**Homie.destroyEntityClass(type)**

Delete all entity instances with provided type and its class

- type: an entity type `String`

***

**Homie.createPromisedEvent(success, error, successCb = () => false, errorCb = () => false, errorTimeout = 20000)**

Creates two events with provided names: "success" for the successfull callback to be emitted and "error"
for the error callback to be emitted and waits for completion of one of them.

- success: event name for the successfull callback `String`
- error: event name for the error callback `String`
- successCb: `function(data)` a callback for the successfull event
- errorCb: `function(data)` a callback for the error event
- errorTimeout: timeout for events, in milliseconds `Number`. Default: `20000`

Returns: `Promise<data>|Promise<X>` :
- data: data with which success was emitted `any`
- X: an exception object, example: ```new X({ code: 'VALIDATION', ...data[field] })```

***

**Homie.request(type, method, payload = {})**

Publishes payload to the request topic and waits for emitting response event

- type: an entity type `String`
- method: an entity method `String`
- payload: a payload to publish `Object`. Default `{}`

Returns: `Promise <response.data>|Promise<new X(response.error)>`

***

**Homie.response(type, method, data)**

Publish data to the response topic

- type: an entity type `String`
- method: an entity method `String`
- data: a payload to publish `Object`

***

**Homie.getInstanceByTopic(topic)**

2SmartCloud API  
Returns homie entity instance by provided topic

- topic: an entity topic `String`

Returns: `Device|Node|Property|Scenario|Threshold|Entity`

***

**Homie.getDevicesByTypes(types)**

2SmartCloud API  
Returns object with firmware names as keys and arrays of devices which have current firmware name as values

- types: an array of firmware names `Array<String>`

***

**Homie.appendRootTopicIfExists(topic)**

Appends root topic for the provided topic or array of topics if it is present in current homie instance

- topic: a topic or array of topics `String|Array<String>`

Returns: `String|Array<String>`

***

**Homie.subscribe(topic, cb)**

Subscribe to the provided topic or array of topics

- topic: a topic to subscribe to `String|Array<String>`
- cb: `function(err, granted)` a callback fired on suback, see https://github.com/mqttjs/MQTT.js#subscribe

***

**Homie.unsubscribe(topic, cb)**

Unsubscribe from a topic or topics

- topic: a topic to unsubscribe from `String|Array<String>`
- cb: `function(err)` a callback fired on unsuback, see https://github.com/mqttjs/MQTT.js#unsubscribe
