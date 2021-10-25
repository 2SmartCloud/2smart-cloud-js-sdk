class BaseParser {
    constructor(conf) {
        // eslint-disable-next-line no-nested-ternary
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf, homieDataType: conf } : conf;
        conf = { type: 'raw', homieDataType: 'string', ...conf };

        this.type = conf.type;
        this.homieDataType = conf.homieDataType;
    }

    /*
    * fromHomie(data) - converts homie value to source data type
    * data = homie value(typeof data = 'string')
    *
    * returns
    * Array of arguments to transport, first argument must be transport value, other - any other transport arguments
    * */
    fromHomie(data) {
        return [ data ];
    }

    /*
    * toHomie(data) - converts source data type to homie value(typeof data = 'string')
    * data = any data of source data format
    *
    * returns
    * homie value(typeof data = 'string')
    * */
    toHomie(data) {
        return `${data}`;
    }
}

module.exports = BaseParser;
