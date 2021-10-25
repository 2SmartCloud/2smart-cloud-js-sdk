# Bridge classes
- [Bridge](README.md#basebridge) - base bridge class.
- [DeviceBridge](Device/README.md) - base device bridge class.
- [NodeBridge](Node/README.md) - base node bridge class.
- [PropertyBridge](Property/README.md) - base property bridge class.
- [Parser](Parser/README.md) - base parser from/to homie.
- [PropertyTransport](Property/README.md) - base property transport class.

</br>

## Examples
[HERE](examples/README.md)

</br>

# BaseBridge
*Клас который является контейнером для всего что нужно бриджу.*
### `new BaseBridge(config)`
* `config`
    * `homie` : instance of [Homie](../homie/Homie/README.md)
    * `mqttConnection` : if `homie` instance is not specified, `mqttConnection` options will create an instance of [MQTTTransport](../Broker/README.md) `new MQTTTransport(mqttConnection)`
    * `device` - instance of [Device](Device/README.md)

#### `init()`
*Initialize bridge in MQTT broker.*

#### `destroy()`
*Stop bridge.*

## Events
#### `exit`
*Bridge stops synchronization with MQTT broker. Bridge MUST stop on this event.*
```
function (error/reason, exit_code) {}
```
* `error/reason`: `Any`
* `exit_code`: `Integer`. Exit code.


#### `error`
*Emitting on error*
```
function (error) {}
```
* `error`: Error object

