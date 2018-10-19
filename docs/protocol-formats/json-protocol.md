# XVIZ JSON Protocol Format

The JSON XVIZ format is a straight forward mapping of the XVIZ protocol schema contained within an
envelope that denotes what type the object is.

## Data Type Conversion

The table below provides guidelines on how to convert the types specified in this document into
JSON.

| Type                                           | JSON Representation                |
| ---------------------------------------------- | ---------------------------------- |
| All Core Types (primitive, annotation, styles) | Object `{}`                        |
| `list<>`                                       | Array []                           |
| `map<>`                                        | Object `{"key": "value"}`          |
| `optional<T>`                                  | `null` if not present, otherwise T |

## Data Envelope

All XVIZ messages are enveloped with additional metadata about how to interpret them.

The possible message types are captured in the message_types enum. Supported types are:

- `session_start` - Sent from the client upon connection
- `session_reconfigure` - Sent from the client upon reconfiguration
- `session_metadata` - Sent from the server upon connection or reconfiguration
- `state_update` - Sent for messages containing primitives and variables

| Name   | Type           | Description                   |
| ------ | -------------- | ----------------------------- |
| `type` | `message_type` | Explicit type of this message |
| `data` | `message`      | The actual message itself     |

A JSON example of this envelope for a state update message is

```
{
    "type": "state_update",
    "data": {
        "update_type": "snapshot",
        "updates": ...
    }
}
```
