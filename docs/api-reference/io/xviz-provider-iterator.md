# XVIZ Provider Iterator

This object is returned from the
[XVIZProvider.getFrameIterator()](/docs/api-reference/io/overview-provider.md) function.

The iterator represents the state necessary to walk the XVIZ data over a specified time range.

## Methods

##### valid()

Returns: (Boolean) - **true** if the iterator is valid

##### value()

Returns: (Number) - the current value of the iterator, which may be implementation defined

##### next()

Increments the iterator and returns the state and value

Returns:

- (Object)
  - `valid` (Boolean) - **true** if this iterator is still valid
  - `data` (Number) - Value used for iteration
