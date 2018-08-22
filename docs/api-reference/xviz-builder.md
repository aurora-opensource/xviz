# XvizBuilder

`XvizBuilder` class provides convenient chaining functions to format data with xviz protocol.

## Constructor

##### metadata (Object)
* Use `XvizMetadataBuilder` to construct metadaata object.

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

##### `pose(stream_id : String, pose : Pose)`

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

const xvizMetaBuider = new XVIZMetadataBuilder();
xvizMetaBuider.stream('vehicle-pose')
  .stream('velocity')
  .category('variable')ʔ
  .type('float')
  .unit('m/s^2')

  .stream('point-cloud')
  .category('primitive')
  .type('point')
  .styleClassDefault({
    fillColor: '#00a',
    radiusPixels: 2
  });

const points = new Float32Array ([1.23, 0.45, 0.06]);

const xvizBuilder = new XVIZBuilder({
  metadata
  disableStreams
});

xvizBuilder
  .stream('velocity')
  .timestamp(123)
  .value(1.23)

  .stream('point-cloud')
  .points(points)
  .timestamp()
  .color([0, 0, 0, 255])


const frame = xvizBuider.getFrame()

// frame data format
{
  state_updates: [
    {
      primitives: {
        'point-cloud': [{
          color: [255,0,0],
          type: 'points',
          vertices: [1.23, 0.45, 0.06]
        }
      },
      variables: {
        velocity: {
          timestamps: [123],
          type: 'float',
          values: [1.23]
        }
      }
    }
  ]
}


```
