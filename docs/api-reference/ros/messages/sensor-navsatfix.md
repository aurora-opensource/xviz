# SensorNavSatFix

[sensor_msg/NavSatFix](http://docs.ros.org/api/sensor_msgs/html/msg/NavSatFix.html)

This converter uses the message field `poses` to define a polyline. This conversion sets the `z` of
the position to 0.

## Options

- `imuTopic` (String) - Defines an IMU sensor message to access the orientation.

## Metadata

Defines the XVIZ Stream with the category 'pose'.

## Remarks

This message defines position geospatially but only the position. The optional 'imuTopic' is used to
provide the orientation.

The [ROSConfig](/docs/api-reference/ros/ros-config.md) must assign a mapping for this message type
to the xvizStream `/vehicle_pose`.
