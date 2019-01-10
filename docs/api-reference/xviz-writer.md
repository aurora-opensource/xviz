# XVIZWriter

The `XVIZWriter` class encodes the output of
[XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md) and
[XVIZBuilder](/docs/api-reference/xviz-builder.md) to files.

## Example

```js
import {XVIZWriter, XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';

const xvizWriter = new XVIZWriter();

const metadataBuilder = new XVIZMetadataBuilder();
// build metadata
xvizWriter.writeMetadata('output_dir', metadataBuilder.getMetadata());

const builder = new XVIZBuilder();
for (let i = 0; i < 10; i++) {
  // build frames
  xvizWriter.writeFrame('output_dir', i, builder.getFrame());
}

xvizWriter.writeFrameIndex('output_dir');
```

### Constructor

```js
import {XVIZWriter} from '@xviz/builder';
const xvizWriter = new XVIZWriter();
```

Parameters:

- **options** (Object)
  - **options.dataSink** (Object) - by default, XVIZWriter writes the output to files on a disk.
    Provide this option to override the behavior. `dataSink` must contain the following fields:
    - **writeSync(scope, name, data)** (Function)
  - **options.envelop** (Boolean) - whether to wrap the data object with a typed container. Default
    `true`.
  - **options.binary** (Boolean) - output binary (GLB) format. Default `true`.
  - **options.json** (Boolean) - output JSON format. Default `false`.

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
