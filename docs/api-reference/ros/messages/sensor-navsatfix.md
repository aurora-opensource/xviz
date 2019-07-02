# SensorNavSatFix

[sensor_msgs/NavSatFix](http://docs.ros.org/api/sensor_msgs/html/msg/NavSatFix.html)

This converter uses the message fields for geospatial location to define an XVIZ Pose.

## Options

- `imuTopic` (String) - The topic with the type **sensor_msgs/Imu** which is used to obtain the
  orientation for the pose

## Metadata

Defines the XVIZ Stream with the category 'pose'.

## Remarks

The topic passed in the **imuTopic** config must also be included in the
[ROSConfig](/docs/api-reference/ros/ros-config.md) mapping to ensure that topic data is included
when converter.
