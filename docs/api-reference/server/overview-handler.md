# XVIZHandler Interface

An XVIZHandler will be called to provide an
[XVIZSession](/docs/api-reference/server/overview-session.md) to handle the request made to the
[XVIZServer](/docs/api-reference/server/xviz-server.md).

### Interface

##### async newSession(socket, request)

Using the `socket` and `request` a handler must decide if this connection can be handled.

Parameters:

- `socket` (Object) - The socket from the server
- `request` (Object) - The request object from the server

Returns: ([XVIZSession](/docs/api-reference/server/overview-session.md)) - A session to handle this
connection.
