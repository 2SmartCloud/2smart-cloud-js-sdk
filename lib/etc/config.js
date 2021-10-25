const DATA_TYPES = [ 'integer', 'float', 'boolean', 'string', 'enum', 'color' ];
const STATE_TYPES = [ 'init', 'ready', 'disconnected', 'sleeping', 'lost', 'alert' ];

module.exports = {
    COMMON_VALIDATION_RULES : {
        property : {
            id       : [ 'required', { like: '(^[a-z0-9]$|^[a-z0-9][a-z0-9]$|^[a-z0-9][a-z-0-9-]+[a-z0-9]$)' } ],
            name     : [ 'required', 'string' ],
            value    : 'string',
            settable : { 'one_of': [ 'true', 'false' ] },
            retained : { 'one_of': [ 'true', 'false' ] },
            dataType : { 'one_of': DATA_TYPES },
            unit     : 'string',
            format   : 'string'
        },
        state : { 'one_of': STATE_TYPES }
    },
    COLOR_MODELS : [ 'rgb', 'hsv' ],
    ERROR_CODES  : {
        UNKNOWN_ERROR    : 'ERROR',
        RACE_CONDITION   : 'RACE_CONDITION',
        CONNECTION_ERROR : 'CONNECTION_ERROR',
        VALIDATION       : 'VALIDATION',
        REQUIRED         : 'REQUIRED',
        WRONG_TYPE       : 'WRONG_TYPE',
        NOT_SETTABLE     : 'NOT_SETTABLE',
        NOT_FOUND        : 'NOT_FOUND',
        WRONG_FORMAT     : 'WRONG_FORMAT',
        EXISTS           : 'EXISTS',
        BROKER_ERROR     : 'BROKER_ERROR',
        TIMEOUT          : 'TIMEOUT'
    },
    STATE_TYPES
};
