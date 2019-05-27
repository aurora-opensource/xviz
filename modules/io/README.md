# @xviz/io Overview

This module aims at being the central IO library for reading, writing, and manipulating XVIZ data.

This module is separated in the following layers.

# XVIZ Data classes

[XVIZ data classes](/docs/api-reference/io/overview.md) strive to remove the need to understand and
handle the various formats that XVIZ data can be stored.

# Sources and Sinks

[Sources and Sinks](/docs/api-reference/io/overview-source-sink.md) are a simple abstraction to
write and read data. We provide synchronous File and Memory implementations.

# Readers and Writers

[Readers](/docs/api-reference/io/overview-writer.md) and
[Writers](/docs/api-reference/io/overview-writer.md) are the objects that deal with writing out the
actual XVIZ data. At this level the objects **know** about any implementation details that are not
covered by the XVIZ specification, such as the use of an index file or the specific identifiers used
to store XVIZ in a particular format.

# Providers

[XVIZ Providers](/docs/api-reference/io/overview-provider.md) are a level above Readers and Writers
where a Provider interface only deals with metadata and messages and providing access to that data.
