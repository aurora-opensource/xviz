# Middleware

The middleware provides a structured pipeline for controlling and customizing the data flow for a
request.

Middleware is managed by the
[XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware.md) and called in
order unless a handler chooses to stop further subsequent flow.

The arguments to every method are the same

## Common Method Parameters

Parameters:

- `request` ([XVIZData](/docs/api-reference/io/xviz-data.md)) - The message received from the client
- `response` ([XVIZData](/docs/api-reference/io/xviz-data.md)) - XVIZ data to be sent back to client

Returns: (Boolean) - If `false` then this message flow should abort. Useful when one message type
triggers another message type or if an error occurs.

## Session Events

##### onConnect(request, response)

Called when a connection is accepted.

##### onClose()

Called when a connection is closed.

### XVIZ Message Events

##### onStart(request, response)

Called when a `xviz/start` message is inititiated

##### onTransformLog(request, response)

Called when a `xviz/tranform_log` message is inititiated

##### onError(request, response)

Called when a `xviz/error` message is inititiated

##### onMetadata(request, response)

Called when a `xviz/metadata` message is inititiated

##### onStateUpdate(request, response)

Called when a `xviz/state_update` message is inititiated

##### onTransformLogDone(request, response)

Called when a `xviz/transform_log_done` message is inititiated

##### onReconfigure(request, response)

Called when a `xviz/transform_log_done` message is inititiated
