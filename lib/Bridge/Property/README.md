# PropertyBridge
Extends [EntityBridge](../Entity/README.md)

### `PropertyBridge(config, { type, transport, parser, debug })`
* `config` : could be instance of [HomieProperty](../../Property/README.md)
    * `id` : `String`. Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`).
    * `name`: `String` Required. Property name.
    * `value`: `String` property value.
    * `settable`: `Boolean`. Is property settable. Default: `false`.
    * `retained`: `Boolean`. Is property retained. Default: `true`.
    * `dataType`: `String`. One of: `integer`, `float`, `boolean`, `string`, `enum`, `color`. Default: `string`.
    * `unit`: `String`. A string containing the unit of this property.
    * `format`: `String`. Describes what are valid values for this property. Required for data types `enum` and `color`.
    Formats for data types:
        * `integer`, `float`: `from:to` (for example - `10:15`);
        * `enum`: `value,value,value` (for example - `ON,OFF,PAUSE`);
        * `color`: `rgb` or `hsv` (for example - `255,255,0` or `60,100,100`)
* `{ type, transport, parser, debug }`
    * `type` : `String`. One of `'sensor'|'option'|'telemetry'`.
    * `transport` : instance of [PropertyTransport](README.md)
    * `parser` : instance of [Parser](../Parser/README.md)
    * `debug` : `null` or custom debug instance
    ```
        info('eventName', args) {}
        warning('eventName', args) {}
        error('eventName', args) {}
    ```

# PropertyTransport
### `PropertyTransport(config)`
* `config` :
    * `id`: `String`. Property transport ID. Default: `null`.
    * `type`: `String`. Specify transport type. Default: `'base_transport'`.
    * `data`: Property value. Default: `null`.
    * `pollInterval`: `Integer`. Poll interval in ms. If `0` or `null` polling is disablled. Default: `null`.
    * `pollErrorTimeout`: `Integer`. Default: `pollInterval` value.
    * `debug` : `null` or custom debug instance
    ```
        info('eventName', args) {}
        warning('eventName', args) {}
        error('eventName', args) {}


#### `enablePolling()`
*Start value polling with interval.*

#### `disablePolling()`
*Stop value polling.*

#### `attachBridge(bridge)`
*Attach bridge instance.*
[Bridge instance](../README.md)

#### `detachBridge()`
*Detach bridge instance.*

#### `async get()`
*Get current property value.*

#### `async set(data)`
*Set property value.*

## Events
#### `afterPoll`
*Emitting after successfull poll.*
```
function (data) {}
```
* `data`: `Any`. Received data after poll.

#### `dataChanged`
*Emitting after new value received.*
```
function (data) {}
```
* `data`: `Any`. New received data.


#### `error`
*Emitting on error*
```
function (error) {}
```
* `error`: Error object

