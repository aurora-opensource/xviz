# XVIZMetadataBuilder

The `XVIZMetadataBuilder` class provides convenient chaining functions to format metadata for the
xviz protocol.

## Example

Try it [live](https://avs.auto/playground/?tab=metadata)

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';

// xviz metadata provides log metadata, i.e. startTime, endTime, streams, styles,
const xvizMetaBuider = new XVIZMetadataBuilder();
xvizMetaBuider
  .startTime(1542768000)
  .endTime(1542768060)

  .stream('/vehicle-pose')
  .stream('/velocity')
  .category('variable')
  .type('float')
  .unit('m/s^2')

  .stream('/point-cloud')
  .category('primitive')
  .type('point')
  .streamStyle({
    fill_color: '#00a',
    radius_pixels: 2
  })

  .stream('/pedestrian-1-trajectory')
  .category('primitive')
  .type('polygon');

const metadata = xvizMetaBuider.getMetadata();
console.log(metadata);
```

## Constructor

```js
import {XVIZMetadataBuilder} from '@xviz/builder';
const xvizMetadataBuilder = new XVIZMetadataBuilder(options);
```

Parameters:

- `options.validateWarn` (Function) - called when there is a validation warning. Default is
  `console.warn`.
- `options.validateError` (Function) - called when there is a validation error. Default is
  `console.error`.

## Methods

###### getMetadata()

Returns a JSON object with xviz protocol that is the metadata of the session.

###### startTime(time)

Set log start time.

Parameters:

- `time` (Number)

Returns: `this`

###### endTime(time)

Set log end time.

Parameters:

- `time` (Number)

Returns: `this`

###### ui(uiBuilder)

Set the configuration of declarative UI.

Parameters:

- `uiBuilder` ([XVIZUIBuilder](/docs/api-reference/xivz-ui-builder.md))

Returns: `this`

###### stream(streamId)

Add a stream.

Parameters:

- `streamId` (String)

Returns: `this`

###### category(category)

Set `category` of the stream.

Parameters:

- `category` (String) - `primitive`, `time_series`, `variable`, etc. See
  [XVIZ Core Protocol](/docs/protocol-schema/core-protocol.md) for details.

Returns: `this`

###### type(type)

Set `type` of the stream.

Parameters:

- `type` (String)
  - For category `variable` and `time_series`, options are `float`, `integer`, `string` and
    `boolean`. See [XVIZ Core Protocol](/docs/protocol-schema/core-protocol.md) for details.
  - For category `primitive`, options are `point`, `polygon`, `polyline`, `circle`, `stadium`,
    `text` and `image`. See [Geometry Primitives](/docs/protocol-schema/geometry-primitives.md) for
    details.

Returns: `this`

###### unit(unit)

Set unit for `variable` or `time_series`.

Parameters:

- `unit` (String) - `m/s`, `m/s^2`, etc.

Returns: `this`

###### coordinate(coordinate)

Set the coordinate for a stream.

Parameters:

- `coordinate` (String) - `GEOGRAPHIC`, `VEHICLE_RELATIVE`, `IDENTITY` or `DYNAMIC`.

Returns: `this`

###### transformMatrix(matrix)

Add a custom transform matrix in order to make a relative adjustment from the core pose of the
stream.

Parameters:

- `matrix` (Array) - an
  [Matrix4](https://github.com/uber-web/math.gl/blob/master/docs/api-reference/matrix4.md) instance
  or an array of 16 numbers.

Returns: `this`

###### pose(position, orientation)

`position`: `{x, y, z}` `orientation`: `{roll, pitch, yaw}`

Stream data from sensors can have a pose offset relative to the vehicle pose. `pose` is a convenient
function we have to construct a transform matrix from a pose definition.

Parameters:

- `position` (Object) - the translation of the stream.
  - `position.x` (Number) - in meters.
  - `position.y` (Number) - in meters.
  - `position.z` (Number) - in meters.
- `orientation` (Object) - the rotation of the stream.
  - `orientation.roll` (Number) - in radians.
  - `orientation.pitch` (Number) - in radians.
  - `orientation.yaw` (Number) - in radians.

Returns: `this`

`position` and `orientation` will be used to construct a
[Pose](https://github.com/uber-web/math.gl/blob/master/src/pose.js) instance and applied to a
identity matrix.

**Note:** Both `pose` and `transformMatrix` can not be applied at the same time.

###### streamStyle(style)

Define the default style with style object.

Parameters:

- `style` (Object) - Check [XVIZ Stylesheet Spec](/docs/protocol-schema/style-specification.md) for
  supported style properties.

Returns: `this`

###### styleClass(className, style)

Define a style class with its corresponding styles.

Parameters:

- `className` (String) - The class name that the style object should apply to.
- `style` (Object) - Check [XVIZ Stylesheet Spec](/docs/protocol-schema/style-specification.md) for
  supported style properties.

Returns: `this`

###### logInfo(customFields)

Adds custom fields that will be added to the `log_info` field in the metadata. Certain keys are
special and cannot be overwritten.

Special keys:

- `start_time` (Number) - Start time for the log data
- `end_time` (Number) - End time for the log data

Parameters:

- `customFields` (Object) - The object which entries will be added to the `log_info` field.

Returns: `this`
