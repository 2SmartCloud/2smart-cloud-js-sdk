const DeviceBridge = require('./instances/device');
const NodeBridge = require('./instances/node');
const PropertyBridge = require('./instances/property');
const Bridge = require('./instances/bridge');
const CustomConnection = require('./instances/connection');

const RandomIntegerTransport = require('./transports/random-integer');
const RandomBooleanTransport = require('./transports/random-boolean');

try {
    const device = new DeviceBridge({
        id   : 'read-only-dynamic-sensors',
        name : 'Read Only Dynamic Sensors'
    });

    const node = new NodeBridge({
        id   : 'node-id',
        name : 'Sensors'
    });

    node.addSensor(
        new PropertyBridge({
            id       : 'integer',
            name     : 'Random number',
            dataType : 'integer'
        }, {
            type      : 'sensor',
            transport : new RandomIntegerTransport()
        })
    );

    node.addSensor(
        new PropertyBridge({
            id       : 'boolean',
            name     : 'Random boolean',
            dataType : 'boolean'
        }, {
            type      : 'sensor',
            transport : new RandomBooleanTransport()
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
