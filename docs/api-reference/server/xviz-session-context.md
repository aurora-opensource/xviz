# XVIZSessionContext

This object provides state used during an
[XVIZSession](/docs/api-reference/server/overview-session.md) to the middleware components.

It also serves as a store for any such component to save state if is needs to do so for the duration
of the session. XVIZ Providers encapsulate the details of reading a particular XVIZ source and
returns an object that allows you to access metadata and iterate over the XVIZ messages.

## Constructor

## XVIZSessionContext(state)

Parameters:

- `state` (Object) - Initial state

## Methods

##### set(name, val)

Save state in the context.

Parameters:

- `name` (string) - Key to save state under
- `val` (Any) - Data to store in the context

##### get(name)

Access saved state

Parameters:

- `name` (string) - Key used to save state

Returns: (Any) - previously saved state

##### startTransform(id, state)

Initial tracking state for a transform request in flight

Parameters:

- `id` (string) - Identifier for this transform request
- `state` (Object) - State associated with this transform object

##### transform(id)

Access to saved transform state

Parameters:

- `id` (string) - Identifier used to save transform state

Returns: (Object) - state previously saved

##### endTransform(id)

Removal of transform state

Parameters:

- `id` (string) - Identifier for transform state to be removed
