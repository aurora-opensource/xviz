# XVIZ v2.0.0 Protocol Specification

## Overview

XVIZ is an abstract visual world state description format that can be updated both incrementally and
with complete snapshots. It is designed to separate the reduction of large complex data streams into
a logical visual hierarchy from the building of rich applications to view that data.

## Data Model

Here is a map of all the objects in a typical XVIZ world state:

### Streams and World State

XVIZ divides the state of the world into a set of streams. This allows user to quickly explore and
filter the visual world to suit their use case. Each stream changes over time atomically. The world
state represents a complete set of all the latest stream states for a particular time.

### Primitives and Objects

The base types of XVIZ are individual elements of data: primitives, variables and time series.

- **Primitives** are abstract geometries.
- **Variables** are arrays of data (often over time).
- **Time series** are individual samples of a larger series.

These individual elements have a common semantics meaning, which is captured by the collection they
are contained within, the stream.

As an example, the stream `/object/shape` would contain all primitive shapes, while /object/velocity
would contain the numeric value for the objects' velocities.

Since the representation for an object is split across streams, XVIZ base types can have an ID which
will be used to maintain the relationship of the data. In the example above, the /shape stream would
transmit the object’s shape information, while the /velocity stream would transmit the object’s
velocity information. These streams are separated for ease of parsing and improved data
compression - for example, object shapes may only need to be updated once per second, whereas
velocities might be more useful updated 10 times per second.

### Poses

A core part of XVIZ is knowing the location of the vehicle(s) so they can be displayed relative to
the other data. This defines the location of the vehicle from it's own arbitrary frame, along with
it's location in latitude, longitude, form.

### Styles

Similar to CSS each primitive can have one or more classes, each of which can have associated style
information. This allows the styling information to be sent out of band with the main data flows,
and only once. In addition, just like in HTML and CSS, styling information can be sent inline for
each object. Learn more in the [style specification](/docs/protocol-schema/style-specification.md).

### Annotations

Annotations are themselves sent as XVIZ streams, but provide strictly supplemental information for
another stream. Annotations are used when one team needs to append additional visual information to
objects other than their own.

## Implementations

XVIZ is used when talking to a server or reading data exported and stored on disk. To learn more
about them see:

- [Session Protocol](/docs/protocol-schema/session-protocol.md)
- ETL - current unspecified

> Need XVIZ OSS specification for XVIZ 2.0 ETL format

Both of those methods can use either of the two public XVIZ protocol implementations to encode the
types described below:

- [JSON protocol](/docs/protocol-formats/json-protocol.md) - a straight forward mapping of above
  types into JSON
- [Binary protocol](/docs/protocol-formats/binary-protocol.md) - a Hybrid JSON binary protocol
  designed for larger data sets and faster performance
