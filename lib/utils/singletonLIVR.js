const LIVR = require('livr');
const extraRules = require('livr-extra-rules');
const customValidationRules = require('./customValidationRules');

LIVR.Validator.defaultAutoTrim(true);
LIVR.Validator.registerDefaultRules(extraRules);
LIVR.Validator.registerDefaultRules(customValidationRules);

module.exports = LIVR;
