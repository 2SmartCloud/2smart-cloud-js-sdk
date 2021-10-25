const DEFAULT_PROPERTY_RULES = [
    {
        to           : '$value',
        from         : 'value',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$name',
        from         : 'name',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$settable',
        from         : 'settable',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$retained',
        from         : 'retained',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$datatype',
        from         : 'dataType',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$unit',
        from         : 'unit',
        action       : 'rename',
        revertAction : 'revertRename'
    },
    {
        to           : '$format',
        from         : 'format',
        action       : 'rename',
        revertAction : 'revertRename'
    }
];

module.exports = {
    DEVICE : [
        {
            to           : '$homie',
            from         : 'homie',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$name',
            from         : 'name',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$localip',
            from         : 'localIp',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$mac',
            from         : 'mac',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$fw/name',
            from         : 'firmwareName',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$fw/version',
            from         : 'firmwareVersion',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$implementation',
            from         : 'implementation',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$state',
            from         : 'state',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$nodes',
            from         : 'nodes',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$telemetry',
            from         : 'telemetry',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$options',
            from         : 'options',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$title',
            from         : 'title',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$last-heartbeat-at',
            from         : 'lastHeartbeatAt',
            action       : 'rename',
            revertAction : 'revertRename'
        }
    ],
    NODE : [
        {
            to           : '$name',
            from         : 'name',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$type',
            from         : 'type',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$state',
            from         : 'state',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$array',
            from         : 'range',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$telemetry',
            from         : 'telemetry',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$options',
            from         : 'options',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$properties',
            from         : 'sensors',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$title',
            from         : 'title',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$hidden',
            from         : 'hidden',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$last-activity',
            from         : 'lastActivity',
            action       : 'rename',
            revertAction : 'revertRename'
        }
    ],
    SENSOR : [
        ...DEFAULT_PROPERTY_RULES,
        {
            to           : '$groups',
            from         : 'groups',
            action       : 'parse',
            revertAction : 'revertParse'
        }
    ],
    PROPERTY : [
        ...DEFAULT_PROPERTY_RULES,
        {
            to           : '$groups',
            from         : 'groups',
            action       : 'parse',
            revertAction : 'revertParse'
        },
        {
            to           : '$title',
            from         : 'title',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$displayed',
            from         : 'displayed',
            action       : 'rename',
            revertAction : 'revertRename'
        }
    ],
    ENTITY : [
        {
            to           : '$',
            from         : '',
            action       : 'entityRename',
            revertAction : 'revertEntityRename'
        },
        {
            to           : '$list',
            from         : 'list',
            action       : 'parse',
            revertAction : 'revertParse'
        }
    ],
    SCENARIO : [
        {
            to           : '$state',
            from         : 'state',
            action       : 'rename',
            revertAction : 'revertRename'
        },
        {
            to           : '$thresholds',
            from         : 'thresholds',
            action       : 'parse',
            revertAction : 'revertParse'
        }
    ],
    THRESHOLD : DEFAULT_PROPERTY_RULES,
    entities  : [ 'DEVICE', 'NODE', 'SENSOR', 'PROPERTY', 'SCENARIO', 'THRESHOLD', 'ENTITY' ]
};
