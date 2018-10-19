# XvizMetadataBuilder

`XvizMetadataBuilder` class helps generate metadata object


## Methods

###### getMetadata() : Object
Return `metadata` object.

###### startTime(time : Number)
Set log start time.

###### endTime(time : Number)
Set log end time.

###### stream(streamId : String)
Add a stream.

###### category(category : String)
Set `category` of the stream. Options are

- `primitive`
- `time_series`
- `variable`

See `core-protocol` for details.


###### type(type : String)
Set type of the stream.

For category `variable` and `time_series`, options are
- `float`
- `integer`
- `string`
- `boolean`
check `core-protocol` for details.

For `primitive`, options are
- `point`
- `polygon`
- `polyline`
- `circle`
- `stadium`
- `text`
- `image`
check `geometry-primitives` for details.


###### unit(unit : String)
Set unit for `variable` or `time_series`. e.g. `m/s`, `m/s^2`

###### coordinate(coordinate : String)
Set the coordinate for a stream.

`vehicle_relative`, `map_relative` or any customized name.

###### transformMatrix(matrix: Matrix4 | Array)
Add a custom transform matrix.  In order to make a relative adjustment from the core pose of the stream.
`matrix` could be an Matrix4 ([math.gl](https://github.com/uber-web/math.gl/blob/master/docs/api-reference/matrix4.md)) instance or an array of 16 numbers.

###### pose(position: Object, orientation: Object)
`position`: `{x, y, z}` 
`orientation`: `{roll, pitch, yaw}`

Stream data from sensors can have a pose offset relative to the vehicle pose. `pose` is a convenient function we have to day to construct a transform matrix from a pose definition.

`position` and `orientation` will be used to construct a [Pose](https://github.com/uber-web/math.gl/blob/master/src/pose.js) instance and applied to a identity matrix.

**Note:** Both `pose` and `transformMatrix` can not be applied at the same time.

###### streamStyle(style : Object)
Define default style with style object.

###### styleClass(className : String, style : Object)
Define a style class with style object.

Refer `style-specification` for supported style properties.

Refer the example in `XvizBuilder`
