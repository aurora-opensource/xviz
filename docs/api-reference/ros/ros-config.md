# ROSConfig

The ROSConfig is a class that wraps a JSON configuration used to map ROS topics to the appropriate
XVIZ Converter.

The default behavior is for topics to be mapped by the message type. If the message type is not
included in the configuration then it will need to be determined by scanning the ROS bag file, which
may take a few seconds.

A basic JSON configuration file can be generated using the
[xvizros](/docs/api-reference/ros/tools/xvizros-tool.md)

## Schema

Data schema for a configuration to drive ROS to XVIZ conversion.

- `topicConfig` (Array) - Mapping of ROS Topic to XVIZ Converter
  - `topic` (String) - Name of the ROS Topic
  - `type` (String, optional) - ROS Message Type
  - `converter` (String, optional) - Name of Converter class for explicit mapping
  - `config` (Object) - Configuration object passed to Converter
    - `xvizStream` (String, optional) - XVIZ Stream name

The priority for selecting a Converter for a topic is as follows:

1. converter property
2. type property
3. automatic message type determination

If the **xvizStream** is missing, then the **topic** will be used.

## Example

```js
{
  "topicConfig": [
    {
      "topic": "/kitti/oxts/gps/fix",
      "type": "sensor_msgs/NavSatFix",
      "config": {
        "xvizStream": "/vehicle_pose",
        "imuTopic": "/kitti/oxts/imu"
      }
    },
    {
      "topic": "/kitti/camera_color_left/image_raw",
      "converter": "SensorCompressedImage",
      "config": {
        "xvizStream": "/vehicle/camera/center_front"
      }
    }
  ]
}
```

## Constructor

- `rosConfig` (Object) - JSON configuration described above

## Properties

##### topics

Type: (Array) - List of all the topics in the configuration

##### topicConfig

Type: (Object) - The object passed to the constructor

##### entryCount

Type: (Number) - The number of topic mappings in the configuration

## Methods

##### needsTopicTypes()

Returns: (Boolean) - `true` if the all the topic entries have the required type or converter
information to avoid scanning the ROS bag.
