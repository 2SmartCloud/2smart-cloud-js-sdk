# ETL

Set of tools to convert topic messages into object model and vice versa

Transform rules described in [rules.js](rules.js). List of actions for each entity to transform from topic/object representations.

Rule example:
```
{
    "to"           : "$homie",
    "from"         : "homie",
    "action"       : "rename",
    "revertAction" : "revertRename"
}
```
- to: convert to topic property
- from: object key to convert from
- action: action method name to perform transformation from object to topic
- revertAction: action method name to perform transformation from topic to object

Transform methods descirbed in [actions.js](actions.js):

All methods receive `rule` and `data` args to perform action. `rule` - transform rule from [rules.js](rules.js). `data` - object of data to transform.

## Object to topic methods

All methods returs `object` in format:
```
    {
        key   : <key>,
        value : <value>
    }
```

- **move**

    Transform value from object by rule. Example:

    - rule:
        ```
        {
            to           : "$fw/name",
            from         : "firmware.name",
            action       : "move",
            revertAction : "revertMove"
        }
        ```
    - data:
        ```
        "firmware" : {
            "version" : "firmware-version",
            "name"    : "Firmware name"
        }
        ```

    Result:
    ```
    {
        key   : "$fw/name",
        value : "Firmware name"
    }
    ```

- **rename**

    Rename object key by rule. Example:

    - rule:
        ```
        {
            to           : '$name',
            from         : 'name',
            action       : 'rename',
            revertAction : 'revertRename'
        }
        ```
    - data:
        ```
        {
            "id" : "device-id",
            "name" : "Device name",
            "state" : "init",
            ...
        }
        ```

    Result:
    ```
    {
        key   : "$name",
        value : "Device name"
    }
    ```


- **parse**

    Parse array by rule. Example:

    - rule:
        ```
        {
            to           : '$nodes',
            from         : 'nodes',
            action       : 'parse',
            revertAction : 'revertParse'
        }
        ```
    - data:
        ```
        {
            "nodes" : [
                {
                    "id"      : "device-node",
                    "sensors" : [],
                    "telemetry" : [],
                    "options" : [],
                    "state" : "init",
                    "type"  : "type",
                    "name"  : "Some device node"
                },
                {
                    "id"      : "device-node-2",
                    "sensors" : [],
                    "telemetry" : [],
                    "options" : [],
                    "state" : "init",
                    "type"  : "type",
                    "name"  : "Some device node 2"
                }
            ]
        }
        ```

    Result:
    ```
    {
        key   : "$nodes",
        value : "device-node,device-node-2"
    }
    ```

## Topic to object methods

All methods returns `object` in format:
```
{
    [rule.from]: <value>
}
```

**revertMove**

Revert action for method `move`

- rule:
    ```
    {
        to           : "$fw/name",
        from         : "firmware.name",
        action       : "move",
        revertAction : "revertMove"
    }
    ```
- data:
    ```
    {
        "property": "$fw/name",
        "value": "Firmware name"
    }
    ```

Result:
```
{
    "firmware": {
        "name" : "Firmware name"
    }
}
```

**revertRename**

Revert action for method `rename`

- rule:
    ```
    {
        to           : '$name',
        from         : 'name',
        action       : 'rename',
        revertAction : 'revertRename'
    }
    ```
- data:
    ```
    {
        "property": "$name",
        "value": "Device name"
    }
    ```

Result:
```
{
    "name": "Device name"
}
```

**revertParse**

Revert action for method `parse`

- rule:
    ```
    {
        to           : '$nodes',
        from         : 'nodes',
        action       : 'parse',
        revertAction : 'revertParse'
    }
    ```
- data:
    ```
    {
        "property": "$nodes",
        "value": "device-node,device-node-2"
    }
    ```

Result:
```
{
    "nodes": [
        {
            "id": "device-node"
        },
        {
            "id": "device-node-2"
        }
    ]
}
```
