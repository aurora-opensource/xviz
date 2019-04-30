# XVIZ Source and Sink

Sources provide a simplified interface for reading XVIZ data from various data sources as a block of
data.

Sinks provide an interface to write data as an XVIZ message.

## SourceInterface

Interface to read an XVIZ message

## Methods

### readSync(name)

_Parameters:_

- **name** - The name used to identify the data source

# SinkInterface

Interface to write XVIZ data.

## Methods

## writeSync(name, data)

_Parameters:_

- **name** - The name used to identify the data source
- **data** - The data to write
