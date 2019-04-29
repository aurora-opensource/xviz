- Start Date: 2019-04-25
- RFC PR: [#?](https://github.com/uber/xviz/pull/?)
- XVIZ Issue: [#?](https://github.com/uber/xviz/issues/?)

# Summary

The current modules, **@xviz/builder** and **@xviz/parser**, do not provide general input/output
functionality and data types one would expect for working with XVIZ data nor are they a logical home
for such functionality.

This is the goal for the **@xviz/io** module. To provide the basic input/output functionality and
encapsulate the data and format variations across various interfaces to support the current and
future use-cases.

# Motivation

XVIZ currently defines two formats, JSON and Binary, with plans to support additional variations in
the near future. Examples would be the support for a single-file based bundle as well as a protobuf
format.

The initial XVIZ libraries where focused on a specific workflow. This new module will provide better
support for dealing with XVIZ without the need to deal with the internal details across the various
formats.

Today any consumer of XVIZ data must take into account the variety of formats as well as the
language specific constructs around the data encoding and types. This layer of consuming XVIZ will
only increase and having a central interface to handle this will make adding additional formats
significantly easier for both producers and consumers of XVIZ data.

A specific example in Javascript is the we can have 2 formats **JSON** and **Binary**. Each of these
can manifest in Javascript in the following ways:

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

- Addition of XVIZReader along with XVIZWriter
- Removal of `writeFrameIndex()` method from XVIZWriter. This is an implementation detail and the
  functionality will be moved to `close()`.

# Future Intentions

- Async is a cross cutting concern, this will be supported in JS with a parallel class structure,
  for example

  - will bubble up to sink/source => reader/writer => provider

- Readers/writers must know the specifics for any implementation details
- Providers should be the abstraction layer on top that operates with just metadata, and iterators

- bundle

  - src/sink will not change
  - add bundle specific reader/writer
    - json
    - binary
  - functionality for bundle will be subsumed into the current format providers

- protobuf

  - add reader/writer
  - add provider

- @xviz/parser
  - ideally XVIZMessage will evolve to provider data navigation, at that point parser should use the
    interface rather than access the data directly

# Detailed Design

**@xviz/builder** is use to build XVIZ data, but not to consume and maniuplate it. **@xviz/parser**
consumes XVIZ data, but transforms it into a different data schema that no longer conforms to the
specifcation and is intend solely for the streetscape.gl components.

There is a need, driven by our expanding XVIZ tooilng work, for a library that enables working with
standard compliant XVIZ data which does not exist today.

Currently the limited functionality need is contained within the modules on an as needed basis. This
is a problem in that each module has a specific purpose and the general XVIZ data handling types and
functions are spread out across these without a logical ordering.

The new module will provide the following abstractions:

- Source and Sinks
- Readers and Writers
- Providers

## Sources and Sinks

These deal with the lowest level of data and serialization. Files, Memory, and Websockets are
implemented behind these interfaces providing a simple interface for the layers above.

## Readers and Writers

Where Sources and Sinks deals with system level concepts, Reader and Writers are concerned with XVIZ
level constructs. Specifically the Metadata and Frames.

Readers and Writers take Sources and Sinks respectively and provide an XVIZ specific abstraction on
the basic data define within the XVIZ specification.

# Future considerations

- async

  - builder needs to be async
  - node/js has an Async assumption, and annotates with "Sync" when not. We are kinda backward :(
    The best I can come up with is to provide something similar with readAsync() an writeAsync(),
    but this propogates up the chain ReaderAsync, WriterSync( and then XVIZJSONAsyncProvider, etc

    ... i don't see how to (aside from making everything async) to break this stack.

    ... need to understand where synchronicity matters.. mainlyl out of order iteration as a
    possibility, but we should be resilient to that type of data flow and not expect it.

    dont' have any good answer here :'(

- how do bundle and protobuf fit within these layers XVIZJSONBundleWriter, XVIZJSONBundleReader
  - writer just needs a "close()" method. Reader interface needs nothing
  - well, we could remove the Index as an artifact of Close(), then that becomes an implementation
    detail that does not need to leak ... lives only in the Provider .. .. But there is a connection
    between Reader/Writer and Provide. ... right
- websocket

  - server defines it's own webSocketWriter, that could move here?

- xviz controller?

  - this should probably conform to the XVIZ middleware
  - not sure how this "evolves" with new message types/actions
  - kinda want to separate out messages and actions, but now it likely not a good time
    - also not sure what the value of this is.. need to think and define that

- middleware pattern and definition
  - cli (client) has a slightly different middleware than a producer (server)
  - define this and why

! phase out of direct data schema and move to interface based data access

- provides a layer for adaptation that raw data types do not

## impact

- update docs
- update test case
- update examples

phase 2 - refactor others

- refactor io & parser where necessary
  - this can be "delayed" as long as their interfaces don't change
  - what is Object today could be Object|XVIZData tomorrow, maybe
