# ROSBag

This provides validation that the ROS Bag can be supported by the implementation of this class.

This class is intented to be subclassed to allow for platform specific ROS support that can be
tailored to specific messages or topics.

## Constructor

Parameters:

- `bagPath` (String) - Path to the bag file
- `topicConfig` (Object) - [ROSConfig](/docs/api-reference/ros/ros-config.md) data

## State

Internal state available to subclasses

- `this.bagContext` (Object) - State collected about the ROS bag that is passed to Converters when
  they are constructed

## Methods

##### init(ros2xviz)

Initialize this instance and determine if the provided data is a valid source.

Parameters:

- `ros2xviz` ([ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)) - Instance for
  dealing with ROS message types and the Converters

##### \_initBag(bag)

Collects general information about the bag useful for Converters. Specifically this collects start
and end times for the Bag. It also collects the transforms

Parameters:

- `bag` (Bag) - instance of a [rosbag.js](https://github.com/cruise-automation/rosbag.js) instance.

Provides:

- `this.bagContext.start_time` (Number) - Start time for the Bag
- `this.bagContext.end_time` (Number) - End time for the Bag
- `this.bagContext.frameIdToPoseMap` (Object) - Named matrices containing the translation and
  rotation used by ROS messages

##### getMetadata(metadataBuilder, ros2xviz)

Collects the XVIZ metadata based on the ROS bag and configured Converters

Parameters:

- `metadataBuilder` ([XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md)) - Instance
  used to construct the metadata
- `ros2xviz` ([ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)) - The
  instantiated converters per topic which are used to generate XVIZ Stream metadata

##### readMessages(start, end)

Collect the topic messages covering the range `start` to `end` for all the topics in the
configuration.

Parameters:

- `start` (Number) - Start time from which to process the configured topic messages
- `end` (Number) - End time for the time range to process

Returns: (Object) - Key for topics mapping to an array of message collected
