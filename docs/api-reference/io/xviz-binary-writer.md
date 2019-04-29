# XVIZBinaryWriters

The class `XVIZBinaryWriter` will output the GLB based binary format of XVIZ data. format the output
of [XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md) and
[XVIZBuilder](/docs/api-reference/xviz-builder.md) to files.

## Example

```js
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

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink);
```

Parameters:

- **sink** (Object) Object that manages writing data
- **options** (Object)
  - **options.flatten**

### Methods

##### writeMetadata(directory, xvizMetadata)

Encodes a log metadata to file.

Parameters:

- **directory** (String) - the output directory.
- **xvizMetadata** (Object) - a XVIZ metadata object. See
  [XVIZMetadataBuilder.getMetadata](/docs/api-reference/xviz-metadata-builder.md).

##### writeFrame(directory, frameIndex, xvizFrame)

Encodes an XVIZ frame to file.

Parameters:

- **directory** (String) - the output directory.
- **frameIndex** (Number) - the index of this frame.
- **xvizFrame** (Object) - a XVIZ frame object. See
  [XVIZBuilder.getFrame](/docs/api-reference/xviz-builder.md).

##### writeFrameIndex(directory) {

Encodes an index file of all the frames in a log. This method must be called after all `writeFrame`
calls.

Parameters:

- **directory** (String) - the output directory.
