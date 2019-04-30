# Readers

Readers provide an interface to read XVIZ Metadata, Frames, and an access information about an XVIZ
data source.

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

## Constructor

```js
import {XVIZJSONReader, MemorySource} from '@xviz/io';

const source = new MemorySource();
// XVIZ data added to source
const reader = new XVIZJSONReader(source);
```

_Parameters:_

- **source** (Object) Object that manages reading data
- **options** (Object) Implementation defined options

## Methods

### readMetadata()

Reads a log metadata from the source.

### readFrame(frameIndex)

Reads an XVIZ frame from the source.

_Parameters:_

- **frameIndex** (Number) - the index of this frame.
  [XVIZBuilder.getFrame](/docs/api-reference/xviz-builder.md).

### timeRange()

Returns the `{startTime, endTime}` available in the data.

### frameCount()

Returns then number of frames available in the data.

### findFrame(timestamp)

Returns an 2 element array with [minFrame, maxFrame] for the given timestamp. If the timestamp is
before the start of the data, the start index is returned for both values. If the timestamp is
greater than the end of the data, the end is returned for both values.

### close()

Close the reader and the underlying source.
