# XVIZ Concepts

The description of the XVIZ protocol is based a number of concepts that are introduced here.


## Datum

A data object (typically from a robotics system) that we wish to visualize.


## Stream

A stream is a sequence of timestamped datums of similar structure. Different types of datums are organized in different streams.

* **Stream Name** - Each stream must be given a logical name. The application defines these names, XVIZ does not reserve or give special interpretation to any names, however `/` separators can be used in names to indicate hierarchy.
* **Stream Type** - The type of a stream is defined by what kind of datums it contains.

The following stream types are predefined by the protocol, and the XVIZ client library contains support for parsing and displaying them:

* **Pose Stream** - A set of positions that describes the position of an actor and any relative coordinate system(s) it defines.
* **Geometry Types** - geometry primitives
* **Tree Table** - hierarchical data structure, use to convey dense record type data
* **Image Stream** - Binary format image data


## Source

A source of XVIZ streams. A source can be a pre-generated log loaded from a URL or a file, but it can also be a live data served over e.g. a socket.

Each source contains one or more streams, as well as a metadata about the streams.


## Video

XVIZ can sync with external video sources provided that they have been encoded in a suitable way.


## Metadata

A special XVIZ message that contains descriptive information about the data source and its streams.


## Primitive

An XVIZ primitive is a geometric object such as a point, line, polygon etc that should be visualized. It can be tagged and given special styling (color etc).


## Object

Objects can be defined by attaching object identifiers to geometry primitives, which will define an object identity across time slices.


## Variable

A sequences of values the occur at a one time.  Like the speed of travel over a planned path for a vehicle.  Each time time you get an update to a variable stream, the full list of values changes.


## Time Series

Time stamped values can be included in streams.  Each time the stream updates you get a new timestamp, value pair.


## Style

XVIZ support a form of style sheets, allowing object properties such as colors, line widths etc to be specified based on e.g. classes.


## Encoding

The XVIZ protocol specification does not prescribe any given encoding, however the XVIZ libraries come with support for parsing a JSON encoding.
