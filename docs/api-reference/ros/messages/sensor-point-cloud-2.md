# SensorPointCloud2

[sensor_msgs/PointCloud2](http://docs.ros.org/api/sensor_msgs/html/msg/PointCloud2.html)

This converter uses the message to define an XVIZ points primitive.

## Options

- `frameId` (String) - (default: 'velodyne') Sets the frame for the data

## Metadata

Defines the XVIZ Stream with the category 'primitive' with type 'points'.

## Remarks

The `frameId` data is available in the message itself as `header.frame_id`. However we avoid looking
at the message when generating the metadata therefore we need it ahead of time.
