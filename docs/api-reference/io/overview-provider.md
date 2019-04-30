# Providers

XVIZ Providers encapsulate the details for reading from a data source and return an object that
allows you to access and iterate over the XVIZ messages.

## Overview

The XVIZProviderInterface defines a way to access XVIZ messages regardless of the concrete details
of the underlying XVIZ format.

Clients should not construct XVIZProviders directly, but instead use the
[XVIZProviderFactory](./docs/api-reference/io/xviz-provider-factory.md) to find create a Provider.
If a client has a custom XVIZ data source they can create their own Provider and register it with
the factory.

## Example

```js
import {FileSource, XVIZProviderFactory} from '@xviz/io';

const root = '.';
const source = new FileSource(root);
const provider = await XVIZProviderFactory.open({
  source,
  root
});

if (provider) {
  // ...
}
```

## XVIZProviderInterface

### Methods

#### async init()

Attempts to verify if the **source** represents a valid XVIZ data source and sets the result from
`valid()` appropriately.

This method must be called after construction before any other method.

#### valid()

Returns whether the object is a valid XVIZ source.

#### xvizMetadata()

Returns the XVIZ Metadata if present.

### getFrameIterator(range, options = {})

Returns an [iterator object](/docs/api-reference/io/xviz-provider-iterator.md).

_Parameters:_

- **range.startTime** (Number, optional) - The start time to being interation. If absent, set to the
  start of the log.
- **range.endTime** (Number, optional) - The end time to stop iteration. If absent, set to the end
  of the log.
- **options** (Object) - Implementation defined.

#### xvizFrame(iterator)

Returns an XVIZData object or null if the iterator is invalid.

_Parameters:_

- **iterator** (Object) - An [iterator](./xviz-provider-iterator.md) obtained from the method
  `getFrameIterator()`
