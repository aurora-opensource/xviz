# Providers

XVIZ Providers encapsulate the details for reading from a data source and return an object that
allows you to access and iterate over the XVIZ messages.

## Overview

The XVIZProviderInterface defines a way to access XVIZ messages regardless of the concrete details
of the underlying XVIZ format.

Clients should not construct XVIZProviders directly, but instead use the XVIZProviderFactory to find
the correct Provider. If a client has a custom XVIZ data source they can create their own Provider
and register it with the factory.

## Example

TODO: provide real example

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

## XVIZProviderInterface

### Methods

#### init()

#### valid()

#### xvizMetadata()

#### xvizFrame(iterator)

### getFrameIterator(startTime, endTime)

- **startTime** - optional
- **endTime** - optional
