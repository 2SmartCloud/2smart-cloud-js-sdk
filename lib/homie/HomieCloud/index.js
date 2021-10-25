/* istanbul ignore file */
const EventEmitter = require('events');
const CloudTransport = require('../../Broker/cloud-mqtt');
const X = require('./../../utils/X');
const Homie = require('./../Homie');
const { ERROR_CODES: { REQUIRED } } = require('./../../etc/config');

class HomieCloud extends EventEmitter {
    constructor({ transport, debug }) {
        if (!transport) {
            throw new X({
                code    : REQUIRED,
                fields  : {},
                message : 'Transport is required'
            });
        }

        super();

        this.handleMessage = this.handleMessage.bind(this);
        this.handleError = this.handleError.bind(this);

        this.transport = transport;
        this.store = {};
        this.debug = debug;
    }

    async init() {
        this.transport.on('message', this.handleMessage);

        await this.transport.connect();
        await new Promise((resolve, reject) => {
            this.transport.subscribe('#', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async handleMessage(topic, msg) {
        const rootTopic = topic.split('/')[0];

        if (!this.store[rootTopic]) {
            const homie = this.createNewHomie(rootTopic);

            homie._initEntitiesStore();
            homie.transport.handleMessage(topic, msg);
            await this.initNewHomie(rootTopic);
        }
    }

    handleError(error) {
        this.emit('error', error);
    }

    createNewHomie(rootTopic) {
        const homie = new Homie({
            transport : new CloudTransport({
                transport : this.transport,
                debug     : this.debug,
                rootTopic
            })
        });

        homie.on('error', this.handleError);

        this.store[rootTopic] = homie;
        this.emit('new_homie', rootTopic, homie);

        return homie;
    }

    async initNewHomie(rootTopic) {
        return this.store[rootTopic];
    }
}

module.exports = HomieCloud;
