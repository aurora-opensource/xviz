# XVIZJSONReader

XVIZBinaryReader supports the JSON format for XVIZ data.

## Example

```js
import {FileSink, XVIZBinaryWriter} from '@xviz/io';
const sink = new FileSink();
const xvizWriter = new XVIZBinaryWriter(sink);
```

## Constructor

Parameters:

- **source** (Object) Object that manages reading data
- **options** (Object)
  - **options.flatten**

## Methods

### readMetadata()

Reads a log metadata from the source.

### readFrame(frameIndex)

Reads an XVIZ frame from the source.

Parameters:

- **frameIndex** (Number) - the index of this frame.
  [XVIZBuilder.getFrame](/docs/api-reference/xviz-builder.md).

### readFrameIndex() {

Reads the frame index for all the frames in a log.
