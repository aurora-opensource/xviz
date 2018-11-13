# XVIZBuilder

`XVIZBuilder` class provides convenient chaining functions to format data for the xviz protocol.

## Constructor

##### metadata (Object)
* Use `XVIZMetadataBuilder` to construct metadata object.

##### disableStreams (Array)
* disableStreams are not flushed to frame.

##### validateWarn (Function),
* called when there is a validation warning.

##### validateError (Function)
* called when there is a validation error.


## Methods
All methods except `getFrame()` return `this` builder instance

##### getFrame()
* Return an object with xviz protocol containing all the streams in current frame built from the XVIZBuilder instance.

##### pose(streamId : String) : XVIZPoseBuilder
`streamId` is default to `/vehicle_pose` if not specified.
Also for a frame, stream `/vehicle_pose` must be defined.
Additional poses can be defined but are not required.

* Start building a `pose` stream.
* Return `XVIZPoseBuilder` instance
* `Pose` structure

```js
{
  timestamp: timestamp,
  mapOrigin: {longitude, latitude, altitude},
  position: [x, y, z],
  orientation: [roll, pitch, yaw]
}

```

##### primitive(streamId : String) : XVIZPrimitiveBuilder
* Start building a `primitive` or `future` stream.
* Return `XVIZPrimitiveBuilder` instance

##### variable(streamId : String) : XVIZVariableBuilder
* Start building a `variables` stream.
* Return `XVIZVariableBuilder` instance

##### timeSeries(streamId : String) : XVIZTimeSeriesBuilder
* Start building a `timeSeries` stream.
* Return `XVIZTimeSeriesBuilder` instance

**Naming rules for `streamId`**
* Start building a stream.
* `streamId` has to be path-like.
  - always starts with a `/`
  - sections contain only: `[a-zA-Z0-9_-:.]`
  - does not end with a `/`

Examples:
   - `/vehicle-pose`
   - `/vehicle/velocity`
   - `/object/car-1`

##### uiPrimitive(streamId : String) : XVIZUIPrimitiveBuilder
* Start building a `ui_primitive` stream.
* Return `XVIZUIPrimitiveBuilder` instance


# XVIZPoseBuilder

##### mapOrigin(longitude : Number, latitude : Number, altitude : Number)

##### position(x: Number, y : Number, z : Number)

##### orientation(roll: Number, pitch : Number, yaw : Number)


# XVIZPrimitiveBuilder

##### polygon(vertices : TypedArray)

##### polyline(vertices : TypedArray)

##### points(vertices : TypedArray)

##### image(data, format)
* `data` binary image data
* `format` e.g. 'png', 'jpg', etc

##### dimensions(widthPixel : Number, heightPixel : Number, depth : Number)
* Only used for `image` primitive, providing dimension info about image stream.

##### circle(position: Array, radius : Number)
* `position` has to be an array with length 3, [x, y, z].

##### stadium(start : Array, end : Array, radius : Number)
* Both `start` and `end` are array with length3, [x, y, z].

##### text(message : String)

##### position(point : Array)
* Position has to be an array with length 3.
* Only used for specifying where to place `text` message.

##### style(style : Object)
check `xviz-stylesheet` for supported style properties

##### id(id : String)
* Specify `id` for a primitive.

##### classes(classList : Array)
* `classList` style classes, should match metadata definition

##### timestamp(timestamp : Number)
* Primitive with timestamp is considered as `future`.
* check `core-protocol` for definition of future.


# XVIZVariableBuilder

##### timestamps(timestamps : Array)
* Set timestamps of a variable.

##### values(values : Any)
* `values` and `timestamps` should be matched pairs.
* Each element in `values` array should be `Number`, `String`, or `boolean`.


# XVIZTimeSeriesBuilder

##### timestamp(timestamp : Number)
* Set timestamp.

##### value(value : Any)
* Value has to be one of `Number`, `String`, or `boolean`.


# XVIZUIPrimitiveBuilder

##### treetable(columns : Array)

Initialize a treetable primitive.
* `columns` should be an array of descriptors of table columns.

##### row(id: String, column_values: Array)

Add a row to the table. Returns a `XVIZTreeTableRowBuilder` instance that represents the new row.

## XVIZTreeTableRowBuilder

##### child(id: String, column_values: Array)

Append a row as a child of this row. Returns a `XVIZTreeTableRowBuilder` instance that represents the new row.


## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder'

// xviz metadata provides log metadata, i.e. startTime, endTime, streams, styles,
const xvizMetaBuider = new XVIZMetadataBuilder();
xvizMetaBuider
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

const pose = {
  time: 123,
  latitude: 12.345,
  longitude: 12.345,
  altitude: 12.345,
  roll: 0.123,
  pitch: 0.123,
  yaw: 0.123
};

const xvizBuilder = new XVIZBuilder({
  metadata,
  disableStreams
});

const polygon = new Float32Array([
  [1.23, 0.45, 0.06],
  [2.45, 0.67, 0.08],
  [1.67, 0.53, 0.07],
  [1.23, 0.45, 0.06],
]);

xvizBuilder
  .pose(pose)

  .variable('/velocity')
  .timestamp(123)
  .value(1.23)

  .primitive('/point-cloud')
  .points(new Float32Array([1.23, 0.45, 0.06]))
  .timestamp()
  .style({
     fill_color: [0, 0, 0, 255]
  })

  .primitive('/pedestrian-1-trajectory')
  .polygon(polygon)
  .timestamp(123);


const frame = xvizBuider.getFrame();

// frame data format
{
  update_type: 'snapshot',
  updates: [
    {
      poses: {
        '/vehicle_pose': {
          timestamp: 123,
          mapOrigin: {
            latitude: 12.345,
            longitude: 12.345,
            altitude: 12.345
          }
          orientation: [
            0.123,
            0.123,
            0.123
          ]
        }
      }
      primitives: {
        '/point-cloud': {
          points: [
            {
              base: {
                style: {
                  fill_color: [255,0,0]
                }
              },
              vertices: [1.23, 0.45, 0.06]
            }
          ]
        }
      },
      variables: {
        '/velocity': {
          variables: [
            {
              values: [1.23]
            }
          ]
        }
      },
      future_instances: {
        '/pedestrian-1-trajectory': {
          timestamps: [123],
          type: 'polygon',
          primitives: [
            [
              {
                [1.23, 0.45, 0.06],
                [2.45, 0.67, 0.08],
                [1.67, 0.53, 0.07],
                [1.23, 0.45, 0.06]
              }
            ]
          ]
        }
      }
    }
  ]
}

```
