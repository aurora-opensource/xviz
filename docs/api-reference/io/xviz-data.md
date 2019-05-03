# XVIZData

The XVIZData object handles dealing with the various formats XVIZ data can take and providing a
light-weight data container to get the XVIZ message type.

XVIZData specifically will avoid parsing the underlying data unless the `message()` method is
called. The intention is to ensure we have a way to identify the message type without incurring the
cost of parsing when the data is part of a simple pass-through data flow. A common case when hosting
XVIZ data from a server.

## Constructor

Parameters:

- `data` (Object|string|ArrayBuffer|Buffer) - XVIZ data of any format

## Properties

- `buffer` (Object|string|ArrayBuffer|Buffer) - the original data passed into this object
- `format` ([XVIZFormat](/docs/api-reference/io/xviz-format.md)) - The format of the data

## Methods

### message()

Parses the data and returns an [XVIZMessage](/docs/api-reference/io/xviz-message.md).

Returns: ([XVIZMessage](/docs/api-reference/io/xviz-message.md)) - Object to access XVIZ data

### hasMessage()

Returns: (Boolean) - `true` if the original data has been parsed into a message.
