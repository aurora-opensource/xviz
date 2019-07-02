# ROS2XVIZConverter

This object manages the [Converters](/docs/api-reference/ros/overview-converters.md) and applying
them to get XVIZ metadata and messages

## Constructor

Parameters:

- `converters` (Array) - The [Converters](/docs/api-reference/ros/overview-converters.md) used to
  match and convert messages
- `mapping` (Object) - The [ROSConfig](/docs/api-reference/ros/ros-config.md) mapping and config for
  topics
- `options.logger` (Object) - Logging support

## Methods

##### initializeConverters(topicMessageTypes, aux)

Parameters:

- `topicMesssageTypes` (Array) - Array of `{topic, type}` used when mapping a topic to a converter
- `aux` (Object) - Auxilary data for conversion initialization used by Converters

##### buildMetadata(metadataBuilder, context)

Builds XVIZMetadata from all the created converter

Parameters:

- `metadataBuilder` ([XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md)) - Array of
  `{topic, type}` used when mapping a topic to a converter
- `aux` (Object) - Auxilary data for conversion initialization used by Converters

##### async buildMessage(frame)

Build an XVIZ Message based on the created converters and the state in the given `frame`

Parameters:

- `frame` (Object) -(/docs/api-reference/xviz-metadata-builder.md)) - Array of `{topic, type}` used
  when mapping a topic to a converter

Returns: (Object)- XVIZ Message
