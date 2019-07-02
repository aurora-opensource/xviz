# ROS2XVIZFactory

The ROS2XVIZFactory is used to instantiate an instance of the
[ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md).

## Example

```js
import {ROSBagProvider, ROS2XVIZFactory, DEFAULT_CONVERTERS} from '@xviz/ros';

// Construct a factory instance with the default set of converters
const ros2xvizFactory = new ROS2XVIZFactory(DEFAULT_CONVERTERS);

// Store the instance in a config which is passed to the ROSBagProvider when instantiated
const rosbagProviderConfig = {
  ros2xvizFactory
  // ... other properties
};

// Register the Provider
XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);
```

## Constructor

An array of [Converters](/docs/api-reference/ros/overview-converters.md) is provided that will be
used when a new instance is created by this factory.

Parameters:

- `converters` (Array) - Array of [Converters](/docs/api-reference/ros/overview-converters.md)

## Methods

##### create(mapping, options)

Constructs a [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) with the stored
converters.

Parameters:

- `mapping` (Object) - The topic to converter mapping from the
  [ROSConfig](/docs/api-reference/ros/ros-config.md)
- `options` (Object) - Option that will be passed to the
  [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)

Returns: ([ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)) - Instance to
convert a set of ROSj
