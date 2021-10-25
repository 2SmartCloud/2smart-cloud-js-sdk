module.exports = {
    createdAt : {
        validation   : [ 'positive_integer' ],
        settable     : false,
        retained     : true,
        description  : 'Entity creation time',
        defaultValue : Date.now
    }
};
