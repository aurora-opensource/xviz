# XVIZMessageToMiddleware

XVIZMessageToMiddleware is a convenience class that will inspect a message and determine if it is an
XVIZ message. If it is, it will forward that message to the
[XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md)

## Example

```js
class ExampleSession {
  constructor(socket) {
    this.socket = socket;

    // Create the middleware instance
    this.middleware = new XVIZServerMiddlewareStack();

    // Create XVIZMessageToMiddleware to inspect and route XVIZ messages
    this.handler = new XVIZMessageToMiddleware(this.middleware);

    // Example calling XVIZMessageToMiddleware.onMessage()
    // to handle a raw socket message
    this.socket.onmessage = message => {
      if (!this.handler.onMessage(message)) {
        // Handle non-XVIZ message here
      }
    };

    // Example calling XVIZMessageToMiddleware.callMiddleware()
    // to handle an explicit XVIZ message
    this.socket.onopen = () => {
      this.handler.callMiddleware('START', params);
    };
  }
```

## Constructor

## XVIZMessageToMiddleware(middleware, options)

Parameters:

- `middleware`
  ([XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md)) -
  Middleware instance to route messages
- `options` (Object) - options
  - `logger` (Object) - Logger interface

## Methods

##### onMessage(message)

Method for handling websocket messages.

Parameters:

- `middleware`
  ([XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md)) -
  Middleware instance to route messages
- `options` (Object) - options
  - `logger` (Object) - Logger interface

##### callMiddleware(xvizType, message)

Method to directly dispatch XVIZ message

Parameters:

- `xvizType` (string) - XVIZ message type
- `message` (Object) - An XVIZ message
