# XVIZWebSocketSender

XVIZWebSocketSender is a middleware component that will send the XVIZ message through a websocket.

It will ensure that the data is properly formatted for sending over a websocket and convert the data
if necessary.

## Example

```
  // In the context of an XVIZSession class

  this.middleware = new XVIZServerMiddlewareStack();

  const stack = [
    new XVIZProviderRequestHandler(this.context, this.provider, this.middleware, this.options),
    new XVIZWebsocketSender(this.context, this.socket, this.options)
  ];
  this.middleware.set(stack);
```

## Constructor

## XVIZWebSocketSender(context, socket, options)

Parameters:

- `context` ([XVIZSessionContext](/docs/api-reference/server/xviz-session-context.md)) - Shared
  session context to store data
- `socket` (Object) - Websocket for the session
- `options` (Object) - options object
  - `compress` (Boolean) - Choice to apply perMessageDeflate if the message wire format is TEXT
  - `format` ([XVIZFormat](/docs/api-reference/io/xviz-format.md)) - Format of the XVIZ data to send
    to the client
  - `logger` (Object) - Logger object passed through the system
    - `log` (Function) - Function that will always display the message
    - `error` (Function) - Function for error level messages
    - `warn` (Function) - Function for warning level messages
    - `info` (Function) - Function for info level messages
    - `verbose` (Function) - Function for verbose level messages
