# Bridge classes
- [Bridge](README.md#basebridge) - base bridge class.
- [DeviceBridge](Device/README.md) - base device bridge class.
- [NodeBridge](Node/README.md) - base node bridge class.
- [PropertyBridge](Property/README.md) - base property bridge class.
- [Parser](Parser/README.md) - base parser from/to homie.
- [PropertyTransport](Property/README.md) - base property transport class.

</br>

## Examples
Examples described [HERE](examples/README.md)

</br>

# BaseBridge
*Base Bridge class to combine both device and homie protocols and setup two-way control from mqtt broker and device's transport protocols.*
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

