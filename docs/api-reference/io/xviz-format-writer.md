# XVIZFormatWrtier

The class `XVIZFormatWriter` allows you to specify your desired output format and will handle the
conversion for you.

The XVIZFormatWriter currently expects XVIZData and not a raw object.

## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZFormatWriter, XVIZ_FORMAT} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZFormatWriter(sink, {format: XVIZ_FORMAT.BINARY_GLB});

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

### Constructor

```js
import {XVIZFormatWriter, XVIZ_FORMAT} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink, {format: XVIZ_FORMAT.BINARY_GLB});
```

Parameters:

- `sink` (Object) Object that manages writing data
- `options` (Object) - Set of options that will be passed through to underlying Writer
- `options.format` ([XVIZ_FORMAT](/docs/api-reference/io/xviz-format.md)) - Required XVIZ format to
  write out

### Methods

##### writeMetadata(xvizMetadata)

Encodes a log metadata to file.

Parameters:

- `xvizMetadata` (Object) - an XVIZ metadata object. See
  [XVIZMetadataBuilder.getMetadata()](/docs/api-reference/xviz-metadata-builder.md#getMetadata).

##### writeMessage(messageIndex, xvizMessage)

Encodes an XVIZ message to file.

Parameters:

- `messageIndex` (Number) - the index of this message.
- `xvizMessage` (Object) - an XVIZ message object. See
  [XVIZBuilder.getMessage()](/docs/api-reference/xviz-builder.md#getMessage).

#### close()

Allow the sink to finalize state resulting in any subsequent methods throwing an error.
