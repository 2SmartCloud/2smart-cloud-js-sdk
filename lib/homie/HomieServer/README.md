# HomieServer [DEPRECATED]

## API

- HomieServer(options)
- HomieServer.initWorld()
- HomieServer.getDeviceById(id)
- HomieServer.getDevices()
- HomieServer.onThresholdPublish(cb)
- HomieServer.getThresholds()
- HomieServer.publishThresholdValue(topic, value)

***

**HomieServer(options)**

Create HomieServer instance

- options:
    - homie: Homie instance

***

**HomieServer.initWorld()**

Homie initialization: retrieve all topics from broker, translate topics to objects, create device instances

***

**HomieServer.getDeviceById(id)**

Get device instance by id

- id: device id `String`

Returns: [Device](../../Device/README.md) instance

Throws exception if instance not found. Error example:
```
{
    fields: { device: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**HomieServer.getDevices()**

Get object of device instances

Returns: `Object` of [device instances](../../Device/README.md). Example:
```
{
    "device-id": new Device(),
    ...
}
```

***

**HomieServer.onThresholdPublish(cb)**

Handle threshold publish event

- cb: `function(data)` Callback function to handle error
    - data:
        - threshold: `String`. Threshold topic;
        - value: `String`. Published value;

***

**HomieServer.getThresholds()**

Get thresholds. Returns `Object`.

***

**HomieServer.publishThresholdValue(topic, value)**

Publish new threshold value by topic.

- topic: `String`. Threshold topic;
- value: `String`. Threshold value;
