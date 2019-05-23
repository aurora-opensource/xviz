# XVIZSession Interface

An object satisfying this interface is returned by an
[XVIZHandler](/docs/api-reference/server/overview-handler.md) to manage the socket and messages. The
session is responsible for for routing the socket message through the
[XVIZServerMiddlewareStack](/docs/api-reference/server/xviz-server-middleware-stack.md).

### Interface Methods

##### onConnect()

This marks the beginning of a connect that will be handled by this session. The concrete class
implementing this function should be passed all necessary state in the constructor.
