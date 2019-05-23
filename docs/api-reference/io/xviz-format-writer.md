# XVIZFormatWrtier

The class `XVIZFormatWriter` allows you to specify your desired output format and will handle the
conversion for you.

The XVIZFormatWriter currently expects XVIZData and not a raw object.

## Example

```js
import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';
import {XVIZFormatWriter, XVIZFormat} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZFormatWriter(sink, {format: XVIZFormat.BINARY_GLB});

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
import {XVIZFormatWriter, XVIZFormat} from '@xviz/io';
import {FileSink} from '@xviz/io/node';

const sink = new FileSink('output-dir');
const xvizWriter = new XVIZBinaryWriter(sink, {format: XVIZFormat.BINARY_GLB});
```

Parameters:

- `sink` (Object) Object that manages writing data
- `options` (Object) - Set of options that will be passed through to underlying Writer
- `options.format` ([XVIZFormat](/docs/api-reference/io/xviz-format.md)) - Required XVIZ format to
  write out

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

#### close()

Allow the sink to finalize state resulting in any subsequent methods throwing an error.
