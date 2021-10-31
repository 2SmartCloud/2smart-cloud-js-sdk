# Broker

## Description

Transport protocol for MQTT broker

***

**MQTTTransport(options)**

Class wraps a client connection to an MQTT broker over an arbitrary transport method (TCP, TLS, WebSocket, ecc).

- options:
    - uri: **Required.** mqtt broker URI;
    - retain: specify global `retain` flag for all publish messages (can be overwritten)
    - username: the username required by your broker, if any
    - password: the password required by your broker, if any
    - rootTopic: prefix for all topics to subscribe or publish
    - will: a message that will sent by the broker automatically when the client disconnect badly. The format is:
        `topic`: the topic to publish
        `payload`: the message to publish
        `qos`: the QoS
        `retain`: the retain flag
    - debug: custom logger, if needed

***

**MQTTTransport.connect()**

Connect to broker by given URI
   
***

**MQTTTransport.publish(topic, message, options, [callback])**

Publish a message to a topic

- topic: is the topic to publish to, String
- message: is the message to publish, Buffer or String
- options: is the options to publish with, including:
    `qos` QoS level, Number, default `0`
    `retain` retain flag, `Boolean`, default `false`
    `dup` mark as duplicate flag, `Boolean`, default `false`
- callback: `function (err)`, fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting.

***

**MQTTTransport.message([callback])**

- callback: `function (topic, message, packet)` handle message from broker
    - topic: `String`
    - message: `Buffer`
    - packet: `Object`

***

**MQTTTransport.subscribe(topic/topics array, [callback]**

Subscribe to a topic or topics

- topic: topic or topics to subscribe `String`/`Array`
- callback: `function (err, granted)` callback fired on suback where:
    `err` a subscription error or an error that occurs when client is disconnecting
    `granted` is an array of {topic, qos} where:
        `topic` is a subscribed to topic
        `qos` is the granted QoS level on it


***

**MQTTTransport.unsubscribe(topic/topics array, [callback])**

Unsubscribe from a topic or topics

- topic: topic or an array of topics to unsubscribe from `String`/`Array`
- callback: `function (err)` fired on unsuback. An error occurs if client is disconnecting.

***

**MQTTTransport.end([force], [cb])**

Close the client, accepts the following options:

- force: passing it to true will close the client right away, without waiting for the in-flight messages to be acked. This parameter is optional.
- cb: will be called when the client is closed. This parameter is optional.

***

**MQTTTransport.reconnect()**

Connect again using the same options as connect()

***

**MQTTTransport.onConnect(cb)**

- cb: handle successful (re)connection.

***

**MQTTTransport.setWill(will)**

Set will option before connection to broker. `Object`

`topic`: the topic to publish
`payload`: the message to publish
`qos`: the QoS
`retain`: the retain flag

***

**MQTTTransport.isConnected()**

Check is connected to broker

Returns: `Boolean`
