# Structure of XVIZ-encoded data

This is a brief summary of [XVIZ concepts](./docs/overview/concepts.md),

## File Structure

### Binary GLB files

XVIZ can be encoded into binary GLB files. The GLB files are containers (or "envelopes") that hold a
JSON encoded data structure and a number of binary chunks, typically representing JPEG or PNG
encoded images and big geometries like point clouds.

### Message

Various datums with range of timestamps inside a given time window are collected into a "message",
typically containing one timestamp of each datum type.

Per "convention", one message is encoded in one `.glb` file, which allows a streaming server to
simply send one GLB file per message over the socket. That said it is possible to store multiple
messages in each GLB file.

### Streams

A message can contain multiple streams. This makes it easy to allow multiple data producers to write
into the same message and makes it easy for the client to distinguish data from different producers.

Note that all streams contain the same type of data (geometrical primitives, variables etc), so
clients can just combine the data from all streams and display it, without knowing what the actual
streams are.

### JSON files

XVIZ can also be encoded in JSON. The advantages of binary encoding large data is lost, but the
broad array of tools available to manipulate and inspect JSON are useful when troubleshooting.
