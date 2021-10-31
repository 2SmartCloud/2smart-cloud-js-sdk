# HomieCloud

## API

- HomieCloud(options)
- HomieCloud.init()
- HomieCloud.createNewHomie(rootTopic)
***

**HomieCloud(options)**

Create HomieCloud instance

- options:
    - transport: Transport instance. One of [Broker](../../Broker)
    - debug: any logger that respects [Debugger](../../utils/README.md) interface

***

**HomieCloud.init()**

Connect trasport and subscribe to all topics

***

**HomieCloud.createNewHomie(rootTopic)**

Creates new homie instance with provided root topic and emits "new_homie" event

- rootTopic: a root topic for the homie instance `String`

Returns: [Homie](../homie/README.md)

