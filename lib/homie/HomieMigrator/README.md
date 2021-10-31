# HomieMigrator

## API

- HomieMigrator(options)
- HomieMigrator.initWorld(id)
- HomieMigrator.attachDevice(device)
- HomieMigrator.attachNodes(device, nodes = [])
- HomieMigrator.attachProperties(instance, properties = [], type = '')
- HomieMigrator.deleteDevice(device)
- HomieMigrator.deleteNode(node, withAllTopics = true)
- HomieMigrator.deleteScenario(node, withAllTopics = true)
- HomieMigrator.deleteEntity(entity)
- HomieMigrator.deleteThresholds(thresholds)
- HomieMigrator.attachThresholds(scenario, thresholds = [])
- HomieMigrator.publishScenario(scenario)
- HomieMigrator.publishDevice(device)
- HomieMigrator.attachEntity(entityType, entityObj)
- HomieMigrator.initializeEntityClass(type)
- HomieMigrator.destroyEntityClass(type)
***

**HomieMigrator(options)**

Create HomieMigrator instance

- options:
    - homie: [Homie](../Homie/README.md) instance

***

**HomieMigrator.initWorld(id)**

- id: Device ID to process broker messages.

Homie initialization: retrieve all topics from broker, translate topics to objects, create device instances

***

**HomieMigrator.attachDevice(device)**

Attach new device into Homie

- device: `Object`
    - id: `String` Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`). Device id;
    - name: `String`. Device name;
    - firmwareName: `String`. Name of the firmware running on the device. Allowed characters are the same as the device ID;
    - firmwareVersion: `String`. Version of the firmware running on the device;
    - localIp: `String` device local IP;
    - mac: `String` device mac address;
    - implementation: `String` an identifier for the Homie implementation;
    - state: `String`. Default - `init`. There are 6 different states: init, ready, disconnected, sleeping, lost, alert;

***

**HomieMigrator.attachNodes(device, nodes = [])**

Attach new node into device

- device: `Object` [Device](../../Device/README.md) object
- nodes: `Array` Array of node objects

Throws exception if device not an instance of [Device](../../Device/README.md). Error example:
```
{
    code   : 'WRONG_TYPE',
    fields : {
        device : 'WRONG_TYPE'
    },
    message : 'Device required!'
}
```

***

**HomieMigrator.attachProperties(instance, properties = [], type = '')**

Attach new instance into device/node

- instance: `Object`. One of: [Device](../../Device/README.md), [Node](../../Node/README.md)
- properties: `Array` Array of property objects(telemetry/option/sensor)
- type: `String`. One of: SENSOR, DEVICE_OPTION, NODE_OPTION, DEVICE_TELEMETRY, NODE_TELEMETRY

Throws exception if instance not a [Device](../../Device/README.md) or [Node](../../Node/README.md). Error example:
```
{
    code   : 'WRONG_TYPE',
    fields : {
        instance : 'WRONG_TYPE'
    },
    message : 'Device or Node required!'
}
```

***

**HomieMigrator.deleteDevice(device)**

Completely delete device from the system(from broker and memory)

- device: a [Device](../../Device/README.md) instance to delete

***

**HomieMigrator.deleteNode(node, withAllTopics = true)**

Completely delete node from the system(from broker and memory)

- node: a [Node](../../Node/README.md) instance to delete
- withAllTopics: flag specified whether to delete all topics related with node or not(e.g. device-settings/) `Boolean`. Default: `true`

***

**HomieMigrator.deleteScenario(scenario, withAllTopics = true)**

Completely delete scenario from the system(from broker and memory)

- scenario: a [Scenario](../../Scenario/README.md) instance to delete
- withAllTopics: flag specified whether to delete all topics related with scenario or not(e.g. device-settings/) `Boolean`. Default: `true`

***

**HomieMigrator.deleteEntity(entity)**

Completely delete entity from the system(from broker and memory)

- entity: a [Entity](../../EntitiesStore/README.md) instance to delete

Returns: `Promise<undefined>`

***

**HomieMigrator.deleteThresholds(thresholds)**

Completely delete thresholds from the system(from broker and memory)

- thresholds: an array of [Threshold](../../Threshold/README.md) instances to delete

***

**HomieMigrator.attachThresholds(scenario, thresholds)**

Attaches thresholds to scenario

Throws exception if instance not a [Scenario](../../Scenario/README.md)
```
{
    code   : 'WRONG_TYPE',
    fields : {
        instance : 'WRONG_TYPE'
    },
    message : 'Scenario required!'
}
```

- scenario: a [Scenario](../../Scenario/README.md) instance
- thresholds: an array of [Threshold](../../Threshold/README.md) instances to attach

*** 

**HomieMigrator.publishScenario(scenario)**

Publishes scenario topics to broker

- scenario: a [Scenario](../../Scenario/README.md) instance

***

**HomieMigrator.publishDevice(device)**

Publishes device topics to broker

- device: a [Device](../../Device/README.md) instance

***

**HomieMigrator.attachEntity(entityType, entityObj)**

Attach new [Entity](../../EntitiesStore/README.md) instance to Homie

- entityType: an entity type `String`
- entityObj: an object with required entity properties `Object`

Returns: [Entity](../../EntitiesStore/README.md) instance

***

**HomieMigrator.initializeEntityClass(type)**

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