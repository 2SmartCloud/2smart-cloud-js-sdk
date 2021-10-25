const EventEmitter = require('events');
const X = require('./X');

/* eslint-disable camelcase */
class Debugger extends EventEmitter {
    constructor(config, logger) {
        super();
        this.send = this.send.bind(this);
        this.ignore_hash = {};
        this.config = config || '';
        this.logger = logger || this.log.bind(this);
    }

    initEvents() {
        this.config.split(';').forEach(eventName => {
            this.on(eventName, (address, message, level) => {
                if (message && (typeof message !== 'string')) message = JSON.stringify(message, null, 4);
                this.logger((message) ? `${address}\n${message}` : address, level);
            });
        });
    }

    log(message, level = 'info') {
        console.log(JSON.stringify({ level, message }, null, 4));
    }

    info(address, message) {
        this.send(address, this._formattedMessage(message), 'info');
    }

    warning(address, message) {
        this.send(address, this._formattedMessage(message), 'warning');
    }

    error(message) {
        this.logger(this._formattedMessage(message), 'error');
    }

    _formattedMessage(data) {
        let res;

        if (data instanceof X) {
            res = JSON.stringify({ ...data, stack: `\n${data.stack}\n` }, null, 4).replace(/\\n/g, '\n');
        } else if (data instanceof Error) {
            res = JSON.stringify({ message: data.message, stack: `\n${data.stack}\n` }, null, 4).replace(/\\n/g, '\n');
        } else if (typeof data === 'object') {
            res = JSON.stringify({ ...data }, null, 4).replace(/\\n/g, '\n');
        } else {
            res = data;
        }

        return res;
    }

    send(address, message, level) {
        if (this.isIgnored(address)) return;
        const subroutines = address.split('.');

        this.emit('*', address, message, level);
        // eslint-disable-next-line more/no-c-like-loops
        for (let i = 1; i <= subroutines.length; i++) {
            this.emit(`${subroutines.slice(0, i).join('.')}.*`, address, message, level);
        }
        this.emit(address, address, message, level);
    }

    ignore(address) {
        this.ignore_hash[address] = true;
    }

    isIgnored(address) {
        const subroutines = address.split('.');

        if (address in this.ignore_hash) return true;
        // eslint-disable-next-line more/no-c-like-loops
        for (let i = 0; i <= subroutines.length; i++) {
            if ((`${subroutines.slice(0, i).join('.')}.*`) in this.ignore_hash) return true;
        }

        return false;
    }
}
module.exports = Debugger;
