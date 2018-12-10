# XVIZValidator

`XVIZValidator` class lets you check the XVIZ objects conform to the specification.

## Constructor

Automatically loads schema data.

## Methods

All validation methods throw if the object fails to validate.

### Validate high level objects

##### validateMetadata(data)

Validate `metadata` information.

Parameters: 

- `data` (Object)


##### validateStateUpdate(data)

Validate `state_update` message.

Parameters: 

- `data` (Object)

### Validate core object

##### validateStreamSet(data : Object)

Validate `stream_set` type.

### Validate base types

##### validatePose(data)

Validate `pose` object.

Parameters: 

- `data` (Object)


##### validatePrimitive(type, data)

Validate the different primitive types.

Parameters: 

- `type` (String) - the type of the variable, like "point" or "circle", see spec
- `data` (Object) - the object to validate

##### validateTimeSeries(data : Object)

Parameters: 

- `data` (Object)

##### validateFutureInstances(data : Object)

Parameters: 

- `data` (Object)

##### validateVariable(data : Object)

Parameters: 

- `data` (Object)

##### validateAnnotation(type, data)

Validation the different annotation types.

Parameters: 

- `type` (String) - the type of the variable, only "visual" is currently valid
- `data` (Object) - the object to validate

### Utility methods

##### validate(schemaName, data)

Validate any schema

Parameters: 

- `schemaName` (String) - the name of the schema, the ".schema.json" trailer is not needed
- `data` (Object) - the object to validate

##### schemaCount() 

Useful for checking the validator initialized properly.

Returns: schema count (Number)

