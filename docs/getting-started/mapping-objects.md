# Mapping Objects

KITTI provides labeled object data for some of the data sets which enable us to demonstrate how to
use the geometric primitives of XVIZ as well as delve into how styling of visual element is handled
in XVIZ.

Be aware that the labeled object data is not available for every KITTI data set.

## XVIZ Mapping

The following code comes from the KITTI converter file
[tracklets-converter.js](https://github.com/uber/xviz/tree/master/examples/converters/kitti/src/converters/tracklets-converter.js).

### Object Tracking point

KITTI Tracklet data defines the objects relative to the vehicle location at a specific timestamp.
The data includes the center location, bounds, and classification of the object. The data for the
objects derives from the lidar scanner on the vehicle and the position, relative to the GPS unit,
can be see in the KITTI [Sensor Setup](http://www.cvlibs.net/datasets/kitti/setup.php).

First we will define the metadata for the streams we are creating, taking into account the offset
from the vehicle origin.

For reference the code defines this value as `FIXTURE_TRANSFORM_POSE` which are meter offset values
from the GPU sensor to the lidar sensor.

```js
this.FIXTURE_TRANSFORM_POSE = {
  x: 0.81,
  y: -0.32,
  z: 1.73
};
```

This value is then used in defining a `pose()` transform in the stream metadata that will ensure
that the data is properly transformed relative to both the vehicle position as well as this offset
from the vehicle position origin.

```js
.stream(this.TRACKLETS_TRACKING_POINT)
  .category('primitive')
  .type('circle')
  .streamStyle({
    radius: 0.2,
    fill_color: '#FFFF00'
  })
  .pose(this.FIXTURE_TRANSFORM_POSE)
```

In this stream metadata definition also see the first use of `streamStyle()` method. This method
defines a default style definition for all stream data. Refer to the full
[Style reference](/docs/protocol-schema/style-specification.md) for the complete list of attributes
that can be set.

It is worth mentioning that styles can be defined in 3 ways. Here they are listed in order of
precedence

1. Inline object styles
2. Stream metadata style class
3. Stream metadata stream style

We will see the other styling cases shortly.

We will define the tracking points as simple circles in XVIZ

```js
xvizBuilder
  // ...
  .stream(this.TRACKLETS_TRACKING_POINT)
  .circle([tracklet.x, tracklet.y, tracklet.z])
  .id(tracklet.id);
```

This is a simple conversion using the [circle()](/docs/api-reference/xviz-builder.md) method.

This is the the first use of the [id()](/docs/api-reference/xviz-builder.md) method. For the
complete description read the [XVIZ Object Identity](/docs/protocol-schema/core-types.md)
documentation. Briefly xviz does not model objects directly, in part due to the fact that various
systems may emit data related to an object but in a separate domain. Forcing the full definition of
an object would make this a more difficult for coordinating data about an object across all sources.
XVIZ allows elements to be marked with an **id** which can be used in an XVIZ client to construct
the unified view of information attached to that id.

### Object bounds

KITTI data provides the object bounds and category labels. We use this information to visualize the
objects in the scene with appropriate styling to distinquish the categories.

First the stream metadata definitions.

```js
const xb = xvizMetaBuilder;
xb.stream(this.TRACKLETS)
  .category('primitive')
  .type('polygon')
  .streamStyle({
    extruded: true,
    wireframe: true,
    fill_color: '#00000080'
  })
  .styleClass('Car', {
    fill_color: '#7DDDD760',
    stroke_color: '#7DDDD7'
  })
  .styleClass('Cyclist', {
    fill_color: '#DA70BF60',
    stroke_color: '#DA70BF'
  })
  .styleClass('Pedestrian', {
    fill_color: '#FEC56460',
    stroke_color: '#FEC564'
  })
  .styleClass('Van', {
    fill_color: '#267E6360',
    stroke_color: '#267E63'
  })
  .styleClass('Unknown', {
    fill_color: '#D6A00060',
    stroke_color: '#D6A000'
  })
  .pose(this.FIXTURE_TRANSFORM_POSE);
```

The new element here is the use of the [styleClass()](/docs/api-reference/xviz-builder.md) method.
This enables a list of style attributes to be reference by the class name, avoiding repeating this
inline at the actual polygon creation. We can also see that the 'pose()' offset is also applied to
this stream.

Here is how the individual polygon and labels are converted to XVIZ.

```js
xvizBuilder
  .primitive(this.TRACKLETS)
  .polygon(tracklet.vertices)
  .classes([tracklet.objectType])
  .style({
    height: tracklet.height
  })
  .id(tracklet.id);
```

The [polygon()](/docs/api-reference/xviz-builder.md) is just a list of vertices.

We can see the method [classes()](/docs/api-reference/xviz-builder.md) is called, and because the
class names where aligned with the strings used in the KITTI data we simply are setting the class to
the string. Notice that the parameter to the `classes()` method is an array as it supports multiple
classes for each object. It is important to note that the class resolution order is taken from the
stream metadata, where the latter definition has highest priority.

We also see the method [style()](/docs/api-reference/xviz-builder.md) being used along with classes.
This inline styling take precendence over the others. In this case, the `height` attribute is
provided per object by KITTI which is taken advantage of here to provide a visual treatment that
matches the label height of each object in the scene.

See the [style guide](/docs/protocol-schema/style-specification.md) for the full details on styling.
