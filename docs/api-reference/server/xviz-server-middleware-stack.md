# XVIZServerMiddlewareStack

XVIZServerMiddlewareStack defines and conforms to the
[Middleware Interface](/docs/api-reference/io/overview-middleware.md) and routes messages through
the middleware stack.

It serves as the entrypoint to the entire middleware dataflow.

## Constructor

## XVIZServerMiddlewareStack(middlewares)

Parameters:

- `middlewares` (Array) - Set of middleware components

## Methods

##### set(middlewares)

Sets the middleware stack.

Useful when you must construct the stack after construction of the XVIZServerMiddlewareStack
instance due to it being a dependency of a middleware component.

Parameters:

- `middlewares` (Array) - Set of middleware components
