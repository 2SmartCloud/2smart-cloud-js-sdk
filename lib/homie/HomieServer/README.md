# HomieServer

## API

- HomieServer(options)
- HomieServer.initWorld()
- HomieServer.getDeviceById(id)
- HomieServer.getDevices()
- HomieServer.getThresholds()
- HomieServer.onDeleteRequest(cb)
- HomieServer.onNewThreshold(cb)
- HomieServer.getThresholdById(scenarioId, id)
- HomieServer.getScenarios()
- HomieServer.getScenariosState()
- HomieServer.getEntities(type)
- HomieServer.getEntityById(type, id)
- HomieServer.onNewDeviceAdded(cb)
- HomieServer.onDelete(cb)

***

**HomieServer(options)**

Create HomieServer instance

- options:
    - homie: Homie instance

***

**HomieServer.initWorld()**

Homie initialization: retrieve all topics from broker, translate topics to objects, create device instances

***

**HomieServer.getDeviceById(id)**

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

**HomieServer.getDevices()**

Get object of device instances

Returns: `Object` of [device instances](../../Device/README.md). Example:
```
{
    "device-id": new Device(),
    ...
}
```

***

**HomieServer.getThresholds()**

Get thresholds. Returns `Object`.

***

**HomieServer.onDeleteRequest(cb)**

Subscribe provided callback on delete request event

***

**HomieServer.onNewThreshold(cb)**

Subscribe provided callback on new threshold event

***

**HomieServer.getThresholdById(scenarioId, id)**

Get threshold instance by scenario id and threshold id and attach it to Homie

- scenarioId: a scenario id to which threshold is related `String`
- id: a threshold id `String`

Returns: [Threshold](../../Threshold/README.md) instance

***

**HomieServer.getScenarios()**

Get object with valid scenarios

Returns: `Object` of [scenario instances](../../Scenario/README.md). Example:
```
{
    "scenario-id": new Scenario(),
    ...
}
```

***

**HomieServer.getScenariosState()**

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

**HomieServer.getEntities(type)**

Get all valid entities of provided type

- type: type of entities `String`

Returns: `Array` of [entities](../../EntitiesStore/README.md)

***

**HomieServer.getEntityById(type, id)**

Returns [Entity](../../EntitiesStore/README.md) instance by provided type and id

- type: type of entity `String`
- id: id of entity `String`

Returns: [Entity](../../EntitiesStore/README.md) instance

***

**HomieServer.onNewDeviceAdded(cb)**

Handle new device event

- cb: `function({ deviceId })` Callback function to handle new device event

***

**HomieServer.onDelete(cb)**

Handle delete event

- cb: `function({ type, deviceId, nodeId, scenarioId, thresholdId, entityId })` Callback function to handle delete event