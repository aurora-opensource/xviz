# registerROSBagProvider(rosConfig, options)

This is a convenience function that will register a
[ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md) with the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) using the supplied arguments.

Parameters:

- `rosConfig` (Object) - [ROSConfig](/docs/api-reference/ros/ros-config.js) schema object.
- `options` (Object) -
  - `converters` (Array) - Array of converter classes to register for this ROSBagProvider
  - `BagClass` (Object) - Javascript Class object used to read bag files. Derived from
    [ROSBag](/docs/api-reference/ros/ros-bag.md. to create a
    [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md)
