# XVIZBinaryWriters

The class `XVIZBinaryWriter` will output the GLB based binary format of XVIZ data.

## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZBinaryWriter} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

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
import {XVIZBinaryWriter} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink);
```

Parameters:

- `sink` (Object) - Object that manages writing data
- `options.flatten` (Boolean) - flatten nested arrays

### Methods

##### writeMetadata(xvizMetadata)

Encodes a log metadata to file.

Parameters:

- `xvizMetadata` (Object) - an XVIZ metadata object. See
  [XVIZMetadataBuilder.getMetadata()](/docs/api-reference/xviz-metadata-builder.md#getMetadata).

##### writeFrame(frameIndex, xvizFrame)

Encodes an XVIZ frame to file.

Parameters:

- `frameIndex` (Number) - the index of this frame.
- `xvizFrame` (Object) - an XVIZ frame object. See
  [XVIZBuilder.getFrame()](/docs/api-reference/xviz-builder.md#getFrame).

##### close()

Allow the sink to finalize state resulting in any subsequent methods throwing an error.
