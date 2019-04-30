- Start Date: 2019-04-29
- RFC PR: [#435](https://github.com/uber/xviz/pull/435)
- XVIZ Issue: [#434](https://github.com/uber/xviz/issues/434)

# Summary

The current modules, **@xviz/builder** and **@xviz/parser**, do not provide general input/output
functionality and data types one would expect for working with XVIZ data nor are they a logical home
for such functionality.

The goal for the **@xviz/io** module is to provide the basic input/output functionality and
encapsulate the data and format variations across various interfaces to support the current and
future use-cases.

# Motivation

XVIZ currently defines two formats, JSON and Binary, with plans to support additional variations in
the near future. Examples would be the support for a single-file based bundle as well as a protobuf
format.

The initial XVIZ libraries where focused on a specific workflow, mainly creating data for
streetscape.gl. This new module will provide better support for dealing with existing XVIZ data
without the need to deal with the internal details across the various formats.

Today any consumer of XVIZ data must take into account the variety of formats as well as the
language specific constructs around the data encoding and types. This layer of consuming XVIZ will
only increase and having a central interface to handle this will make adding additional formats
significantly easier for both producers and consumers of XVIZ data.

A specific example in Javascript is that we can have 2 formats **JSON** and **Binary**. Each of
these can manifest in Javascript in the following ways:

- JSON
  - string
  - ArrayBuffer
  - Buffer
- Binary
  - ArrayBuffer
  - Buffer

Consolidating the handling of this makes consuming XVIZ much simpler, and more robust when new
formats or variations are added.

In addition, there are some asymetries in the interfaces and functionality as well as exposure to
implementation details that should be removed.

# Detailed Design

**@xviz/builder** is use to build XVIZ data, but not to consume and manipulate it. **@xviz/parser**
consumes XVIZ data, but transforms it into a different data schema that no longer conforms to the
specifcation and is intend solely for the streetscape.gl components.

Currently the limited functionality need is contained within the modules on an as needed basis. This
is a problem in that each module has a specific purpose and the general XVIZ data handling types and
functions are spread out across these without a logical ordering.

The new module will provide the following abstractions:

- Data Objects
- Source and Sinks
- Readers and Writers
- Providers

## XVIZ Data Classes

XVIZ data can come in many encodings and formats. In order consolidate parsing the encoding and
formats two new class [XVIZData](/docs/api-reference/io/xviz-data.md) and
[XVIZMessage](/docs/api-reference/io/xviz-message.md) are being introduced.

**XVIZData** handles the basic formating and encoding determination, but strives to be performant
for workflows where you just need to know the type of the data but do not needed to access any
internal information.

**XVIZMessage** is accessible from an XVIZData class and provides the parsed XVIZ data for accessing
the internal state.

## Sources and Sinks

[Source and sinks](/docs/api-reference/io/overview-source-sink.md) deal with the lowest level of
data access. Files, Memory, and Websockets can be implemented behind these interfaces providing a
simple interface for the layers above.

## Readers and Writers

[Reader](/docs/api-reference/io/overview-writer.md) and
[Writers](/docs/api-reference/io/overview-reader.md) are concerned with XVIZ level constructs.
Readers and Writers take Sources and Sinks, respectively, and provide an interface for dealing with
Metadata and Frames.

# Providers

[Providers](/docs/api-reference/io/overview-provider.md) are a level above Readers and Writers where
a Provider provides an generic interface for accessing core XVIZ data encapsulating any
implementation details.

# Future Plans

To make the intention behind these types clearer lets imagine some likely future developments and
how they would take shape in the **@xviz/io** module.

## Async support

Async support would be a very useful addition to the XVIZ eco-system for Javascript. The Node
convention for this support has a precedent of using suffix to denote the behavior, such as adding
"-Sync" to the method or class name.

We can see already that the Reader and Writer define `readSync` and `writeSync`.

Focusing on the read flow, one approach would be to add the method `readAsync` which returns a
Promise. A Source supporting this asynchronous method, lets imagine a class **FileSourceAsync**,
would be passed to an appropriate asynchronous reader **XVIZJSONReaderAsync**.

The class **XVIZJSONReaderAsync** has to know it is dealing with an asynchronous source, and would
expose read methods in kind. However, since the majority of the code would be a duplicate of
**XVIZJSONReader**, we would refactor these two classes to a base class that handles everything
except the calls on the source.

Next would come the **Provider** to abstract away whether you are dealing with JSON data or Binary
data, and instead just deal with XVIZ data. The interface for a **Provider** **already** defines the
main iteration function as asynchronous. However the implementation of the Provider needs to
interact with the reader which does carry the distinction, therefore we would have to create an
**XVIZJSONProviderAsync**. Again, we would likely refactor to a base class factoring out the
synchronous calls sites as necessary.

This highlights a case that cuts across all the layers of the module.

## Bundle format

A **bundle** is the packing of metadata and frames inside a single file. This may include both JSON
and Binary formatting of the data.

Since this deals with how the data is managed at the implemenation level we would need a
**XVIZJSONBundleReader** and **XVIZJSONBundleWriter**. A **XVIZJSONBundleProvider** would also be
needed to provide an the XVIZ specific interface on top of the data, removing that fact that happens
to be packaged as a **bundle** from the calling code.

There is no need for any change at the Source or Sink level since they operate at a data block
level. The entire bundle would simply be passed as necessary.

## Protobuf format

A **protobuf** format is similar to the bundle, in that it exposes a particular format of the
underlying data. So the solution is the same, we need a **XVIZProtobufReader** and an
**XVIZProtobufProvider**. However any code relying on the XVIZProvider interface would not need to
be changed regardless of the XVIZ data format.
