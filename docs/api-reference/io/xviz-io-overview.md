# Overview of @xviz/io

XVIZ data can be formatted as [JSON](/docs/api-reference/protocol-formats/json-protocol.md) and
[Binary](/docs/api-reference/protocol-formats/json-protocol.md). This library provides objects to
deal with XVIZ data regardless of the format as well as serialize the data to the desired format.

## Data Objects

XVIZ data is often passed through without modification, for example when simply serving the data for
an application. In this common flow the goal is to be as performant as possible and avoid any
unnecessary processing of the data. For this reason there are two main classes to separate out
passthrough handling of data verses access and modification of XVIZ data.

[XVIZData](/docs/api-reference/xviz-data.md) is the owner of the data and is a light object wrapper
which can determine the format and type of XVIZ data w/o requiring a full parse of the data. This
makes it ideal for the pass through case when data does not need to be inspected or modified.

[XVIZMessage](/docs/api-reference/xviz-message.md), which can be created from an _XVIZData_ object,
is a parsed XVIZ object and provides access to the internals and more suited for when the data needs
accessed or mutated.

## Writers

Writers serialize XVIZ data.

[XVIZJSONWriter](/docs/api-reference/xviz-json-writer.md)
[XVIZBinaryWriter](/docs/api-reference/xviz-binary-writer.md)

- Used by builder
- TODO: DOES not support XVIZData, just raw object unenveloped

## Readers

Readers de-serialize XVIZ data.

[XVIZJSONReader](/docs/api-reference/xviz-json-reader.md)
[XVIZBinaryReader](/docs/api-reference/xviz-binary-reader.md)

## Sources and Sinks

Sources and Sinks are simple abstractions to isolate from the underlying platform specific
interfaces.

### File based data

The file based source and sink are useful for dealing with saved XVIZ data.

- [XVIZFileSource](/docs/api-reference/xviz-file-source.md)
- [XVIZFileSink](/docs/api-reference/xviz-file-sink.md)

### Memory based

The memory based sources and sinks useful for testing.

- [XVIZMemorySource](/docs/api-reference/xviz-memory-source.md)
- [XVIZMemory](/docs/api-reference/xviz-memory-sink.md)

## Utilities

[XVIZFormatter](/docs/api-reference/xviz-formatter.md) is a conversion function for taking XVIZData
and converting it to another format. This supports converting from JSON to Binary, along with format
specific options.
