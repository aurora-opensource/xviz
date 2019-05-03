# XVIZMessageType

Message Type returned from [XVIZData](/docs/api-reference/io/xviz-data.md)

## Enumeration values

- `START` - Initiate a new XVIZ session
- `ERROR` - An error from the server
- `DONE` - Indication that a session is finished
- `STATE_UPDATE` - An XVIZ state message
- `TRANSFORM_LOG` - An XVIZ transform request
- `TRANSFORM_LOG_DONE` - Indication that a transform request is finished
- `TRANSFORM_POINT_IN_TIME` - An XVIZ transform request for a specific time
- `RECONFIGURE` - A reconfiguration message to alter the XVIZ data that is being sent
