const X = require('../utils/X');
const { ERROR_CODES: { REQUIRED } } = require('./../etc/config');

const config = require('./rules');
const actions = require('./actions');

function translateObjToTopic(entity, data, baseTopic) {
    if (!config.entities.includes(entity)) {
        throw new X({
            code   : REQUIRED,
            fields : {
                entity : 'WRONG_TYPE'
            },
            message : 'Wrong entity'
        });
    }

    if (!baseTopic) {
        throw new X({
            code   : REQUIRED,
            fields : {
                baseTopic : 'REQUIRED'
            },
            message : 'Base topic required'
        });
    }

    const translated = {};
    const entityConfig = config[entity];

    const filteredRules = entityConfig.filter(conf => conf.action);

    for (const dataKey in data) {
        const dataValue = data[dataKey];

        filteredRules.forEach((rule) => {
            const { key, value } = actions[rule.action](rule, { [dataKey]: dataValue });

            // skip rule if value not exists
            if (!key) return;

            if (key === '$value' && entity !== 'ENTITY') {
                translated[`${baseTopic}`] = `${value}`;

                return;
            }

            translated[`${baseTopic}/${key}`] = `${value}`;
        });
    }

    return translated;
}

function translateTopicToObj(entity, data) {
    if (!config.entities.includes(entity)) {
        throw new X({
            code   : REQUIRED,
            fields : {
                entity : 'WRONG_TYPE'
            },
            message : 'Wrong entity'
        });
    }

    let entityConfig = config[entity].find(prop => prop.to === data.property);

    // default etl config for ENTITY attributes
    if (entity === 'ENTITY' && !entityConfig) entityConfig = config[entity][0];

    if (!entityConfig) {
        return {};
    }

    return actions[entityConfig.revertAction](entityConfig, data);
}

function getKeyByTopic(entity, topic) {
    // key for ENTITY attributes
    if (entity === 'ENTITY') return topic.replace('$', '');

    const entityConfig = config[entity].find(prop => prop.to === topic);

    return entityConfig ? entityConfig.from : undefined;
}

module.exports = {
    translateObjToTopic,
    translateTopicToObj,
    getKeyByTopic
};
