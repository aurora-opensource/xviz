# XVIZ Writer

XVIZ Writers provide an interface to write XVIZ Metadata and Messages.

## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZBinaryWriter}
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink);

const metadataBuilder = new XVIZMetadataBuilder();
// build metadata
xvizWriter.writeMetadata(metadataBuilder.getMetadata());

const builder = new XVIZBuilder();
for (let i = 0; i < 10; i++) {
  // build messages
  xvizWriter.writeMessage(i, builder.getMessage());
}

xvizWriter.close();
```

### Interface Methods

##### writeMetadata(xvizMetadata)

Writes a log metadata to the sink.

Parameters:

- `xvizMetadata` (Object) - an XVIZ metadata object. See
  [XVIZMetadataBuilder.getMetadata()](/docs/api-reference/xviz-metadata-builder.md#getMetadata).

##### writeMessage(messageIndex, xvizMessage)

Writes an XVIZ message to the sink.

Parameters:

- `messageIndex` (Number) - the index of this message.
- `xvizMessage`(Object) - an XVIZ message object. See
  [XVIZBuilder.getMessage()](/docs/api-reference/xviz-builder.md#getMessage).

#### close()

Allow the sink to finalize state resulting in any subsequent methods throwing an error.
