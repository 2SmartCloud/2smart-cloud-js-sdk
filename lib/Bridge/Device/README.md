# DeviceBridge
Extends [BaseNodeAndDeviceEntity](../Entity/README.md)

### DeviceBridge(config, { debug } = {})
* `config` : could be instance of [HomieDevice](../../Device/README.md)
    * `id` : `String`. Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`).
    * `state` : `String`. Default: `'init'`. One of: `init, ready, disconnected, sleeping, lost, alert`.
    * `name`  : `String`. Default: `'Device Bridge(${id})'`.
    * `implementation` : Default: `'Bridge'`.
    * `mac` : `String`. Default: `'-'`.
    * `firmwareVersion` : `String`. Default: `'-'`.
    * `firmwareName` : `String`. Default: `'-'`.
    * `localIp` : `String`. Default: `'-'`.
    * `options` : `Array`. Array of [PropertyBridge](../Property/README.md) instances.
    * `telemetry` : `Array`. Array of [PropertyBridge](../Property/README.md) instances.
    * `nodes` : `Array`. Array of [NodeBridge](../Node/README.md) instances.
* `{ debug }`
    * `debug` : `null` or custom debug instance
    ```
        info('eventName', args) {}
        warning('eventName', args) {}
        error('eventName', args) {}
    ```

#### `addOption(option)`
*Add option to device.*
* `option` : instance of [Property](../Property/README.md)

#### `removeOption(id)`
*Remove option by id.*
* `id` : option ID

#### `addTelemetry(telemetry)`
*Add telemetry to device.*
* `telemetry` : instance of [Property](../Property/README.md)

#### `removeTelemetry(id)`
*Remove telemetry by id.*
* `id` : telemetry ID

#### `addNode(node)`
*Add node to device.*
* `node` : instance of [Node](../Node/README.md)

##### `removeNode(id)`
*Remove node by id.*
* `id` : node ID
