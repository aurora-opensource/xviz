# XVIZBinaryReader

XVIZBinaryReader supports the Binary GLB based format for XVIZ data.

## Example

```js
import {XVIZBinaryReader, MemorySource} from '@xviz/io';

const source = new MemorySource();
// XVIZ data added to source
const reader = new XVIZBinaryReader(source);
```

## Constructor

Parameters:

- `source` (Object) - XVIZ data source

## Methods

##### readMetadata()

Reads a log metadata from the source.

Returns: (Object|Buffer) - XVIZ metadata

##### readMessage(messageIndex)

Reads an XVIZ message from the source.

Parameters:

- `messageIndex` (Number) - the index of this message.
  [XVIZBuilder.getMessage()](/docs/api-reference/xviz-builder.md#getMessage).

Returns: (Object|Buffer) - XVIZ message

##### timeRange()

Returns:

- (Object)
  - `startTime` (Number) - Start time of the the source if known
  - `endTime` (Number) - End time of the the source if known

##### messageCount()

Returns: (Number) - Number of messages available in the data

##### findMessage(timestamp)

Returns an object with the message indices for the first and last indices that are the boundaries
for this timestamp.

Parameters:

- `timestamp` (Number) - Timestamp used to find the message index boundaries

Returns:

- (Object)
  - `first` (Number) - First message index that is >= timestamp, or the first index if timestamp <
    the start of the time range
  - `last` (Number) - Last message index that is <= timestamp, or the last index if timestamp > the
    end of the time range

##### close()

Close the reader and the underlying source.
