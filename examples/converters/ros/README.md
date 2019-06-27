# Basic ROS Example

This example shows how to use the **@xviz/ros** module to view ROS Bag data.

This example will walk you through the basics and setup an XVIZ Server that you can connect to with
a viewing application.

{ "topicConfig": [ { "topic": "/points_raw", "converter": "XVIZFakePose", "config": { "xvizStream":
"/vehicle_pose" } }, { "topic": "/points_raw", "type": "sensor_msgs/PointCloud2" } ] }

## Convert KITTI data to a ROS Bag

To align with our @xviz/builder example we take advanage of the same KITTI data set and use the
tools from https://github.com/tomas789/kitti2bag to convert the KITTI data into a ROS Bag.

If you have support for docker, the following should work with the KITTI data used in our default
example.

```
xviz$ docker run -v `pwd`/data/kitti:/data -it tomas789/kitti2bag -t 2011_09_26 -r 0005 raw_synced
```

This should place the bag file at `data/kitti/kitti_2011_09_26_drive_0005_synced.bag`

Note that the KITTI to ROS Bag conversion only supports pose, point cloud, and camera images.
