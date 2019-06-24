- Start Date: 2019-06-11
- RFC PR: [#482](https://github.com/uber/xviz/pull/482)

# Summary

**@xviz/ros** will provided support for converting ROS messages into XVIZ.

![@xviz/ros diagram](../docs/api-reference/ros/images/xviz-ros-block-diagram.svg)

This module will support the following:

 - Reading ROS Bag files
 - A configuration based conversion workflow
 - Custom message conversion
 - Off-line conversion
 - Run-time conversion

The focus will be on ROS 1, but most if not all of this translates to ROS 2 as well.

# Motivation

ROS is ubiquitous and an industry standard. AVS has a goal to progress the visualization
ecosystem for autonomous systems support which makes ROS support a requirement to truely
deliver on our goal.

# Detailed Design

## Overview

The @xviz/ros module is ultimately striving for an automatic data-driven conversion flow.

The goal would be to build tooling that can construct a configuration to power the
conversion without any additional code being written. With that as a goal, we have designed
this module around the following abilities:

 - a simple mapping of a topic to a converter
 - automatically generate the mapping using the topic message type
 - a converter registry with support for built-in and custom converters
 - simultaneously support multiple conversion configurations

While we cannot deliver completely on our goal in the initial MVP, the structure provides
for the ability to do so as we increase our ROS message support.

## Support flow

Below are descriptions, with increasing complexity, on how this module is envisioned to be used.

### Automatic

Assuming we have ROS data that works with our default converters. Use the
[xvizros](/docs/api-reference/ros/tools/xvizros-tool.md) **convert** command line tool to convert ROS to XVIZ
 and view in streetscape.gl

This is very limiting, due to the fact that we map every message with a supported type which
may be more data than necessary. This can make conversion slow or it may not expose specific
fields or custom messages.

Ideally this would provide sufficient validation that the system is working and a starting
point for moving onto the next phase.

### User Configuration

We have ROS data but it requires defining a [ROSConfig](/docs/api-reference/ros/ros-config.md) using [xvizros config](/docs/api-reference/ros/tools/xvizros-tool.md)
to generate a basic configuration, then configure the topics and mapping.

Some options available in the configuration are alternative XVIZ Stream names for the viewing
application, styling, or parameters for the converter.

An example could be adding a chart for a specific metric or controlling which camera or other
sensors are extracted rather than extracting everything that matches.

### User Customization

Custom converters are required possibly due to custom topics, coordination across topics, or performance reasons.

Custom converters are registered with the [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) and they work with the [ROSConfig](/docs/api-reference/ros/ros-config.md)
if necessary to provide total control for conversion.

### Multiple ROS configuration support

Most platforms have a standard structure to their topics and custom types. Once configured that configuration
is likely all that is needed for that platform.

There are a few use-cases where the need to support multiple platforms or configurations may arise.

1. If you are a middleware vendor, then you are subject to the topics and messages of your customers.
2. If there are performance issues, you can explore alternative implementations.

This capability is supported by:

1. Defining a [ROSBag](/docs/api-reference/ros/ros-bag.md) subclass that can properly validate that a bag contains the expected topics.
2. Building and registering the Converters with the [ROS2XVIZFactory](/docs/api-reference/ros/ros-2-xviz-factory.md), registering
the [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md) along with the parameters with the [XVIZFactoryProvider](/docs/api-reference/io/xviz-factory-provider.md).

The [XVIZFactoryProvider](/docs/api-reference/io/xviz-factory-provider.md) will sequentially test each Provider until one is found
that supports the request.

# Classes

Below is details on the Classes and Concepts in this module.

## Converters

Converters handle the actual extraction of data from ROS message and building the of the
XVIZ messages. They inherit from [Converter](/docs/api-reference/ros/overview-converter.md) base class and provide the following behavior.

1. Identify themselves for explicit configuration overriding the ROS message type
2. Declaration of the primary ROS message type used to automatically map to topics
3. Generate XVIZ metadata
4. Convert messages

## ROS2XVIZConverter

[ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) is where converters are registered and it will run the conversion by passing
the set of topics message to each converter.

## ROS2XVIZFactory

This [ROS2XVIZFactor](/docs/api-reference/ros/ros-2-xviz-factory.md) serves as a store for later creation of the [ROS2XVIZConverter](/docs/api-reference/ros/ros-2-xviz-converter.md) instance.

In order to integrate with the @xviz eco-sytem we must supply a [Provider](/docs/api-reference/io/overview-provider.md). This enables
us to register multiple Providers each with a different configuration which allows us to support
ROS data with *multiple* configurations.

However, this support requires that we instantiate objects later in the flow and necessitates the need for this
[ROS2XVIZFactory](/docs/api-reference/ros/ros-2-xviz-factory.md). The factory will be passed through to the [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md) when the [XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) is
searching for a Provider to support a particular request.

## ROSConfig

The [ROSConfig](/docs/api-reference/ros/ros-config.md) is a simple data mapping that provides the topics to be read and the ability to control
the mapping of a topic to a converter.

## ROSBag

This [ROSBag](/docs/api-reference/ros/ros-bag.md) provides access to the ROS data. It provides access to the topics, message types, and messages. It is used by
the the [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md).

One critical aspect to the ROSBag is the [init()](/docs/api-reference/ros/ros-bag.md) which determines if a particular bag
can be supported. As platforms can choose arbitrary topics and create custom messages, it is useful to
validate the presence of a particular topic to validate support. Users can subclass the ROSBag and
override the [\_initBag](/docs/api-reference/ros/ros-bag.md) function to perform this validation.

The [ROSBag](/docs/api-reference/ros/ros-bag.md) also provides the method [getMetadata()](/docs/api-reference/ros/ros-bag.md) useful to augment the metadata generated.

## ROSBagProvider

The [ROSBagProvider](/docs/api-reference/ros/ros-bag-provider.md) is the high-level object to actually access the generated XVIZ data.

## Future Plans

### Example of ROS Bridge connection to a live system

While this falls outside of XVIZ proper, an example and curated list of resources and guides
would make adoption much easier.

### Expand message support

Message support currently is limited to some key common messages, but even then
it can be limited to the data that was available to test and validate with.  We would
would need to expand both the messages and increase the support for the current messages.

Supporting new messages is straight forward and can be improved with more examples and
we can encourage external contribution.

# Expand the configuration scope

By expanding the ROSConfig we can do more with configuration-based workflows.

We can increase the scope of what can be configured, which was intentionally focused on
the core conversion flow for this MVP.

# Provide generic mappings

We can parametersize converters and create generic instances
to extract and map data to XVIZ types. This can allow us to create mappings down to the the
ROS Message field level.

There is a balance to be struck in that increasing the customization can make an automatic
workflow more complex. We must aim to keep getting started with ROS data as simple as possible.

# ROS2 Support

ROS2 still sends messages, so an appropriate replacement for [rosbag.js](https://github.com/cruise-automation/rosbag.js)
that supports ROS2 data should allow the rest of this module to work.
