# Broker

## Описание

Реализация транспортных протоколов для работы с брокером.

***

**MQTTTransport(options)**

Класс оборачивает клиентское соединение с брокером.

- options:
    - uri: **Required.** URI для подключения к брокеру;
    - retained: флаг для `retain` режима. По умолчанию `true`

***

**MQTTTransport.connect()**

Подключается к брокеру, указанному в URI.
   
***

**MQTTTransport.publish(topic, message, options, [callback])**

Опубликовать сообщение в топике.

- topic: топик для публикации
- message: сообщение для публикации
- options: по умолчанию `{}`
    - dup: отмечать как дублирующий флаг, `Boolean`, по умолчанию `false`
    - properties: свойства MQTT 5.0, `Object`
        - messageExpiryInterval: время жизни сообщения приложения в секундах `Number`;
        - responseTopic: строка, которая используется в качестве имени топика для строки ответного сообщения, `String`;
- callback: function (err), срабатывающая при завершении обработки QoS, или при следующем тике, если QoS 0. Ошибка возникает, если клиент отключается.

***

**MQTTTransport.message([callback])**

Метод для обработки сообщений из брокера

- callback: function (topic, message, packet), callback для обработки сообщения
    - topic: топик `String`
    - message: сообщение для публикации `Buffer`
    - packet: принятый пакет `Object`

***

**MQTTTransport.subscribe(topic, [callback]**

Подписаться на топик или топики

- topic: топик или топики для подписки `String`/`Array`
- callback - function (err, granted) ошибка подписки или ошибка, возникающая при отключении клиента:
    - topic: топик, который вызвал ошибку
    - QOS: это предоставленный уровень QOS

***

**MQTTTransport.unsubscribe(topic/topic array, [callback])**

Отписаться от топика или топиков

- topic: топик или топики для отписки `String`/`Array`
- callback - function (err) ошибка отписки или ошибка, возникающая при отключении клиента

***

**MQTTTransport.end([force], [cb])**

Закрыть соединение с брокером

- force: если `true`, мгновенно закрывает соединение с брокером `Boolean`
- cb: будет вызван, когда соединение будет закрыто

***

**MQTTTransport.reconnect()**

Подключитесь снова, используя те же параметры, что и connect ()

**MQTTTransport.onConnect(cb)**

- cb: будет вызван, при подключении к брокеру



