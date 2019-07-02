# Custom ROS Converter Example

This example shows how to add custom Converts for handling ROS to XVIZ using the **@xviz/ros**
module.

In order to support ROS data beyond the basic users need the ability to extend and customize how ROS
data is mapped into XVIZ.

This example includes:

- Creating a custom Converter and adding it for use in conversion
- Subclassing the ROSBag to add metadata for UI controls
- Creating tools to serve and convert with the custom converter

## Setup

Follow the [Setup from the Basic ROS Example](../ros-custom).

## Step 1: Creating a custom Converter and adding it for use in conversion

A [Converter](../../../docs/api-reference/ros/overview-converters.md) follows a minimal interface
and provides **metadata** and **XVIZ data**. A custom converter should subclass from this base
class.

In the basic example we used the the IMU data for orientation. This time we will add a custom
Converter for that topic and extract out a **time_series** metric that we will use to plot in a
chart.

#### Custom Converter metadata

The code below are excerpts from the [imu-converter.js](./messages/imu-converter.js)

First, we define the metadata for XVIZ using the passed in
[builder](../../../docs/api-reference/xviz-metadata-builder.md). The converer

```
  getMetadata(xvizMetaBuilder) {
    // You can see the type of metadata we allow to define.
    // This helps validate data consistency and has automatic
    // behavior tied to the viewer.
    xvizMetaBuilder
      .stream(this.xvizStream)
      .category('time_series')
      .type('float')
      .unit('m/s^2');
  }
```

This simply defines the stream **this.xvizStream** which is setup automatically by the base class.
The rest simply names the XVIZ stream, and attributes related to that stream.

#### Custom Converter ROS message handling

Here we access the ROS Message data and turn it into XVIZ data. ROS message types are defined online
and the Javascript library used to read them matches the same structure.

Alternatlively, you can use the [xvizros](../../../docs/api-reference/ros/tools/xvizros-tool.md) to
dump out a ROS message by topic to inspect the structure and data.

Below we can see the definition for the **convertMessage** function that extracts the linear
velocity from the IMU message.

```
  async convertMessage(frame, xvizBuilder) {
    const data = frame[this.topic];
    if (!data) {
      return;
    }

    const {timestamp, message} = data[data.length - 1];
    const {
      linear_acceleration: {x, y, z}
    } = message;
    const accel = Math.sqrt(x * x + y * y + z * z);

    xvizBuilder
      .timeSeries(this.xvizStream)
      .timestamp(TimeUtil.toDate(timestamp).getTime() / 1e3) // seconds
      .value(accel);
  }
```

Note that the function receives an array of data for each topic. This is because when we process the
data, there is a **time step** for which we cover ROS messages. Every message within that timestep
is provided in the array. For this converter we will just register the last sample in XVIZ.

It is also important to note the `.timestamp()` call. ROS time data uses the conversion utility to
convert time to Javascript objects. Here we are getting the time then scaling to be in the units of
seconds.

#### Final finishes for on the converter implementation

The above covers the main functional components of writing a converter. The rest are related to how
Converters are able to be automatically mapped by the message type or accessed directly by name in
the [ROSConfig](../../..//docs/api-reference/ros/ros-config.md)

This is simple, we just expose two strings that identify the message type and name of this
converter. The [ROS2XVIZConverter](../../../docs/api-reference/ros/ros-2-xviz-converter.md), which
we will cover below, uses these function to perform the mapping.

```
  static get name() {
    return 'SensorImu';
  }

  static get messageType() {
    return 'sensor_msgs/Imu';
  }
```

## Step 2: Subclassing the ROSBag to add metadata for UI controls

The [ROSBag](../../../docs/api-reference/ros/ros-bag.md) class manages control to the ROS data. For
this example we will just cover hooking into accessing metadata and adding UI configuration to
display the camera images.

The code excerpts below are from [main.js](./main.js)

For the metadata we override the **getMetadata()** function, then we call the super class
implementation before we add our own.

We are using the [XVIZUIBuilder](../../../docs/api-reference/xviz-ui-builder.md) to construct our
panels then add it to the metadata builder.

```
export class KittiBag extends ROSBag {
  constructor(bagPath, rosConfig) {
    super(bagPath, rosConfig);
  }

  getMetadata(builder, ros2xviz) {
    super.getMetadata(builder, ros2xviz);

    const LEFT = '/kitti/camera_color_left/image_raw';
    const RIGHT = '/kitti/camera_color_right/image_raw';

    const ui = new XVIZUIBuilder({});

    const cam_panel = ui.panel({
      name: 'Camera'
    });

    const video = ui.video({
      cameras: [LEFT, RIGHT]
    });

    cam_panel.child(video);

    const chart_panel = ui.panel({
      name: 'Charts'
    });

    const metric = ui.metric({
      streams: ["/vehicle/acceleration"],
      title: "Acceleration",
      description: "The acceleration of the vehicle"
    });

    chart_panel.child(metric);

    ui.child(cam_panel);
    ui.child(chart_panel);

    builder.ui(ui);
  }
}
```

Note the **ui.metric()** call specifies the stream `/vehicle/acceleration`. You will see this name
is in the [kitti.json](./kitti.json) configuration.

This is because the custom HUD component in streetscape.gl expects a stream with this name to exist
and the values will be mapped to that UI gauge. This is in addition to the chart we are defining
here.

## Step 3: Creating tools to serve and convert with the custom converter

The last step has two parts. First since we are adding our custom converters we have to register
them to make them available. We also need to register our ROSBag subclass to be used as well.

Last we will use the provided command-line utilities to provide server and conversion functionality
but using the custom changes we made.

The code excerpts below are from [main.js](./main.js)

#### Registering converters

Registering is facilitated by the
[registerROSBagProvider](../../../docs/api-reference/ros/register-ros-bag-provider.md) function. As
Javascript is a dynamic language, we are able to pass the classes by name to a factory singleton and
they will be constructed as necessary at a later time.

Here is what this looks like in code.

```
import {
  convertArgs,
  ROSBag,
  registerROSBagProvider,

  // Converters
  SensorImage,
  SensorNavSatFix,
  SensorPointCloud2
} from '@xviz/ros';

function setupROSProvider(args) {
  if (args.rosConfig) {
    const converters = [SensorImage, SensorNavSatFix, SensorPointCloud2, SensorImu];

    registerROSBagProvider(args.rosConfig, {converters, BagClass: KittiBag});
  }
}
```

The **args.rosConfig** is just the command-line option which is parsed by the **yargs** module we
are using. The rest of the code is simply importing the classes and passing them to the registering
function. Pay attention to how our custom ROSBag implemenation is being passed.

#### Using the predefined commands

The module **@xviz/ros** allows extension, which means Javascript code must be written. We strive to
minimize boilerplate necessary to customize the tools, therefore we provide command line utilities
that can be used to reduce what is required to leverage any custom code written.

The custom pieces are registered with the factory singleton before executing any commands providing
a minimal ammount of leverage the tooling we have already built.

We are using the **yargs** module and pass that to the functions to register the commands. Then we
setup a **middleware** in yargs to first run **setupROSProvider** which allows our custom
registration to run before any command is executed, so it can take advantage of the command line
options, specifically the `--rosConfig config.json` which was covered in the [basic example](../ros)

```
import {serverArgs} from '@xviz/server';
import {convertArgs} from '@xviz/ros';

function main() {
  const yargs = require('yargs');

  let args = yargs.alias('h', 'help');

  args = convertArgs(args);
  args = serverArgs(args);

  // This will parse and execute the server command
  args.middleware(setupROSProvider).parse();
}

main();
```

## Running the commands

Assuming you are already in this directory, we can see what commands are available. You can inspect
the file [kitti.json](./kitti.json) which has a few additional topics added to include the camera
image data.

First we can see what commands are available

```
$ node index.js help
```

Next, use this example to serve XVIZ data. The difference from the other example should be the UI
Panel has camera data and a chart.

#### Run the server command

```
$ node index.js server -d ../../../data/kitti --rosConfig kitti.json
```

Once that is started, open up http://localhost:8080/kitti_2011_09_26_drive_0005_synced

#### Run the convert command

Converting ROS data at runtime may not be performant enough to be a viable option. The convert
command allows you to perform the conversion to XVIZ and save the result to files.

This will run the conversion:

```
$ node index.js convert --rosConfig kitti.json -d ../../../data/kitti/custom-example ../../../data/kitti/kitti_2011_09_26_drive_0005_synced.bag
```

This can then be served with this command:

```
$ node index.js server -d ../../../data/kitti/custom-example
```
