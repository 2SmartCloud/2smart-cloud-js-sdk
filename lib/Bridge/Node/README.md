# NodeBridge

### `NodeBridge(config, { debug } = {})`
* `config` : could be instance of [HomieNode](../../Node/README.md)
    * `id` : `String`. Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`).
    * `state` : `String`. Default: `'init'`. One of: `init, ready, disconnected, sleeping, lost, alert`.
    * `name`  : `String`. Default: `'Node Bridge(${id})'`.
    * `type` : `String`. Default: `''`.
    * `options` : `Array`. Array of [PropertyBridge](../Property/README.md) instances.
    * `telemetry` : `Array`. Array of [PropertyBridge](../Property/README.md) instances.
    * `sensors` : `Array`. Array of [PropertyBridge](../Property/README.md) instances.
* `{ debug }`
    * `debug` : `null` or custom debug instance
    ```
        info('eventName', args) {}
        warning('eventName', args) {}
        error('eventName', args) {}
    ```

#### `addOption(option)`
*Add option to node.*
* `option` : instance of [Property](../Property/README.md)

#### `removeOption(id)`
*Remove option by id.*
* `id` : option ID

#### `addTelemetry(telemetry)`
*Add telemetry to node.*
* `telemetry` : instance of [Property](../Property/README.md)

#### `removeTelemetry(id)`
*Remove telemetry by id.*
* `id` : telemetry ID

#### `addSensor(sensor)`
*Add sensor to node.*
* `sensor` : instance of [Property](../Property/README.md)

##### `removeSensor(id)`
*Remove sensor by id.*
* `id` : sensor ID
