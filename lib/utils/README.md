# Utils

## Debugger
*Logging tool*
- Debugger([event, logger])
- Debugger.initEvents()
- Debugger.log(message[, level])
- Debugger.info(address, message)
- Debugger.warning(address, message)
- Debugger.error()
- Debugger.send(address, message, level)
- Debugger.ignore(address)
- Debugger.isIgnored(address)

***

**Debugger([event, logger])**

Creates Debugger instance

- event: `String`. Event name for logging
- logger: `Any`. Custom logger

***

**Debugger.initEvents()**

Method for subscribing on logging events. Subscribing is made by "event" argument passed to the constructor.

***

**Debugger.log(message[, level = 'info'])**

Prints formatted message to stdout.

- message: `Any` a message to print
- level: `String` a logging level

***

**Debugger.info(address, message)**

Emits event for logging `info` message

- address: `String` an event name
- message: `Any` a message to log

***

**Debugger.warning(address, message)**

Emits event for logging `warning` message

- address: `String` an event name
- message: `Any` a message to log

***

**Debugger.error(message)**

Log the errors. This method ignores any subscriptions and log any message

- message: `Any` a message to log

***

**Debugger.send(address, message, level)**

Emits event for logging any message

- address: `String` an event name
- message: `Any` a message to log
- level: `String` a logging level

***

**Debugger.ignore(address)**

Unsubscribes from event

- address: `String` an event name to unsubscribe from

***

**Debugger.isIgnored(address)**

Check whether there is any subscription for provided event

- address: `String` an event name

Return: `boolean`

***


### Example of usage with subscription:
```

const Debugger = require('homie-sdk/lib/utils/debugger');
const debug = new Debugger('*');

debug.initEvents();

function someFunc() {
    debug.info('Custom.address.someFunc', 'Function call');

    debug.warning('Custom.address.someFunc', 'WARNING! Function call');

    debug.error({ code: 'ERROR', message: 'Function call' });
}

someFunc();

// -> { "level": "info", "message": "Custom.address.someFunc: Function call" }
// -> { "level": "warning", "message": "Custom.address.someFunc: WARNING! Function call" }
// -> { "level": "error", "message": "{ code: "ERROR", message: "Function call" }" }
```

### Example of usage without subscription:
```

const Debugger = require('homie-sdk/lib/utils/debugger');
const debug = new Debugger();

function someFunc() {
    debug.logger('Function call');

    debug.logger('WARNING! Function call', 'warning');

    debug.error({ code: 'ERROR', message: 'Function call' });
}

someFunc();

// -> { "level": "info", "message": "Function call" }
// -> { "level": "warning", "message": "WARNING! Function call" }
// -> { "level": "error", "message": "{ code: "ERROR", message: "Function call" }" }
```