# XVIZMessage

An XVIZMessage is a simple wrapper around an XVIZ message object.

The XVIZData object the message was provided by retains a reference to the XVIZMessage and should be
the primary object that is passed between functions.

## Constructor

Parameters:

- `data` (Object|string|ArrayBuffer|Buffer) - XVIZ data of any format.

## Properties

- `type` ([XVIZMessageType](/docs/api-reference/io/xviz-message-type.md)) - The type of the message
- `data` (Object) - The underlying [Message Data](/docs/protocol-schema/session-protocol.md).
