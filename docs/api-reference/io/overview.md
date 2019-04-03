# @xviz/io

The **@xviz/io** module deals with reading and writing XVIZ data in the various formats supported by
XVIZ.

The module also provides classes to inspect and manipulate XVIZ data.

![@xviz/io diagram](./images/xviz-io-block-diagram.svg)

_Diagram of the @xviz/io class relationships and data flow_

# Module Classes

## Sources and Sinks

These objects provide a simple abstraction over reading and writing data across various data storage
types. This layer provides an abstraction over the concrete details of reading and writing data, be
it File, Memory, or a Socket.

## XVIZ Data classes

The XVIZ specification defines the shape of the data, but that data can be represented in different
formats, such as JSON or our GLB-based binary format.

In Javascript the representation of each can vary further.

- Object
- JSON
  - string
  - ArrayBuffer
  - Buffer
- Binary
  - ArrayBuffer
  - Buffer

On top of this, in the future we expect additional formats, such as with protobuf, and therefore we
want to isolate a client from the concrete form the data takes by providing an interface to take
care of the format details.

The object [XVIZData](/docs/api-reference/io/xviz-data.md) handles consuming any format and
providing access to the XVIZ data through the [XVIZMessage](/docs/api-reference/io/xviz-message.md).

The data is still owned and managed by the XVIZData class and XVIZData is the class that should be
passed around in an API.

## Readers and Writers

This layer builds upon the Source and Sink to deal with the XVIZ data types of Metadata and Frames.

[Readers](/docs/api-reference/io/overview-reader.md) provide an interface to access the data
objects.

[Writers](/docs/api-reference/io/overview-writer.md) provide an interface to write the data objects.

## Providers

An [XVIZ Provider](/docs/api-reference/io/overview-provider.md) encapsulates the specific details of
the concrete XVIZ data format and provides a generic interface to access metadata and frames.
