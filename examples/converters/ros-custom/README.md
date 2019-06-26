# ROS to XVIZ Custom Example

In order to support ROS data beyond the basic users need the ability to extend and customize how ROS
data is mapped into XVIZ.

Examples of this include:

- Custom messages with message types we do not yet support
- ROS data spread out across multiple topics
- To create a fixed application with your UI & Configuration built-in

To ensure using ROS data is as easy as possible we demonstrate how to create a custom off-line
conversion tool and a custom XVIZ Server that is configured to handle your specific data.

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

## Running the server

The following commands will ensure all modules are built, and then start the custom server that adds
support for the custom ROS Bag processing.

```
xviz$ yarn bootstrap
xviz$ cd examples/converters/ros

xviz/examples/converters/ros$ yarn
xviz/examples/converters/ros$ node server-main.js -d ../../../data/kitti --rosConfig kitti.json
```

You should see `xvizserver-log: Listening on port 3000`

Next, the test viewer in streetscape.gl will be used to see the results.

In the streetscape.gl repo

```
streetscape.gl$ yarn bootstrap
streetscape.gl$ cd test/apps/viewer
streetscape.gl/test/apps/viewer$ yarn
streetscape.gl/test/apps/viewer$ yarn start-streaming-local
```

Navigate to the url and use the filename of the bag file as the path in the URL. Assuming the file
`kitti_2011_09_26_drive_0005_synced.bag`, then go to
http://localhost:8080/kitti_2011_09_26_drive_0005_synced

## Running the conversion cli

Converting ROS data at runtime may not always be performant enough to be a viable option. Offline
conversion is also supported.

Using the same KITTI bag file we can convert the ROS bag and save the XVIZ data to files.

```
xviz/examples/converters/ros$ node cli-main.js -d ../../../data/kitti/ros-xviz --rosConfig kitti.json ../../../data/kitti/kitti_2011_09_26_drive_0005_synced.bag
```
