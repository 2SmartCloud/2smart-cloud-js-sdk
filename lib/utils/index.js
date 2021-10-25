/* istanbul ignore file */
const createHash = require('create-hash/browser');
const nanoid     = require('nanoid/generate');
const validate   = require('./validate');

function validatePropertyType(params) {
    return validate({
        options   : { 'list_of': [ 'required' ] },
        telemetry : { 'list_of': [ 'required' ] }
    }, params, 'Wrong property type');
}

function validateNodesList(params) {
    return validate({
        nodes : { 'list_of': [ 'required' ] }
    }, params, 'Wrong property type');
}


function validateSensorsList(params) {
    return validate({
        sensors : { 'list_of': [ 'required' ] }
    }, params, 'Wrong property type');
}

function generateNameAndType(rootTopic) {
    let name = rootTopic;
    const type = rootTopic.replace(/-/g, '_').toUpperCase();

    name = name.split('');
    name.forEach((char, idx) => {
        if (idx === 0) name[idx] = name[idx].toUpperCase(); // first char to UC
        if (char === '-' && name[idx + 1]) name[idx + 1] = name[idx + 1].toUpperCase(); // char after '-' to UC
    });
    name = name.join('');
    name = name.replace(/-/g, '');

    return { type, name };
}

function createMD5Hash(string) {
    return createHash('MD5').update(string).digest('hex');
}

function getUserHash(string) {
    return createHash('sha256').update(string).digest('hex');
}

function getRandomId(length = 20) {
    return nanoid('abcdefghijklmnopqrstuvwxyz1234567890', length);
}

module.exports = {
    validatePropertyType,
    validateNodesList,
    validateSensorsList,
    generateNameAndType,
    createMD5Hash,
    getRandomId,
    getUserHash
};
