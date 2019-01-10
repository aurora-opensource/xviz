# XVIZStreamBuffer

The `XVIZStreamBuffer` class manages loaded XVIZ timeslices in memory for easy access.

Example:

```js
import {XVIZStreamBuffer} from '@xviz/parser';

const streamBuffer = new XVIZStreamBuffer();

// Add timeslices
streamBuffer.insert({
  timestamp: 10,
  streams: {
    '/vehicle_pose': {...},
    '/object/shape': {...}
  }
});
streamBuffer.insert({
  timestamp: 11,
  streams: {
    '/vehicle_pose': {...},
    '/object/shape': {...}
  }
});

streamBuffer.getLoadedTimeRange();
// {start: 10, end: 11}
streamBuffer.getStreams();
// {
//   '/vehicle_pose': [{...}, {...}],
//   '/object/shape': [{...}, {...}],
// }
```

Limited buffer example:

```js
import {XVIZStreamBuffer} from '@xviz/parser';

// Construct a limited buffer that covers +-1s from the current playhead
const streamBuffer = new XVIZStreamBuffer({startOffset: -1, endOffset: 1});

streamBuffer.setCurrentTime(10);
// Add timeslices
streamBuffer.insert({
  timestamp: 10,
  streams: {...}
});
streamBuffer.insert({
  timestamp: 11,
  streams: {...}
});

streamBuffer.getLoadedTimeRange();
// {start: 10, end: 11}

// Move playhead
streamBuffer.setCurrentTime(12);
// Out-of-range timeslices are dropped from memory
streamBuffer.getLoadedTimeRange();
// {start: 11, end: 11}
```

## Constructor

```js
const streamBuffer = new XVIZStreamBuffer();
```

Parameters:

- **options** (Object)
  - **startOffset** (Number) - offset in seconds. if provided, will not keep timeslices earlier than
    `currentTime - startOffset`. Default `null`.
  - **endOffset** (Number) - offset in seconds. if provided, will not keep timeslices later than
    `currentTime + endOffset`. Default `null`.
  - **maxLength** (Number) - length in seconds. if provided, the buffer will be forced to be no
    bigger than the specified length. Default `null`.

> There are three types of buffer: unlimited, offset, and fixed. Use the constructor options to set
> an offset buffer (relative to playhead). To set a fixed buffer with absolute timestamps, see
> `setFixedBuffer`.

## Members

##### size (Number)

The count of timeslices in buffer.

## Methods

##### getBufferRange()

Returns `{start, end}` timestamps that the buffer is currently accepting data for.

If the buffer is unlimited, returns `{start: null, end: null}`.

##### getLoadedTimeRange()

Returns `{start, end}` timestamps of the loaded timeslices.

If no timeslices are loaded, returns `null`.

##### getTimeslices(range)

Returns an array of timeslices within the given time range.

Parameters:

- **range** (Object, optional) - time range to retrieve timestamps by. If not provided, all loaded
  timeslices are returned.
  - **start** (Number) - start timestamp (inclusive)
  - **end** (Number) - end timestamp (inclusive)

##### getStreams()

Sort loaded timeslices by stream names. Returns a map of stream contents within the current buffer.

##### insert(timeslice)

Add a new XVIZ timeslice object into the timeline. Returns `true` if successful, `false` if the
timeslice is dropped due to limited buffer.

##### updateFixedBuffer(start, end)

Limit the buffer to be between fixed timestamps.

Parameters:

- `start` (Number) - desired fixed start time of buffer to keep in memory
- `end` (Number) - desired fixed end time of buffer to keep in memory. The range may not be longer
  than `maxLength` specified in the constructor.

Returns:

`{start, end, oldStart, oldEnd}` - the old and new buffer ranges

##### setCurrentTime(timestamp)

Set the current timestamp. Timeslices that are not in range will be dropped.

Parameters:

- `timestamp` (Number) - the new current time

##### valueOf()

Overrides `Object.prototype.valueOf`. The numeric value of the buffer changes whenever it receives
an update.
