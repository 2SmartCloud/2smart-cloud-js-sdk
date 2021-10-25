const DeviceBridge = require('./instances/device');
const NodeBridge = require('./instances/node');
const PropertyBridge = require('./instances/property');
const Bridge = require('./instances/bridge');
const CustomConnection = require('./instances/connection');

try {
    const device = new DeviceBridge({
        id   : 'custom-device',
        name : 'Smart Device'
    });

    // read-only telemetry
    device.addTelemetry(
        new PropertyBridge({
            id    : 'serial-number',
            name  : 'Serial number',
            value : 'XX-1234-YY'
        }, {
            type : 'telemetry'
        })
    );

    const node = new NodeBridge({
        id   : 'node-id',
        name : 'Relay'
    });

    // settable boolean sensor
    node.addSensor(
        new PropertyBridge({
            id       : 'toggle',
            name     : 'Switch',
            dataType : 'boolean',
            settable : true
        }, {
            type : 'sensor'
        })
    );

    // settable boolean sensor
    node.addSensor(
        new PropertyBridge({
            id       : 'toggle-2',
            name     : 'Switch 2',
            dataType : 'boolean',
            settable : true
        }, {
            type : 'sensor'
        })
    );

    // settable string sensor
    node.addSensor(
        new PropertyBridge({
            id       : 'text',
            name     : 'Message',
            settable : true
        }, {
            type : 'sensor'
        })
    );

    device.addNode(node);

    const bridge = new Bridge({
        mqttConnection : {
            username : '',
            password : '',
            uri      : 'mqtt://localhost:1883'
        },
        connection : new CustomConnection(),
        device
    });

    // this will init device in MQTT broker
    bridge.init();

    // this will connect to device by it's protocol described in CustomConnection
    bridge.connection.connect();

    bridge.on('error', console.error);
    bridge.on('exit', (reason, exitCode) => {
        console.log(`Bye! Reason: ${reason}. Exit code: ${exitCode}`);
        process.exit(exitCode);
    });
} catch (e) {
    console.error(e);
    process.exit(1);
}
