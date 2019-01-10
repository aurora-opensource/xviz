# StreamSynchronizer

The `StreamSynchronizer` class looks into a stream buffer and retrieves the most relevant datum from
each stream that "matches" the current timestamp.

```js
import {XVIZStreamBuffer, StreamSynchronizer} from '@xviz/parser';

const streamBuffer = XVIZStreamBuffer();
const synchronizer = new StreamSynchronizer(streamBuffer);

// Load timeslices
streamBuffer.insert(...);

synchronizer.setTime(1000);
const frame = synchronizer.getCurrentFrame();
```

## Constructor

```js
new StreamSynchronizer(streamBuffer);
```

Parameters:

- **streamBuffer** (XVIZStreamBuffer) - a
  [XVIZStreamBuffer](/docs/api-reference/xviz-stream-buffer.md) instance.
- **options** (Object)
  - **postProcessFrame** (Function) - callback to process the current frame before it is used.

## Methods

##### setTime(timestamp)

Set the current timestamp.

Parameters:

- **timestamp** (Number)

##### getCurrentFrame(streamFilter)

Get a full descriptor of the log at the current timestamp.

Parameters:

- **streamFilter** (Object, optional) - a stream name to boolean map that indicates whether a stream
  should be included. If `null`, all streams are included.

Returns an object with the following fields:

- **vehiclePose** (Object)
- **origin** (Array) - map origin in `[lng, lat, alt]`
- **vehicleRelativeTransform** (Matrix4)
- **trackPosition** (Array) - vehicle position in `[lng, lat, alt]`
- **heading** (Number) - the heading of the vehicle
- **features** (Array)
- **lookAheads** (Array)
- **variables** (Array)
- **streams** (Object)
