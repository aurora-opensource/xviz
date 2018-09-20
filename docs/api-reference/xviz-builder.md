# XvizBuilder

`XvizBuilder` class provides convenient chaining functions to format data for the xviz protocol.

## Constructor

##### metadata (Object)
* Use `XvizMetadataBuilder` to construct metadata object.

##### disableStreams (Array)
* disableStreams are not flushed to frame.

##### validateWarn (Function),
* called when there is a validation warning.

##### validateError (Function)
* called when there is a validation error.


## Methods
All methods except `getFrame()` return `this` builder instance

##### `getFrame()`
* Return an object with xviz protocol containing all the streams in current frame built from the XvizBuilder instance.

##### `pose( pose : Object)`
* Set the vehicle pose stream.

##### stream(stream_id : String)
* Start building a stream.


### For `time_series`

##### timestamp(timestamp : Number)
* Set timestamp.

##### value(value : Any)
* Value has to be one of `Number`, `String`, or `boolean`.


### For `variable`

##### timestamps(timestamps : Array)
* Set timestamps of a variable.

##### values(values : Any)
* `values` and `timestamps` should be matched pairs.
* Each element in `values` array should be `Number`, `String`, or `boolean`.


### For `primitive`

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

##### color(color : Array)
* `color` input should be a RGB array, i.e. [0, 0, 255]

##### id(id : String)
* Specify `id` for a primitive.

##### classes(classList : Array)
* `classList` style classes, should match metadata definition

##### timestamp(timestamp : Number)
* Primitive with timestamp is considered as `future`.
* check `core-protocol` for definition of future.


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
  .styleClassDefault({
    fillColor: '#00a',
    radiusPixels: 2
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
  metadata
  disableStreams
});

const polygon = new Float32Array([
  [1.23, 0.45, 0.06],
  [2.45, 0.67, 0.08],
  [1.67, 0.53, 0.07],  
  [1.23, 0.45, 0.06],
]);

xvizBuilder
  .pose('/vehicle-pose', pose)
  .stream('/velocity')
  .timestamp(123)
  .value(1.23)

  .stream('/point-cloud')
  .points(new Float32Array([1.23, 0.45, 0.06]))
  .timestamp()
  .color([0, 0, 0, 255])

  .stream('/pedestrian-1-trajectory')
  .polygon(polygon)
  .timestamp(123);


const frame = xvizBuider.getFrame()

// frame data format
{
  'vehicle-pose': {
    time: 123,
    latitude: 12.345,
    longitude: 12.345,
    altitude: 12.345,
    roll: 0.123,
    pitch: 0.123,
    yaw: 0.123
  },
  state_updates: [
    {
      primitives: {
        '/point-cloud': [{
          color: [255,0,0],
          type: 'points',
          vertices: [1.23, 0.45, 0.06]
        }
      },
      variables: {
        '/velocity': {
          timestamps: [123],
          type: 'float',
          values: [1.23]
        }
      },
      futures: {
        '/pedestrian-1-trajectory': {
          name: '/pedestrian-1-trajectory'
          type: 'polygon',
          timestamps: [123],
          primitives: [
            [
              {
                [1.23, 0.45, 0.06],
                [2.45, 0.67, 0.08],
                [1.67, 0.53, 0.07],  
                [1.23, 0.45, 0.06],
              }
            ]
          ]
        }
      }
    }
  ]
}


```
