# XVIZ Concepts

The description of the XVIZ protocol is based on a number of concepts that are introduced here.

## Datum

A data object (typically from a robotics system) that we wish to visualize.

## Stream

A stream is a sequence of timestamped datums of the same type. Different types of datums are
organized in different streams.

- **Stream Name** - Each stream must be given a unique name. The application defines these names,
  XVIZ requires the names follow a path-like structure separated by '/', such as
  '/vehicle/velocity'.
- **Stream Type** - The type of a stream is defined by what kind of datums it contains.

The following stream types are predefined by the protocol, and the XVIZ client library contains
support for parsing and displaying them:

- **Pose Stream** - A set of positions that describes the position and orientaton of an actor and
  any relative coordinate system(s) it defines.
- **Geometry Types** - geometry primitives
- **Variables** - arrays of data
- **Time series** - individual samples of a larger series
- **Tree Table** - hierarchical data structure, use to convey dense record type data
- **Image Stream** - Binary format image data

## Source

A source of XVIZ streams. A source can be a pre-generated log loaded from a URL or a file, but it
can also be a live data served over e.g. a socket.

Each source contains one or more streams, as well as a metadata about the streams.

## Metadata

A special XVIZ message that contains descriptive information about the data source and its streams.

## Primitive

An XVIZ primitive is a geometric object such as a point, line, polygon etc that should be
visualized. It can be tagged and given special styling (color etc).

## Style

XVIZ supports a form of stylesheets, allowing object properties to be specified based on stream and
class.

## Object

Objects can be defined by attaching identifiers to primitives, variables, and time series. The
identifier enables linking information across streams and time slices.

## Variable

A sequences of values the occur at a one time. Like the speed of travel over a planned path for a
vehicle. Each time you get an update to a variable stream, the full list of values changes.

## Time Series

Time stamped values can be included in streams. Each time the stream updates you get a new
timestamp, value pair.

## Declarative UI

A structured data schema that will map UI elements, such as plots, controls, tables, and video
panels along with the stream name data bindings. This data is sent with the metadata to keep it
closely coupled to the data source.

## Video

XVIZ can sync with external video sources provided that they have been encoded in a suitable way.

## Encoding

The XVIZ protocol specification does not prescribe any given encoding, however the XVIZ libraries
come with support for encoding and parsing in JSON.
