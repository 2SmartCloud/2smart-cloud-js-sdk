# EntityBridge
Base class for [DeviceAndNode](README.md#deviceandnode) and [Property](../Property/README.md)

#### `attachBridge(bridge)`
*Attach bridge instance.*
[Bridge instance](../README.md)

#### `detachBridge()`
*Detach bridge instance.*


# DeviceAndNode
Extends [EntityBridge](README.md#entitybridge)
Base class for [Device](../Device/README.md) and [Node](../Node/README.md)

#### `set connected(value)`
*Change connection status.*
```
connected = null;  // homie state - 'init'
connected = true;  // homie state - 'ready'
connected = false; // homie state - 'disconnected'
```

#### `get connected()`
*Get current connection status.*

#### `addPropertyTransport(propertyTransport)`
*Add transport.*
* `propertyTransport` : instance of [PropertyTransport](../Property/README.md#propertytransport)

#### `removePropertyTransport(id)`
*Remove property transport by ID.*
* `id` : property transport ID

#### `getPropertyTransportById(id)`
*Return property transport by ID.*
* `id` : property transport ID

#### `attachBridge(bridge)`
*Attach bridge instance.*
[Bridge instance](../README.md)

#### `detachBridge()`
*Detach bridge instance.*
