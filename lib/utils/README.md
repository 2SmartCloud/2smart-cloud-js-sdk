# Utils

## Debugger
*Инструмент для логирования.*
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

- event: `String`. Название события для логирования
- logger: `Any`. Кастомный логгер

***

**Debugger.initEvents()**
*Метод для подписки на события логов.*

Подписка производиться по аргументу `event`.

***

**Debugger.log(message[, level = 'info'])**

Форматированный вывод сообщения в stdout

- message: `Any`
- level: `String`

***

**Debugger.info(address, message)**

Триггер события для логирования `info` сообщения

- address: `String`. Название события
- message: `Any`

***

**Debugger.warning(address, message)**

Триггер события для логирования `warning` сообщения

- address: `String`. Название события
- message: `Any`

***

**Debugger.error(message)**

Логирование ошибки. Этот метод игнорирует подписки на события и логирует любое сообщение

- message: `Any`

***

**Debugger.send(address, message, level)**

Триггер события для логирования любого сообщения

- address: `String`. Название события
- message: `Any`
- level: `String`

***

**Debugger.ignore(address)**

Отписка от события логирования по названию

- address: `String`. Название события

***

**Debugger.isIgnored(address)**

Проверка факта подписки на событие логирования по названию

- address: `String`. Название события

Return: `boolean`

***


### Пример использования с подпиской:
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

### Пример использования без подписки:
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