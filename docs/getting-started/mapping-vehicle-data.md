# Mapping Vehicle information

The KITTI data provides the key fields we want all in one data source. We will be using the vehicle
information for **timestamp**, **location**, **orientation**.

Since the KITTI data is synchronized by **timestamp** it could come from anywhere, but XVIZ treats
the timestamp from the vehicle as the primary driver because the information is so criticial and
often the reference point for other elements.

We will also be using the values for **velocity** and **acceleration**. These we will send for
plotting purposes to be displayed in a graph.

## XVIZ Mapping

The following code comes from the KITTI converter file
[gps-converter.js](https://github.com/uber/xviz/tree/master/examples/converters/kitti/src/converters/gps-converter.js).

### Location

The first data we want to define for XVIZ is the [Pose](/docs/protocol-schema/core-types.md#pose).
It is the core data telling us the location of the vehicle and a common reference point for other
data.

The KITTI data stores all this information in one place and provides direct mapping to XVIZ. It also
if very precise in defining specifically what point on the vehicle this represents how it relates to
other sensors on the vehicle. Later on we will see how this is used to make sure the data is
properly transformed.

First lets define the necessary metadata, which we only have to do once.

```js
const xb = xvizMetaBuilder;
xb.stream('/vehicle_pose').category('pose');
```

We are simply defining the **stream name** and the **category**. However because pose is so
important there is a required name `/vehicle_pose`. The list of
[category values](/docs/protocol-schema/session-protocol.md#stream_metadata) can be seen in the
specification.

On every message we must define the current Pose. We use the
[XVIZBuilder](/docs/api-reference/xviz-builder.md#pose-streamid-) to create this for each message.

```js
xvizBuilder
  .pose('/vehicle_pose')
  .timestamp(pose.timestamp)
  .mapOrigin(pose.longitude, pose.latitude, pose.altitude)
  .orientation(pose.roll, pose.pitch, pose.yaw)
  .position(0, 0, 0);
```

KITTI provides all the information necessary and you can see the details of the data types in the
[XVIZBuilder](/docs/api-reference/xviz-builder.md#xvizposebuilder). The only interesting one is the
`position(0, 0, 0)`. Different systems determine how to setup reference frames, and for the KITTI
data every Pose is determined by the longitude and latitude used in `mapOrigin()`.

If the geographic location was fixed, we could use the `position()` as meter offsets from that known
location. However that is not the case here. Please see the topic on
[XVIZ Reference Frames](/docs/protocol-schema/session-protocol.md) for more details.

### Acceleration and Velocity

KITTI also defines a number of values for the vehicle. We will be sending acceleration and velocity
to demonstrate the plot UI component of XVIZ.

This is how we define the metadata for these streams.

```js
const xb = xvizMetaBuilder;
  // ...
  .stream(this.VEHICLE_ACCELERATION)
  .category('time_series')
  .type('float')
  .unit('m/s^2')

  .stream(this.VEHICLE_VELOCITY)
  .category('time_series')
  .type('float')
  .unit('m/s')
```

The constants used here represent the strings `/vehicle/acceleration` and `/vehicle/velocity`
respectively. The `type()` defines the value types of the stream and the lists of
[type values](/docs/protocol-schema/session-protocol.md#stream_metadata) can be in the
specification.

The `unit()` is a free form string to define the units that will be displayed in the UI.

The data for each message is converted as follows.

```
xvizBuilder
  .timeSeries(this.VEHICLE_VELOCITY)
  .timestamp(velocity.timestamp)
  .value(velocity['velocity-forward']);

xvizBuilder
  .timeSeries(this.VEHICLE_ACCELERATION)
  .timestamp(acceleration.timestamp)
  .value(acceleration['acceleration-forward']);
```

Using the builder we are setting the stream name with a data type
[time_series](/docs/protocol-schema/core-types.md#time-series-state-). A time_series is a single
value that changes as time changes. This is precisely what we want for instantaneous values.

Setting the value is simple, but you may wonder why we are setting the timestamp. The timing of data
is important and it may not always align directly with the driving time signal. We want to capture
the more accurate time for the data which is why we are setting the timestamp on these values at
this point.
