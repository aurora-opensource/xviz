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
Return an object with xviz protocol containing all the streams in current frame built from the XvizBuilder instance

##### `pose(stream_id : String, pose : Object)`

##### stream(stream_id : String)

##### timestamp(timestamp : Number)

##### value(value : Any)

##### polygon(vertices : TypedArray)

##### polyline(vertices : TypedArray)

##### points(vertices : TypedArray)

##### color(color : Array)
- color input should be a RGB array, i.e. [0, 0, 255]

##### id(id : String)

##### classes(classList : Array)
- `classList` should match metadata definination


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
  });

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

xvizBuilder
  .pose('/vehicle-pose', pose)
  .stream('/velocity')
  .timestamp(123)
  .value(1.23)

  .stream('/point-cloud')
  .points(new Float32Array([1.23, 0.45, 0.06]))
  .timestamp()
  .color([0, 0, 0, 255])


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
      }
    }
  ]
}


```
