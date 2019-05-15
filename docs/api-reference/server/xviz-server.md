# XVIZServer

The XVIZServer will listen on a port for connections. Upon a connection the server will attempt to
find a handler that can satisfy the request. If a handler is found it will be called to manage the
request else the socket will be closed.

## Example

```js
import {XVIZServer} from '@xviz/server';

// Construction of 'handler'

const ws = new XVIZServer([handler], options, () => {
  console.log(`Listening on port ${ws.server.address().port}`);
});
```

## Constructor

## XVIZServer(handlers, options, cb)

The `options` argument is passed through to the underlying Websocket server.

Parameters:

- `handlers` (Array) - Set of [XVIZHandler](/docs/api-reference/server/overview-handler.md)
  instances to service requests
- `options` (Object) - Options for the Server

  - `options.port` (Number) - Port to listen on
  - `options.maxPayload` (Number) - Port to listen on
  - `options.perMessageDeflate` (Boolean) - Setting if message compress on the websocket is enabled
  - `options.delay` (Number) - millisecond delay between sending response messages
  - `options.logger` (Object) - logger object passed through the system

    - `options.logger.log` (Function) - Log function that will always display the message
    - `options.logger.error` (Function) - Log function for error level messages
    - `options.logger.warn` (Function) - Log function for warning level messages
    - `options.logger.info` (Function) - Log function for info level messages
    - `options.logger.verbose` (Function) - Log function for verbose level messages

- `cb` (Function) - Function callback called when the server is listening.

## Properties

##### server

Access to the underlying server object.

Returns: (Object) - The underlying WebSocket server object

## Methods

##### close()

Terminate the server.

##### async handleSession(socket, request)

Upon a `connection` event this will be called to delegate to the registered handlers and hand over
the connection handling to the first session returned from a handler.

Parameters:

- `socket` (Object) - Socket object TODO link to node/external docs
- `request` (Object) - Request object TODO link to node/external docs
