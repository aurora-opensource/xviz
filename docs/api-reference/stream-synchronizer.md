# StreamSynchronizer

The `StreamSynchronizer` class looks into a
[XVIZStreamBuffer](/docs/api-reference/xviz-stream-buffer.md) and retrieves the most relevant datum
from each stream that "matches" the current timestamp.

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

- **vehiclePose** (Object) - the current [vehicle pose](/docs/protocol-schema/core-types/md#Pose).
- **origin** (Array) - map origin in `[lng, lat, alt]`
- **vehicleRelativeTransform** (Matrix4)
- **trackPosition** (Array) - vehicle position in `[lng, lat, alt]`
- **heading** (Number) - the heading of the vehicle
- **features** (Object) - a map from stream names to arrays of
  [geometry primitives](/docs/protocol-schema/core-types/md#Primitive-State). This is a subset of
  `streams`.
- **lookAheads** (Object) - a map from stream names to arrays of
  [futures](/docs/protocol-schema/core-types/md#Future-Instances). This is a subset of `streams`.
- **variables** (Object) - a map from stream names to
  [variables](/docs/protocol-schema/core-types/md#Variable-State). This is a subset of `streams`.
- **streams** (Object) - the current state of all streams.
