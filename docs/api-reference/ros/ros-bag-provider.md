# ROSBagProvider

This is an [XVIZ Provider](/docs/api-reference/io/overview-provider.md) that uses the
[ROSBag](/docs/api-reference/ros/ros-bag.md), [ROSConfig](/docs/api-reference/ros/ros-config.js),
and [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) to provide XVIZ data from a
ROS data source.

This can be used directly or registered in the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) for integration with the
general @xviz tooling.

## Constructor

Since Providers are instantiated through the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) it requires configuration to
be passed within the `options` parameter.

Parameters:

- `root` (String) - Path to ROS Bag data files
- `options` (Object)
  - `BagClass` (Object) - Javascript Class object
  - `ros2xvizFactory` ([ROS2XVIZFactory](/docs/api-reference/ros/ros-2-xviz-factory.md)) - Factory
    to create a [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)
  - `rosConfig` (Object) - JSON data conforming to the
    [ROSConfig](/docs/api-reference/ros/ros-2-xviz-factory.md)) schema

## Methods

##### async init()

Initialize the provider and determines if this is a valid instance.

This method must be called after construction before any other method.

##### valid()

Returns: (Boolean) - True if the Provider is valid for the given arguments.

##### xvizMetadata()

Returns: the XVIZ Metadata if present

##### getMessageIterator(range, options)

Parameters:

- `range.startTime` (Number, optional) - The start time to being interation. If absent, set to the
  start of the log.
- `range.endTime` (Number, optional) - The end time to stop iteration. If absent, set to the end of
  the log.
- `options` (Object) - Implementation defined.

Returns: ([iterator](/docs/api-reference/io/xviz-provider-iterator.md)) - iterator object for
messages

##### async xvizMessage(iterator)

Parameters:

- `iterator` (Object) - An [iterator](/docs/api-reference/io/xviz-provider-iterator.md) obtained
  from the method [getMessageIterator()](#getMessageIterator)

Returns: ([XVIZData](/docs/api-reference/io/xviz-data.md)) - object or null if the iterator is
invalid
