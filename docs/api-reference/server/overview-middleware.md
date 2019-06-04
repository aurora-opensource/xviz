# Middleware

The middleware provides a structured pipeline for controlling and customizing the data flow for a
message.

Middleware is managed by the
[XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md) and called
in order unless a handler chooses to stop further subsequent flow.

## Example

The [XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md) is
something that would be instantiated by an XVIZSession. The XVIZSession would create the middleware
then setup the components to define the pipeline for handing requests, manipulating data, and
sending the response.

```js
import {
  XVIZProviderRequestHandler
  XVIZMessageToMiddleware
  XVIZServerMiddlewareStack
  XVIZSessionContext
  XVIZWebsocketSender} from '@xviz/server';

export class ExampleSession {
  constructor(socket, request, provider, options) {
    this.socket = socket;
    this.provider = provider;
    this.request = request;
    this.options = options;

    // Session shared storage for the middlewares
    this.context = new XVIZSessionContext();

    // The middleware will manage calling the components in the stack
    this.middleware = new XVIZServerMiddlewareStack();

    // Setup a pipeline to respond to request and send back messages
    const stack = [
      new XVIZProviderRequestHandler(this.context, this.provider, this.middleware, this.options),
      new XVIZWebsocketSender(this.context, this.socket, this.options)
    ];
    this.middleware.set(stack);

    // The XVIZMessageToMiddleware object is a convenience class to
    // simply inspect a message and if it is an XVIZ message call the middleware
    this.handler = new XVIZMessageToMiddleware(this.middleware);

    this.socket.onmessage = message => {
      if (!this.handler.onMessage(message)) {
        // Handle non-XVIZ message here
      }
    };
  }
}
```

## Common Method Parameters

The middleware operates at an XVIZ message level.

Parameters:

- `message` ([XVIZData](/docs/api-reference/io/xviz-data.md)) - The message being processed by the
  middleware

Returns: (Boolean) - If `false` then this message flow should abort. Useful when one message type
triggers another message type or if an error occurs.

## Middleware Interface

##### onConnect()

Called when a connection is accepted.

##### onClose()

Called when a connection is closed.

### XVIZ Message Events

##### onStart(message)

Called when a `XVIZ/START` message is inititiated

##### onTransformLog(message)

Called when a `XVIZ/TRANFORM_LOG` message is inititiated

##### onError(message)

Called when a `XVIZ/ERROR` message is inititiated

##### onMetadata(message)

Called when a `XVIZ/METADATA` message is inititiated

##### onStateUpdate(message)

Called when a `XVIZ/STATE_UPDATE` message is inititiated

##### onTransformLogDone(message)

Called when a `XVIZ/TRANSFORM_LOG_DONE` message is inititiated

##### onReconfigure(message)

Called when a `XVIZ/TRANSFORM_LOG_DONE` message is inititiated
