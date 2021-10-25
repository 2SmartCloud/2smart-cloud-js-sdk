const DeviceBridge = require('./instances/device');
const NodeBridge = require('./instances/node');
const PropertyBridge = require('./instances/property');
const Bridge = require('./instances/bridge');
const CustomConnection = require('./instances/connection');

const IntegerParser = require('./parsers/integer');
const CustomTransport = require('./transports/custom');

try {
    const device = new DeviceBridge({
        id   : 'custom-device-2',
        name : 'Smart Device 2'
    });

    const node = new NodeBridge({
        id   : 'node-id',
        name : 'Validate integer'
    });

    node.addSensor(
        new PropertyBridge({
            id       : 'only-negative',
            name     : 'Negative number',
            dataType : 'integer',
            settable : true
        }, {
            type   : 'sensor',
            parser : new IntegerParser({ mode: 'negative' })
        })
    );

    node.addSensor(
        new PropertyBridge({
            id       : 'only-positive',
            name     : 'Positive number',
            dataType : 'integer',
            settable : true
        }, {
            type   : 'sensor',
            parser : new IntegerParser()
        })
    );

    node.addSensor(
        new PropertyBridge({
            id       : 'positive-range',
            name     : 'Positive range 0-100',
            dataType : 'integer',
            settable : true
        }, {
            type      : 'sensor',
            parser    : new IntegerParser(),
            transport : new CustomTransport()
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
