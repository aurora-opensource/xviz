# @xviz/io

The **@xviz/io** module deals with reading and writing XVIZ data in the various formats supported by
XVIZ.

The module also provides classes to inspect and manipulate XVIZ data.

## XVIZ data objects

XVIZ defines messages which are wrapped around an envelope marking each message with an explicity
type. There is additional information useful for hosting XVIZ data but not necessary for a client
which is an index.

This index allows a quick lookup for a specific timestamp so time range queries can be quickly
served.

[Session link]()

### Index

The index provides the ability to quickly find the timestamp range associated with a particular
frame.

### Metadata

The metadata provides supporting information about the XVIZ data context, streams, and UI bindings.

### Frames

A frame of data consists of a set of XVIZ state updates and covers a span of time.

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

The object [XVIZData](/docs/api-references/io/xviz-data.md) handles consuming any format and
providing access to the XVIZ data through the
[XVIZMessage](/docs/api-references/io/xviz-message.md).

## Readers and Writers

This layer builds upon the Source and Sink to deal with the XVIZ data types of Index, Metadata, and
Frames.

[Readers](/docs/api-reference/io/overview-writer.md) provide an interface to access the three data
objects.

[Writers](/docs/api-reference/io/overview-writer.md) provide an interface to write the three data
objects.

This layer builds upon the XVIZ Sink, and deals with the XVIZ data types of Index, Metadata, and
Frames.

## Provider

An offers a high-level way to access the data and iterate over a range of the data.

An [XVIZ Provider](/docs/api-reference/io/overview-provider.md) abstracts the specific details of
how XVIZ data is stored and simply offers up an interface to get the data.

A concrete example would be the standard storage of JSON or Binary XVIZ follows a convention of
sequentially numbered files with a corresponding extension. The specifics of the filename and the
extension are not critical to accessing the data, they are simply an artifact of the implementation.
This is the details a Provider would encapsulate and instead provide access to the specific data
types an application would care about.
