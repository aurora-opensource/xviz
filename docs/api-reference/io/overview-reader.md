# XVIZ Reader

XVIZ Readers provide an interface to read XVIZ data and provide timing and frame information about
the source.

## Example

```js
import {XVIZJSONReader, MemorySource} from '@xviz/io';

const source = new MemorySource();
// XVIZ data added to source
const reader = new XVIZJSONReader(source);
const frameCount = reader.frameCount();
const meta = reader.readMetadata();

for (const i = 0; i < frameCount; i++) {
  const frame = reader.readFrame(i);
}
```

## Interface Methods

##### readMetadata()

Reads a log metadata from the source.

Returns: (Object|Buffer) - XVIZ metadata

##### readFrame(frameIndex)

Reads an XVIZ frame from the source.

Parameters:

- `frameIndex` (Number) - the index of this frame.
  [XVIZBuilder.getFrame()](/docs/api-reference/xviz-builder.md#getFrame).

Returns: (Object|Buffer) - XVIZ message

##### timeRange()

Returns:

- (Object)
  - `startTime` (Number) - Start time of the the source if known
  - `endTime` (Number) - End time of the the source if known

##### frameCount()

Returns: (Number) - Number of frames available in the data

##### findFrame(timestamp)

Returns an object with the frame indices for the first and last indices that are the boundaries for
this timestamp.

Parameters:

- `timestamp` (Number) - Timestamp used to find the frame index boundaries

Returns:

- (Object)
  - `first` (Number) - First frame index that is >= timestamp, or the first index if timestamp < the
    start of the time range
  - `last` (Number) - Last frame index that is <= timestamp, or the last index if timestamp > the
    end of the time range

##### close()

Close the reader and the underlying source
