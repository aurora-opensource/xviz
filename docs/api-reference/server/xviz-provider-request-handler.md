# XVIZProviderRequestHandler

XVIZProviderRequestHandler is a middleware component for an
[XVIZProvider](/docs/api-reference/io/overview-provider.md) that will respond to XVIZ messages
handle state management and event transitions based on the specific XVIZ requestevent transitions
based on the specific XVIZ request.

## Example

```js
this.middleware = new XVIZServerMiddlewareStack();

const stack = [
  new XVIZProviderRequestHandler(this.context, this.provider, this.middleware, this.options),
  new XVIZWebsocketSender(this.context, this.socket, this.options)
];
this.middleware.set(stack);
```

## Constructor

## XVIZProviderRequestHandler(context, provider, middleware, options)

Parameters:

- `context` ([XVIZSessionContext](/docs/api-reference/server/xviz-session-context.md)) - Shared
  session context to store data
- `provider` ([XVIZProvider](/docs/api-reference/io/overview-provider.md)) - An XVIZProvider
  instance
- `middleware`
  ([XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md)) -
  Middleware instance to route messages
- `options` (Object) - Options for the Server
  - `delay` (Number) - Millisecond delay between sending response messages
  - `logger` (Object) - Logger object passed through the system
    - `log` (Function) - Function that will always display the message
    - `error` (Function) - Function for error level messages
    - `warn` (Function) - Function for warning level messages
    - `info` (Function) - Function for info level messages
    - `verbose` (Function) - Function for verbose level messages
