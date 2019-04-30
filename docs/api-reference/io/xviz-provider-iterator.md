# XVIZ Provider Iterator

This object is returned from the
[XVIZProvider.getFrameIterator()](./docs/api-reference/io/overview-provider.md) function.

The iterator represents the state necessary to walk XVIZ data over a specified time range.

### Methods

#### valid()

Returns `true` if the iterator is valid.

#### value()

Returns the current value of the iterator, which is implementation defined.

#### next()

Increments the iterator and returns `{value, data}`
