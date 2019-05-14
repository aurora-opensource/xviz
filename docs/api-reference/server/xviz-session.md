# XVIZMiddleware

### onConnection

### Connection events

#### onClose

#### onConnect

### XVIZ message types and middleware

#### onStart

#### onTransformLog

#### onError

#### onMetadata

#### onStateUpdate

#### onTransformLogDone

#### onReconfigure

XVIZ Providers encapsulate the details of reading a particular XVIZ source and returns an object
that allows you to access metadata and iterate over the XVIZ messages.

Clients should not construct XVIZProviders directly, but instead use the
[XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md) to find create a Provider.

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

### Interface Methods

##### async init()

Attempts to verify if the **source** represents a valid XVIZ data source and sets the result from
`valid()` appropriately.

This method must be called after construction before any other method.

##### valid()

Returns: (Boolean) - True if the source is a valid for this Provider

##### xvizMetadata()

Returns: the XVIZ Metadata if present

##### getFrameIterator(range, options)

Parameters:

- `range.startTime` (Number, optional) - The start time to being interation. If absent, set to the
  start of the log.
- `range.endTime` (Number, optional) - The end time to stop iteration. If absent, set to the end of
  the log.
- `options` (Object) - Implementation defined.

Returns: ([iterator](/docs/api-reference/io/xviz-provider-iterator.md)) - iterator object for frames

##### xvizFrame(iterator)

Parameters:

- `iterator` (Object) - An [iterator](/docs/api-reference/io/xviz-provider-iterator.md) obtained
  from the method [getFrameIterator()](#getFrameIterator)

Returns: ([XVIZData](/docs/api-reference/io/xviz-data.md)) - object or null if the iterator is
invalid
