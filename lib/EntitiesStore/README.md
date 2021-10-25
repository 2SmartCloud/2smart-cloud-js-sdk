# Entity

**Entity.validateId(id)**

- id: check id for validity. `String`

Throws exception if `id` is invalid

***

**Entity.validateMyStructure()**

Validate entity attributes. Makes entity `valid` if structure is correct. Throws exception if structure is invalid and making entity `invalid`.
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

**Entity.onAttach(homie)**

Inject homie to entity

- homie: [homie](../homie/README.md) instance. Required;

***

**Entity.onAttributePublish(cb)**

Subscribe to publish events

- cb: `function(data)`. Callback to handle attribute publish event
    - data:
        - field: `String`. Published field;
        - value: `String`. New field value;
        - type: `String`. Entity type
        - entity: [Entity](README.md) instance.

***

**Entity.onAttributeSet(cb)**

Subscribe to set events

- cb: `function(data)`. Callback to handle attribute publish event
    - data:
        - field: `String`. Published field;
        - value: `String`. Value to set;
        - type: `String`. Entity type
        - entity: [Entity](README.md) instance.

***

**Entity.onErrorPublish(cb)**

Subscribe to error events

- cb: `function(data)`. Callback to handle error event
    - data:
        - field: `String`. Error field
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
        - type: `String`. Entity type.
        - entity: [Entity](README.md) instance.

***



