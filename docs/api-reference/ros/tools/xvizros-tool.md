# xvizros Tool

The `xvizros` tool is provided to help you understand the data inside the ROS Bag and create a
[ROSConfig](/docs/api-reference/ros/ros-config.md) for to aid converting the ROS data to XVIZ.

## Running the tool

If you have build the modules, then you can run the tool directly.
`./modules/ros/bin/xvizros bagdump --dumpTopics sample.bag`

It can be useful to run the tool against the modules directly instead of the built modules.
`./modules/ros/bin/babel-xvizros bagdump --dumpTopics sample.bag`

## Commands

To see the details on the available commands and options run `./modules/ros/bin/babel-xvizros -h`

#### bagdump

Displays information about the Bag such as time range the bag covers, topics, message types, and
message definitions.

Options:

- `--dumpTime` - Show the start and end time of the Bag
- `--dumpTopics` - List all the topics in the Bag
- `--dumpDefs` - Show the message definition of each topic
- `--dumpMessages` - Dump the messages
- `--topic, -t <topicName>` - limit

Example:

```
./modules/ros/bin/xvizros bagdump --dumpTopics data/kitti/kitti_2011_09_26_drive_0005_synced.bag
```

#### convert

Converts the ROS bag and writes the XVIZ files to the provided output directory.

Options:

- `--rosConfig <filename.json>` - Show the start and end time of the Bag
- `--start, -s <time>` - Starting timestamp to begin conversion
- `--end, -e <time>` - Ending timestamp to stop conversion
- `--dir, -d <path>` - Directory where to save XVIZ data

Example:

```
./modules/ros/bin/babel-xvizros convert data/kitti/kitti_2011_09_26_drive_0005_synced.bag -d data/kitti/ --rosConfig examples/converter/ros/kitti.json
```

#### config

Dumps a basic [ROSConfig](/docs/api-reference/ros/ros-config.md) to stdout.

Example:

```
./modules/ros/bin/babel-xvizros config data/kitti/kitti_2011_09_26_drive_0005_synced.bag > kitti-config.json
```
