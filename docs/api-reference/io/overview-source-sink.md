# XVIZ Source and Sink

Sources provide a simplified interface for reading XVIZ data from various data sources as a block of
data.

Sinks provide an interface to write data as an XVIZ message.

## Source Interface Methods

### readSync(name)

Parameters:

- `name` (string) - The name used to identify the data

Returns: (Object|Buffer) - XVIZ data

## Sink Interface Methods

### writeSync(name, data)

Parameters:

- `name` (string) - The name used to identify the data
- `data` (Object|string|ArrayBuffer|Buffer) - The data to write
