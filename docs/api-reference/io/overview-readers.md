# Readers

Readers provide an interface to read XVIZ Metadata, Frames, and an Index.

The classes `XVIZJSONReader` and `XVIZBinaryReader` consume data from the output of
[XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md) and
[XVIZBuilder](/docs/api-reference/xviz-builder.md).

## Example

```js
TODO;

import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZBinaryWriter, FileSink} from '@xviz/io';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink);

const metadataBuilder = new XVIZMetadataBuilder();
// build metadata
xvizWriter.writeMetadata(metadataBuilder.getMetadata());

const builder = new XVIZBuilder();
for (let i = 0; i < 10; i++) {
  // build frames
  xvizWriter.writeFrame(i, builder.getFrame());
}

xvizWriter.writeFrameIndex();
```

### Constructor

```js
import {FileSink, XVIZBinaryWriter} from '@xviz/io';
const sink = new FileSink();
const xvizWriter = new XVIZBinaryWriter(sink);
```

Parameters:

- **source** (Object) Object that manages reading data
- **options** (Object)
  - **options.flatten**

### Methods

##### readMetadata()

Reads a log metadata from the source.

##### readFrame(frameIndex)

Reads an XVIZ frame from the source.

Parameters:

- **frameIndex** (Number) - the index of this frame.
  [XVIZBuilder.getFrame](/docs/api-reference/xviz-builder.md).

##### readFrameIndex() {

Reads the frame index for all the frames in a log.
