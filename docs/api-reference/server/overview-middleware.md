# Middleware

The middleware provides a structured pipeline for controlling and customizing the data flow for a
message.

Middleware is managed by the
[XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware.md) and called in
order unless a handler chooses to stop further subsequent flow.

The arguments to every method are the same

## Common Method Parameters

Parameters:

- `message` ([XVIZData](/docs/api-reference/io/xviz-data.md)) - The message being processed by the
  middleware

Returns: (Boolean) - If `false` then this message flow should abort. Useful when one message type
triggers another message type or if an error occurs.

## Session Events

##### onConnect()

Called when a connection is accepted.

##### onClose()

Called when a connection is closed.

### XVIZ Message Events

##### onStart(message)

Called when a `xviz/start` message is inititiated

##### onTransformLog(message)

Called when a `xviz/tranform_log` message is inititiated

##### onError(message)

Called when a `xviz/error` message is inititiated

##### onMetadata(message)

Called when a `xviz/metadata` message is inititiated

##### onStateUpdate(message)

Called when a `xviz/state_update` message is inititiated

##### onTransformLogDone(message)

Called when a `xviz/transform_log_done` message is inititiated

##### onReconfigure(message)

Called when a `xviz/transform_log_done` message is inititiated
