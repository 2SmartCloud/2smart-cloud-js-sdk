# HomieMigrator [DEPRECATED]

## API

- HomieMigrator(options)
- HomieMigrator.initWorld(id)
- HomieMigrator.attachDevice(device)
- HomieMigrator.attachNodes(device, nodes = [])
- HomieMigrator.attachProperties(instance, properties = [], type = '')

***

**HomieMigrator(options)**

Create HomieMigrator instance

- options:
    - homie: Homie instance

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
