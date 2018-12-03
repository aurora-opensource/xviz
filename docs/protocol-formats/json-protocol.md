# XVIZ JSON Protocol Format

The JSON XVIZ format is a straight forward mapping of the XVIZ protocol schema contained within an
optional envelope that denotes what type the object is.

## Data Type Conversion

The table below provides guidelines on how to convert the types specified in this document into
JSON.

| Type                                           | JSON Representation                          |
| ---------------------------------------------- | -------------------------------------------- |
| All Core Types (primitive, annotation, styles) | Object `{}`                                  |
| `list<>`                                       | Array []                                     |
| `map<>`                                        | Object `{"key": "value"}`                    |
| `optional<T>`                                  | `null` or absent if not present, otherwise T |

## WebSocket Data Envelope

This bundles the XVIZ messages in additional layer, allowing you to tell what type the message is,
as well pass application specific messages on the same WebSocket connection as XVIZ data.

The fields of the message

| Name   | Type     | Description                          |
| ------ | -------- | ------------------------------------ |
| `type` | `string` | `namespace/type`                     |
| `data` | `Object` | The actual message XVIZ or otherwise |

Known namespaces:

- `xviz`

The valid XVIZ message types are:

- `session_start` - Sent from the client upon connection
- `session_metadata` - Sent from the server upon connection or reconfiguration
- `transform_log` - Sent from client to the server to request data
- `state_update` - Sent from the server to the client, contains XVIZ the data
- `transform_log_done` - Sent from server to the client to indicate completion
- `error` - Sent from server to client indicate a failure of some kind

### Examples

The start message sent from the server to the client:

```
{
    "type": "xviz/session_start",
    "data": {
        "version": "2.0.0",
        "session_type": "live",
        "message_format": "json"
    }
}
```

The metadata message, the first message sent from the server to the client:

```
{
    "type": "xviz/session_metadata",
    "data": {
        "version": "2.0.0",
        ...
    }
}
```

A state update message sent from the server to the client:

```
{
    "type": "xviz/state_update",
    "data": {
        "update_type": "snapshot",
        "updates": [
            ...
        ]
    }
}
```
