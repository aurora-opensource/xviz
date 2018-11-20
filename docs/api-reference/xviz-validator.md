# XVIZValidator

`XVIZValidator` class lets you check the XVIZ objects conform to the specification.

## Constructor

Automatically loads schema data.

## Methods

All validation methods throw if the object fails to validate.

### Validate high level objects

#### `validateMetadata(data : Object)`

Validate `metadata` information.

#### `validateStateUpdate(data : Object)`

Validate `state_update` message.

### Validate core object

#### `validateStreamSet(data : Object)`

Validate `stream_set` type.

### Validate base types

#### `validatePose(data : Object)`

#### `validatePrimitive(type : String, data : Object)`

Validate the different primitive types.

- `type` - the type of the variable, like "point" or "circle", see spec
- `data` - the object to validate

#### `validateTimeSeries(data : Object)`

#### `validateFutureInstances(data : Object)`

#### `validateVariable(data : Object)`

#### `validateAnnotation(type : String, data : Object)`

Validation the different annotation types.

- `type` - the type of the variable, only "visual" is currently valid
- `data` - the object to validate

### Uility methods

#### `validate(schemaName, data)`

Validate any schema

- `schemaName` - the name of the schema, the ".schema.json" trailer is not needed
- `data` - the object to validate

#### `schemaCount() : Number`

Useful for checking the validator initialized properly.
