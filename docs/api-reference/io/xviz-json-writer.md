# XVIZJSONWriters

The class `XVIZJSONWriter` will output the JSON format of XVIZ data.

## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZJSONWriter} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZJSONWriter(sink);

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
import {XVIZJSONWriter} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZJSONWriter(sink);
```

Parameters:

- `sink` (Object) - Object that manages writing data
- `options.precision` (Number) - transform Numbers in the data to the specified precision
  (default 10)
- `options.asArrayBuffer` (Boolean) - write to sink using ArrayBuffer rather than string

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
