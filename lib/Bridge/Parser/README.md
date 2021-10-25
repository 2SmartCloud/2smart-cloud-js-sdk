## Parser
*Class is responsible for converting data from transport format to homie format and vice versa.*
*Does not convert data by default*

### `BaseParser(conf)`
* `conf`
    * `type` : parser type
    * `homieDataType` : `String`. One of: `integer`, `float`, `boolean`, `string`, `enum`, `color`. Default: `string`.

#### `fromHomie(data)`
*Convert homie data to transport format*
* `data` - `Array`. List of values, where 1st element is a new value and other is other transport specific options.

#### `toHomie(data)`
*Convert transport data to homie format*
* `data` - `Any`. Data received from transport
