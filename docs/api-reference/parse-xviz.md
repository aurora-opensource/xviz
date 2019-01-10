# parseStreamMessage

```js
import {parseStreamMessage, LOG_STREAM_MESSAGE} from '@xviz/parser';

parseStreamMessage({
  message,
  onResult: data => {
    switch (data.type) {
      case LOG_STREAM_MESSAGE.METADATA: // do something
      case LOG_STREAM_MESSAGE.TIMESLICE: // do something
      case LOG_STREAM_MESSAGE.INCOMPLETE: // do something
    }
  },
  onError: console.error,
  worker: true
  maxConcurrency: 4
});
```

Parameters:

- `opts` (Object)
  - `message` (Object|String|ArrayBuffer) - XVIZ message to decode.
  - `onResult` (Function) - callback if the message is parsed successfully. Receives a single
    argument `data`. `data.type` is one of `LOG_STREAM_MESSAGE`.
  - `onError` (Function) - callback if the parser encouters an error.
  - `debug` (Function) - callback to log debug info.
  - `worker` (Boolean) - whether to use Web Wrokers to parse the message. Enabling worker generally
    improves loading performance. Default `false`.
  - `maxConcurrency` (Number) - the max number of workers to use. Has no effect if `worker` is set
    to `false`. Default `4`.

## LOG_STREAM_MESSAGE

Enum for stream message types.

- `METADATA`
- `TIMESLICE`
- `ERROR`
- `INCOMPLETE`
- `DONE`
