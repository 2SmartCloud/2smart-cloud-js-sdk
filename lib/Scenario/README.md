# Scenario

## API

**Scenario(options)**

Create empty Scenario instance

- options:
    - id: `String` Required. May contain lowercase letters from `a` to `z`, numbers from `0` to `9` as well as the hyphen character (`-`). MUST NOT start or end with a hyphen (`-`). Device id;
***

**Scenario.updateAttribute(attributes)**

Update scenario attributes

- attributes: `Object`
    - state: `Boolean`. reflect state of scenario (turn on/off). Required
    - thresholds: `String` thresholds ids separated by coma
***

**Scenario.validateMyStructure()**

Validate scenario attributes. Makes scenario `valid` if structure is correct. Throws exception if structure is invalid and making scenario `invalid`.
Error example:
```
{
    code   : 'VALIDATION_ERROR',
    fields : {
        // ... list of invalid attributes
    },
    message : 'Attributes validation error'
}
```

***

**Scenario.onAttach(homie)**

Inject scenario instance with homie environment

- homie: [homie](../homie/README.md) instance. Required;

***

**Scenario.publishAttribute(attribute, value)**

Publish scenario attribute to broker

- attribute: `String`. One of - `state`. Required;
- value: `String`. Value to publish. Required;

***

**Scenario.setAttribute(attribute, value)**

Set scenario attribute to broker

- attribute: `String`. One of - `state`. Required;
- value: `String`. Value to publish. Required;

***

**Scenario.onAttributePublish(cb)**

Subscribe to publish events. Subscribes automatically to all thresholds.

- cb: `function(data)`. Callback to handle attribute publish event
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. One of - `SCENARIO`, `THRESHOLD`;
        - scenario: [Scenario](README.md) instance.
        - threshold: [Threshold](../Threshold/README.md) instance.
***

**Scenario.onAttributeSet(cb)**

Subscribe to set events. Subscribes automatically to all thresholds.

- cb: `function(data)`. Callback to handle attribute set event
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. One of - `SCENARIO`, `THRESHOLD`;
        - scenario: [Scenario](README.md) instance.
        - threshold: [Threshold](../Threshold/README.md) instance.

***

**Scenario.onErrorPublish(cb)**

Subscribe to error events. Subscribes automatically to all thresholds.

- cb: `function(data)`. Callback to handle error event
    - data:
        - value: `Object`. Error object:
            - code: `String`. Error code;
            - message: `String`. Error message;
        Default:
        ```
        {
            code    : "ERROR",
            message : "Something went wrong"
        }
        ```
        - type: `String`. One of - `SCENARIO`, `THRESHOLD`;
        - scenario: [Scenario](README.md) instance.
        - threshold: [Threshold](../Threshold/README.md) instance.

***

**Scenario.getTopic()**

Get scenario topic

***

**Scenario.serialize()**

Get serialized scenario data

Returns: `Object`. Example -
```
{
    'id'         : 'some-scenario-id',
    'state'      : 'false',
    'thresholds' : [
        {
            'id'         : 'threshold1',
            'scenarioId' : 'some-scenario-id',
            'unit'       : '#',
            'dataType'   : 'integer',
            'retained'   : 'true',
            'settable'   : 'true',
            'name'       : 'Scenario threshold1',
            'value'      : '26',
            'format'     : ''
        }
    ]
}
```
***

**Scenario.addThreshold(threshold)**

Add threshold instance to scenario

- threshold: [Threshold](../Threshold/README.md) instance. Required;

Throws exception if threshold is invalid or threshold already exists

***

**Scenario.getId()**

Get scenario id

Returns: `String`

***

**Scenario.getThresholds()**

Get list of scenarios thresholds

Returns: `Array`

***

**Scenario.getState()**

Get scenario state

Returns: `String`

***

**Scenario.getThresholdById(id)**

Get scenario threshold by id

- id: `String`. Threshold id. Required;

Throws exception if instance not found. Error example:
```
{
    fields: { threshold: 'NOT_FOUND' },
    code: 'NOT_FOUND',
    message: ''
}
```

***

**Scenario.removeThresholdById(id)**

Delete scenario threshold by id

- id: `String`. Threshold id. Required;

***

**Scenario.getRootTopic()**

Return scenario root topic

***

**Scenario.isEmpty()**

Returns `true` if each scenarios attribute is empty and otherwise

***

**Scenario.delete()**

Deletes scenario (clears all data and deletes handlers)

***

***

**Scenario.getTopics()**

Returns all scenarios topics

***


