# XVIZFakePose

The XVIZ message currently requires a `/vehicle_pose` XVIZ stream. This stream is the basis for
[VEHICLE_RELATIVE](docs/protocol-schema/session-protocol.md) data as well as a source for the
**timestamp** the data in a [state_update message](/docs/protocol-schema/session-protocol.md)
represents.

We plan to change this requirement, but for now we can satisfy it with this converter.

This converter will create a **pose** stream and populate it based on the topic it is configured. It
only uses the topic to access the timestamp of the message.

## Options

- `position` (Array) - Defines a static position `[x, y, z]` output in every message. (default: [0,
  0, 0])

## Metadata

Defines the XVIZ Stream with the category 'pose'.

## Remarks

This converter exists to simplify the initial steps of getting ROS bag data to display.

This is best described in our
[ROS example](https://github.com/uber/xviz/tree/master/examples/converters/ros/README.md).
