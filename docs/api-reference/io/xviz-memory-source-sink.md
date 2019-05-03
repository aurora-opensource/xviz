# MemorySourceSink

A memory-based implementation for both the Source interface and Sink Interface.

## Methods

### readSync(name)

Parameters:

- `name` (string) - The name used to identify the data

Returns: (Object|Buffer) - XVIZ data

### writeSync(name, data)

Parameters:

- `name` (string) - The name used to identify the data
- `data` (Object|string|ArrayBuffer|Buffer) - The data to write
