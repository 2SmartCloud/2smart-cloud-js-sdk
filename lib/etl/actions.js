/* eslint-disable no-param-reassign */
const DEFAULT = { key: null, value: null };

// istanbul ignore next
function move(rule, data) {
    let isExists = true;
    const value = rule.from.split('.').reduce((obj, index) => {
        if (!obj) {
            isExists = false;

            return;
        }

        return obj[index];
    }, data);

    if (!isExists || value === undefined) return DEFAULT;

    return ({
        key   : rule.to,
        value : value || ''
    });
}

function rename(rule, data) {
    if (!(rule.from in data)) return DEFAULT;

    return ({
        key   : rule.to,
        value : data[rule.from] || ''
    });
}

// istanbul ignore next
function revertMove(rule, data) {
    const reverted = {};

    _fill(rule.from.split('.'), reverted, data.value);

    return reverted;
}

// istanbul ignore next
function _fill(parsed, obj, value) {
    const shifted = parsed.shift();

    if (parsed.length > 0) {
        obj[shifted] = obj[shifted] || {};

        _fill(parsed, obj[shifted], value);
    } else {
        obj[shifted] = value;
    }
}

function revertRename(rule, data) {
    return { [rule.from]: data.value };
}

function revertParse(rule, data) {
    return {
        [rule.from] : data.value.split(',').map(val => val).filter(res => res)
    };
}

function parse(rule, data) {
    if (!data[rule.from]) return DEFAULT;

    return {
        key   : rule.to,
        value : data[rule.from].map(entry => {
            if (typeof entry === 'object') return entry.id;

            return entry;
        }).join(',')
    };
}

function entityRename(rule, data) {
    const key = Object.keys(data)[0];
    const newRule = { ...rule, to: `${rule.to}${key}`, from: key };

    return rename(newRule, data);
}
function revertEntityRename(rule, data) {
    const key = data.property.replace('$', '');
    const newRule = { ...rule, to: data.property, from: key };

    return revertRename(newRule, data);
}

module.exports = {
    move,
    rename,
    revertMove,
    revertRename,
    revertParse,
    parse,
    entityRename,
    revertEntityRename
};
