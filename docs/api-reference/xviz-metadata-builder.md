# XvizMetadataBuilder

`XvizMetadataBuilder` class helps generate metadata object


## Methods

###### getMetadata() : Object
Return `metadata` object.

###### startTime(time : Number)
Set log start time.

###### endTime(time : Number)
Set log end time.

###### stream(stream_id : String)
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

###### coordinate(coord : String)
`vehicle_relative`, `custom`, `map_relative`

###### styleClassDefault(style : Object)
Define default style with style object.

###### styleClass(className : String, style : Object)
Define a style class with style object.

Refer `style-specification` for supported style properties.

Refer the example in `XvizBuilder`
