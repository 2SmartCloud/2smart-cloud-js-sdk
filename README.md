# Homie SDK

## Description
SDK for managing devices and their states, it is based on extended protocol [homieiot](https://homieiot.github.io/specification/).

## Extension of the protocol

1.  The device has a group of attributes `$options`, which in format repeats the `$properties` from the node. Used to store device settings, both editable and not. Example: `sweet-home/device/$options/some-option`.
2.  The device has a group of attributes `$telemetry`, which in format repeats the `$properties` from the node. Used to store various telemetry and statistics. `$stats` is not used. Example: `sweet-home/device/$telemetry/some-telemetry`.
3.  A node has a `$state` attribute, similar to a device. Example: `sweet-home/device/node/$state`.
4.  The node has a group of attributes `$options`, similar to the device. Example: `sweet-home/device/node/$options/some-option`.
5.  The node has a group of attributes `$telemetry`, similar to the device. Example: `sweet-home/device/node/$telemetry/some-telemetry`.
6.  A mechanism for validating the set values has been added to the application:
    *  On the received message, in case of incorrect values, the error body should be sent to a topic like `errors/sweet-home/device/node...` The error body should be in the JSON format of the string "{" code ": 'error_code'," message ": 'error message'}". (For example, if an incorrect value has come to the topic `sweet-home/device/node/sensor/set`, then the error should be sent to the topic `errors/sweet-home/device/node/sensor`)
     *  Valid for any editable values (`$properties`,`$options`, `$telemetry`).

7.  Device and node indicators are taken from the following attributes:
     *  Status (state) - `$state`.
     *  Signal strength - `$telemetry/signal`.
     *  Battery charge level - `$telemetry/battery`.

Device attribute `$stats` from the original protocol is not supported.


### Required state for creating an entity in an application

* For device: `$homie`, `$name`, `$localip`, `$mac`, `$fw/name`, `$fw/version`, `$implementation`, `$state`.
* For node: `$name`, `$state` plus at least one property.
* For properties: (`$properties`, `$options`, `$telemetry`): `$name`.

## Structure

1. [Broker](lib/Broker/README.md) - supported transport protocols.
2. [Device](lib/Device/README.md) - tool for device creation/control.
3. [Node](lib/Node/README.md) - tool for node creation/control.
4. [Property](lib/Property/README.md) - tool for property creation/control.
5. [Sensor](lib/Sensor/README.md) - tool for sensor creation/control.
6. [ETL](lib/etl/README.md) - set of rules for the data transformation.
7. [Homie](lib/homie/README.md) - toolkit for managing devices and their states.
8. [Bridge](lib/Bridge/README.md) - toolkit for bridge developers.
9. [Utils](lib/utils/README.md) - set of utilities.
