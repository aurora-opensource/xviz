## Overview

Below are the steps to visualize ROS data and how the @xviz/ros module is structured to help.

## Access to the ROS messages

The @xviz/ros module utilizes the [rosbag.js](https://github.com/cruise-automation/rosbag.js) module
in order to get access to the ROS messages. The rosbag.js module provides:

- topics and message type
- message definitions
- message data

@xviz/ros encapsulates the low-level handling of ROS data in our
[ROSBag](/docs/api-reference/ros/ros-bag.md) class. This class can be subclassed as necessary to
override and provide specific behavior as necessary.

There may be certain XVIZ metadata information, such as the map_origin, that is required in order to
visualize your data. If your data tracks the primary vehicle relative to a fixed geospatial
coordinate, then you will need to subclass the ROSBag class and override the
[\_initBag](/docs/api-reference/ros/ros-bag.md) function to provide the map_origin to the metadata
from the appropriate message.

If your primary vehicle location is tracked directly by geospatial coordinates, the you need to
configure the topic that contains the appropriate message and type to extract `/vehicle_pose`
automatically.

## Converting ROS data into XVIZ

The next step is to be able to convert ROS messages into XVIZ. This can be as simple as extracting
the necessary fields directly into an XVIZ object or a more complex extraction that pulls the
appropriate data from multiple topics into a single XVIZ object.

The @xviz/ros module provides
[ROS message converters](/docs/api-reference/ros/overview-converters.md) for common standard
messages, which will grow over time. It is easy to create a custom converter and register it for
use.

## Control of ROS message conversion

It is important to be able to control precisely the data you want to visualize. The @xviz/ros module
is designed to provide sufficient automatic extraction with minimal configuration to get started. It
also enables users to customize the conversion to take complete advantage of any ROS data regardless
of the support provided by @xviz/ros.

### The ROSConfig

First, a [ROSConfig](/docs/api-reference/ros/ros-config.md) defines the _topics_ of interest and
contains additional details such as critical topics that will provide the required XVIZ
`/vehicle_pose` and the abilty to configure how a topic will map to a
[ROS message converter](/docs/api-reference/ros/overview-converters.md).

A basic ROSConfig can be generated using the
[xvizros](/docs/api-reference/ros/tools/xvizros-tool.md) which you can then customize to configure
for your data. If a ROSConfig is not provided, the default behavior will be to map all topics to a
converter based on the message type. If there is no converter that matches the message type then
that topic is ignored.

The automatic mapping is limited as there are choices that cannot be automatically determined by the
message type alone. Specifically the topic used to generate the `/vehicle_pose` stream can often not
be automatically determined as there may be multiple candidate topics with an appropriate message
type.

There will be times when you want to handle a topic explicitly, not based on the message type. The
configuration allows you to control which converter class is used, either by overriding the message
type or by specifying the **converter** property directly. The details of this mapping are covered
in the [ROSConfig.md](/docs/api-reference/ros/ros-config.md).

### How the ROSConfig & ROS Converters work together

We have defined the [Converters](/docs/api-reference/ros/overview-converters.md) and a seperate
[ROSConfig](/docs/api-reference/ros/ros-config.md) which are combined in the
[ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) class to manage the conversion
process.

The _ROS2XVIZConverter_ class will create the converters based on the configuration and then will
run the converters with the set of topics collected.

The _ROS2XVIZConverter_ instance must be passed to the ROSBag. There are two ways this is
accomplished. The first is if you are using the ROSBag directly, which you would do if you are
working with a single ROSConfig across all your data.

In this example, we are using the [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md).
This means we delegate the determination of which Provider supports a particular request to the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md). In order for the Factory to
support our custom classes we have to register our ROSBagProvider with the factory and pass along
the arguments ROSConfig, ROS2XVIZFactory, and our custom ROSBag,if necessary. This can be seen in
our
[ROS example](https://github.com/uber/xviz/tree/master/examples/converters/ros/common/setup-custom-provider.js).

The code looks like the following:

```
function setupCustomProvider(rosConfig, options) {

  // Custom Converters should be added here
  const ros2xvizFactory = new ROS2XVIZFactory([
    SensorImage,
    SensorNavSatFix,
    SensorPointCloud2
  ]);

  const rosbagProviderConfig = {
    ...options,
    rosConfig,
    BagClass: KittiBag,
    ros2xvizFactory
  };
  XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);
}
```

## Creating your own tools to convert ROS to XVIZ

In order to simplify the ROS to XVIZ tooling for custom converters the @xviz/ros module exposes two
utility classes. We provide the [ConvertMain](/docs/api-reference/ros/convert-main.md) class to
build a command-line tool for off-line conversion. The
[ServerMain](/docs/api-reference/ros/xviz-server-main.md) is provided for runtime conversion.

The _ConvertMain_ functions using the singleton XVIZProviderFactory. All that a user needs to do is
register the [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md) before executing the
command to ensure it is registered when needed. You can see this in our example code in the file
[custom-convert.js](https://github.com/uber/xviz/tree/master/examples/converters/ros/common/setup-custom-provider.js)

The _ServerMain_ also utilizes the singleton XVIZProviderFactory, but in the server case we can
subclass and override the [setupProviders()](...) function to register our
[ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md). This can be seen in the file
[custom-server.js](https://github.com/uber/xviz/tree/master/examples/converters/ros/common/setup-custom-provider.js)

These utility classes make it easy to build a set of tools for your specific data.
