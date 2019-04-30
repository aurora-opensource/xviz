# Writers

Writers provide an interface to write XVIZ Metadata and Frames.

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

xvizWriter.close();
```

### Constructor

```js
import {FileSink, XVIZBinaryWriter} from '@xviz/io';
const sink = new FileSink();
const xvizWriter = new XVIZBinaryWriter(sink);
```

_Parameters:_

- **sink** (Object) Object that manages writing data
- **options** (Object)
  - **options.flatten**

### Methods

##### writeMetadata(xvizMetadata)

Writes a log metadata to the sink.

_Parameters:_

- **xvizMetadata** (Object) - a XVIZ metadata object. See
  [XVIZMetadataBuilder.getMetadata](/docs/api-reference/xviz-metadata-builder.md).

##### writeFrame(frameIndex, xvizFrame)

Writes an XVIZ frame to the sink.

_Parameters:_

- **frameIndex** (Number) - the index of this frame.
- **xvizFrame** (Object) - a XVIZ frame object. See
  [XVIZBuilder.getFrame](/docs/api-reference/xviz-builder.md).

#### close()

Allow the sink to finalize state resulting in any subsequent methods throwing an error.
