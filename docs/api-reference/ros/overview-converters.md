# ROS Converters

These are the classes that process the ROS messages and create XVIZ data.

These classes should derive from the base class `Converter` and must provide the properties `name`
and `messageType` which are used when mapping a ROS message type to a Converter.

For each Topic a Converter is constructed that will handled the messages for that topic.

## Interface

### Properties

##### name

Type: (String) - Name of this converter used to explicitly map a topic in the
[ROSConfig](/docs/api-reference/ros/ros-config.md)

##### messageType

Type: (String) - Name of the ROS message type this converter handles

### Constructor

Parameters:

- `config.topic` (String) - Name of the topic to read
- `config.xvizStream` (String, optional) - Name of the XVIZ Stream to create. If undefined set to
  the `config.topic`

### Methods

##### async convertMessage(frame, xvizBuilder)

Processes ROS messages in the `frame` to create XVIZ data

Parameters:

- `frame` (Object) - The keys to this object are the _topic_ names which map to an array of messages
- `xvizBuilder` ([XVIZBuilder](/docs/api-reference/xviz-builder.md))

##### getMetadata(metadataBuilder)

Generates the XVIZ Stream metadata for any streams produced.

Parameters:

- `metadataBuilder` ([XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md))
