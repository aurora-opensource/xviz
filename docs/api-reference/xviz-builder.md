# XVIZBuilder

The `XVIZBuilder` class provides convenient chaining functions to format data for the xviz protocol.

## Example

```js
import {XVIZBuilder} from '@xviz/builder';

const xvizBuilder = new XVIZBuilder({
  metadata: {} // See XVIZMetadataBuilder for generating metadata object
});

xvizBuilder
  .pose({
    time: 123,
    latitude: 12.345,
    longitude: 12.345,
    altitude: 12.345,
    roll: 0.123,
    pitch: 0.123,
    yaw: 0.123
  })

  .variable('/velocity')
  .timestamp(123)
  .value(1.23)

  .primitive('/point-cloud')
  .points(new Float32Array([1.23, 0.45, 0.06]))
  .timestamp(123)
  .style({
    fill_color: [0, 0, 0, 255]
  })

  .primitive('/pedestrian-1-trajectory')
  .polygon([[1.23, 0.45, 0.06], [2.45, 0.67, 0.08], [1.67, 0.53, 0.07], [1.23, 0.45, 0.06]])
  .timestamp(123);

const frame = xvizBuider.getFrame();
console.log(frame);
```

## XVIZBuilder

### Constructor

```js
import {XVIZBuilder} from '@xviz/builder';
const xvizBuilder = new XVIZBuilder(options);
```

Parameters:

- **options.metadata** (Object) - a JSON object that is the metadata of the session. See
  [XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md) for generating metadata
  objects.
- **options.disableStreams** (Array) - a list of stream names to disable. Disabled streams are not
  flushed to frame.
- **options.validateWarn** (Function) - called when there is a validation warning. Default is
  `console.warn`.
- **options.validateError** (Function) - called when there is a validation error. Default is
  `console.error`.

### Methods

##### getFrame()

Return a JSON object with xviz protocol containing all the streams in current frame built from the
XVIZBuilder instance.

##### pose(streamId)

Start building a [pose](/docs/protocol-schema/core-protocol.md#Poses) stream. Returns a
[XVIZPoseBuilder](#XVIZPoseBuilder) instance.

Parameters:

- `streamId` (String) - the name of the pose stream. Default to `/vehicle_pose` if not specified.
  Note that for a valid frame, stream `/vehicle_pose` must be defined. Additional poses can be
  defined but are not required.

##### primitive(streamId)

Start building a [primitive](/docs/protocol-schema/core-protocol.md#Primitive-State). Returns a
[XVIZPrimitiveBuilder](#XVIZPrimitiveBuilder) instance.

Parameters:

- `streamId` (String) - the name of the primitive stream.

##### futureInstance(streamId, timestamp)

Start building a [futureInstance](/docs/protocol-schema/core-types.md?section=future-instances)
stream. Returns a
[XVIZFutureInstanceBuilder](/docs/api-reference/xviz-builder.md?section=XVIZFutureInstanceBuilder)
instance.

Parameters:

- `streamId` (String) - the name of the futureInstance stream.
- `timestamp` (Number) - the future timestamp the primitive data represents

##### variable(streamId)

Start building a [variable](/docs/protocol-schema/core-protocol.md#Variable-State) stream. Returns a
[XVIZVariableBuilder](#XVIZVariableBuilder) instance.

Parameters:

- `streamId` (String) - the name of the variable stream.

##### timeSeries(streamId)

Start building a [time series](/docs/protocol-schema/core-protocol.md#Time-Series-State) stream.
Returns a [XVIZTimeSeriesBuilder](#XVIZTimeSeriesBuilder) instance.

Parameters:

- `streamId` (String) - the name of the time series stream.

##### uiPrimitive(streamId)

Start building a [UI primitive](/docs/protocol-schema/core-protocol.md#UI-Primitive-State) stream.
Returns a [XVIZUIPrimitiveBuilder](#XVIZUIPrimitiveBuilder) instance.

Parameters:

- `streamId` (String) - the name of the UI primitive stream.

### Remarks

#### Naming rules for streams

`streamId` has to be path-like.

- always starts with a `/`
- sections contain only: `[a-zA-Z0-9_-:.]`
- does not end with a `/`

Examples:

- `/vehicle-pose`
- `/vehicle/velocity`
- `/object/car-1/pose`

## XVIZPoseBuilder

### Methods

##### timestamp(timestamp)

Set the timestamp of the pose.

Parameters:

- `timestamp` (Number)

Returns: `this`

##### mapOrigin(longitude, latitude, altitude)

Set the reference point of the pose.

Parameters:

- `longitude` (Number) - in degrees.
- `latitude` (Number) - in degrees.
- `altitude` (Number) - in meters.

Returns: `this`

##### position(x, y, z)

Set the translation of the pose from the reference point.

Parameters:

- `x` (Number) - easting in meters.
- `y` (Number) - northing in meters.
- `z` (Number) - vertical offset in meters.

Returns: `this`

##### orientation(roll, pitch, yaw)

Set the rotation of the pose.

Parameters:

- `roll` (Number) - in radians.
- `pitch` (Number) - in radians.
- `yaw` (Number) - in radians.

Returns: `this`

## XVIZPrimitiveBuilder

### Methods

##### id(id)

Specify the object id for a primitive.

Parameters:

- `id` (String)

Returns: `this`

##### classes(classList)

Classes for styling, should match the style definition in the stream metadata.

Parameters:

- `classList` (Array:String)

Returns: `this`

##### style(style)

Set the primitive-specific style. This will override the style defined in the stream metadata.

Parameters:

- `style` (Object) - Check [XVIZ Stylesheet Spec](/docs/protocol-schema/style-specification.md) for
  supported style properties.

Returns: `this`

##### polygon(vertices)

Add a [polygon](/docs/protocol-schema/geometry-primitives#Polygon-Primitive) primitive.

Parameters:

- `vertices` (Array:Point3D)

Returns: `this`

##### polyline(vertices)

Add a [polyline](/docs/protocol-schema/geometry-primitives#Polyline-Primitive) primitive.

Parameters:

- `vertices` (Array:Point3D)

Returns: `this`

##### points(vertices)

Add a [point](/docs/protocol-schema/geometry-primitives#Point-Primitive) primitive.

Parameters:

- `vertices` (Array:Point3D)

Returns: `this`

##### image(data, format)

Add a [image](/docs/protocol-schema/geometry-primitives#Image-Primitive) primitive.

Parameters:

- `data` (Uint8Array) - binary image data
- `format` (String) - `png`, `jpg`, etc.

Returns: `this`

##### dimensions(widthPixel, heightPixel)

Only used for `image` primitive, providing dimension info about image stream.

Parameters:

- `widthPixel` (Number)
- `heightPixel` (Number)

Returns: `this`

##### circle(position: Array, radius : Number)

Add a [circle](/docs/protocol-schema/geometry-primitives#Circle-Primitive) primitive.

Parameters:

- `position` (Point3D) - center of the circle
- `radius` (Number)

Returns: `this`

##### stadium(start, end, radius)

Add a [stadium](/docs/protocol-schema/geometry-primitives#Stadium-Primitive) primitive.

Parameters:

- `start` (Point3D)
- `end` (Point3D)
- `radius` (Number)

Returns: `this`

##### text(message)

Add a [text](/docs/protocol-schema/geometry-primitives#Text-Primitive) primitive.

Parameters:

- `message` (String)

Returns: `this`

##### position(point)

Only used for specifying where to place `text` message.

Parameters:

- `point` (Point3D)

Returns: `this`

## XVIZFutureInstanceBuilder

### Methods

Refer to [XVIZPrimitiveBuilder](/docs/api-reference/xviz-builder.md#XVIZPrimitiveBuilder) as
XVIZFutureInstanceBuilder is a specialization of that class and supports all of the methods defined.

## XVIZVariableBuilder

### Methods

##### timestamps(timestamps)

Set the timestamps of a variable.

Parameters:

- `timestamps` (Array:Number)

Returns: `this`

##### values(values: Any)

Set the values of a variable, as matched pairs with `timestamps`.

Parameters:

- `values` (Array:Number|String|Boolean)

Returns: `this`

## XVIZTimeSeriesBuilder

### Methods

##### timestamp(timestamp)

Set the timestamp of an entry.

Parameters:

- `timestamp` (Number)

Returns: `this`

##### value(value)

Set the value of an entry.

Parameters:

- `value` (Number|String|Boolean)

Returns: `this`

## XVIZUIPrimitiveBuilder

### Methods

##### treetable(columns)

Initialize a treetable primitive.

Parameters:

- `columns` (Array:Object) - an array of descriptors of table columns.

Returns: `this`

##### row(id, column_values)

Add a row to the table.

Parameters:

- `id` (String) - id of the new row.
- `column_values` (Array:String|Number|Boolean) - a list of values for each column.

Returns: a `XVIZTreeTableRowBuilder` instance that represents the new row.

## XVIZTreeTableRowBuilder

##### child(id, column_values)

Append a row as a child of this row.

Parameters:

- `id` (String) - id of the new row.
- `column_values` (Array: String|Number|Boolean) - a list of values for each column.

Returns: a `XVIZTreeTableRowBuilder` instance that represents the new row.
