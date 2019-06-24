# GeometryPoseStamped

[geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html)

This converter uses the message field `pose` to define an XVIZ Pose.

If the ROSBag implementation is able to provide an `origin` in the `bagContext` then this converter
will use that as the `mapOrigin` on the XVIZPose stream.

## Options

- `origin` (Object) - Defines geospatial `mapOrigin` used for the relative position extracted from
  the ROS message.

## Metadata

Defines the XVIZ Stream with the category 'pose'.

## Remarks

Normally the [ROSConfig](/docs/api-reference/ros/ros-config.md) would assign a mapping for this
message type to the xvizStream `/vehicle_pose`.

You can see this in the
[ROS example project](https://github.com/uber/xviz/blob/master/examples/converters/ros/kitti.json).
