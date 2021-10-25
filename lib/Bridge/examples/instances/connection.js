const EventEmitter = require('events');

class CustomConnection extends EventEmitter {
    constructor() {
        super();
    }

    connect() {
        console.log('CONNECTED to CustomConnection');
        this.emit('connected');
    }

    disconnect() {
        console.log('DISCONNECTED from CustomConnection');
        this.emit('disconnected');
    }
}

module.exports = CustomConnection;
