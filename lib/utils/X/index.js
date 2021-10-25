/* istanbul ignore file */
class X extends Error {
    constructor({ fields = {}, code, message = '' }) {
        super();
        if (!code) throw new Error('MESSAGE_REQUIRED');

        this.fields = fields;
        this.code = code;
        this.message = message;
    }
}

module.exports = X;
