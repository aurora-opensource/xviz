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
  - `worker` (Boolean|String) - use Web Wroker to parse the message. Enabling worker is recommended
    to improve loading performance in production. Default `false`.
    - boolean: whether to use the default worker. Note that callbacks in XVIZ config are ignored by
      the default worker. If you need to inject custom hooks into the parsing process, create a
      custom worker using [streamDataWorker](#streamDataWorker-experimental).
    - string: a custom worker URL to use.
  - `maxConcurrency` (Number) - the max number of workers to use. Has no effect if `worker` is set
    to `false`. Default `4`.
  - `capacity` (Number) - the limit on the number of messages to queue for the workers to process,
    has no effect if set ot `null`. Default `null`.

##### LOG_STREAM_MESSAGE

Enum of stream message types.

- `METADATA`
- `TIMESLICE`
- `ERROR`
- `INCOMPLETE`
- `DONE`

## streamDataWorker (experimental)

Create a custom worker for message parsing. This allows an app to inject callback hooks into the
parsing process.

```js
// worker.js
import {streamDataWorker} from './stream-data-worker';

streamDataWorker({
  preProcessPrimitive: primitive => {
    if (primitive.type === 'circle') {
      primitive.center[2] += 0.1;
    }
  }
})(self);
```

##### streamDataWorker(config)

Returns a function that initializes a
[WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) to talk to
the XVIZ parser on the main thread.

Parameters:

- **config** (Object) - an [XVIZ config](/docs/api-reference/xviz-configuration.md) object.
