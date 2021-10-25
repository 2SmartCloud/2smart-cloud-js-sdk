const fs = require('fs').promises;
const { getUserHash } = require('./../../utils'); // homie-sdk/lib/utils

const RaspberryTransport = require('./transports/raspberry');
const DeviceBridge = require('./instances/device');
const NodeBridge = require('./instances/node');
const PropertyBridge = require('./instances/property');
const Bridge = require('./instances/bridge');
const CustomConnection = require('./instances/connection');

// another way cat /sys/firmware/devicetree/base/model
const CPUINFO_FILE_PATH = '/proc/cpuinfo';

async function readRaspberryPiModel() {
    try {
        const data = await fs.readFile(CPUINFO_FILE_PATH, 'utf8');
        const first = data.indexOf('Raspberry');
        const last = data.indexOf('\n', first);
        const text = data.slice(first, last);

        if (text === '') {
            throw new Error('Unknown model of raspberry.');
        }

        return text;
    } catch (e) {
        console.error(e);

        throw new Error('Can\'t read model of Raspberry!');
    }
}

/*
* you can add telemetry and any other properties in constructor
* or by using addNode, addSensor, addOption and addTelemetry
* at any moment
*/
async function main() {
    try {
        // this credentials could be found in 2smart cloud app
        const mqttUri   = '';
        const userEmail = '';
        const productId = '';
        const token     = '';
        const deviceId  = '';

        const hash = getUserHash(userEmail);

        const model = await readRaspberryPiModel();
        const modelTelemetry = new PropertyBridge({
            id       : 'model',
            dataType : 'string',
            settable : false,
            name     : 'Model',
            value    : model
        }, {
            type : 'option'
        });

        const device = new DeviceBridge({
            id        : deviceId,
            telemetry : [
                modelTelemetry
            ],
            firmwareName : productId
        });

        const gpioSensor = new PropertyBridge({
            id       : 'gpio',
            dataType : 'boolean',
            name     : 'GPIO',
            settable : true
        }, {
            type      : 'sensor',
            transport : new RaspberryTransport({
                id       : 'gpio',
                pinout   : 5,
                mode     : 'out',
                protocol : 'gpio'
            })
        });

        // add all sensors from array into node
        const node = new NodeBridge({
            id      : 'nodeid',
            sensors : [
                gpioSensor
            ]
        });

        device.addNode(node);

        const username = hash;
        const rootTopic = hash;

        const bridge = new Bridge({
            mqttConnection : {
                username,
                password : token,
                uri      : mqttUri,
                rootTopic
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
}

main();
