# Serving XVIZ

XVIZ is intended to be served in a streaming fashion, enabling the ability to load and discard data as needed, enabling "infinite" playback, and also to seek to specific timestamps and restart streaming from that point.

At the moment, the small streaming server in the examples in [streetscape.gl](https://github.com/uber/streetscape.gl) may be the best way to get started.

Note that for small XVIZ data sets, it is possible to load the entire data set into a client using one or more requests, but for larger data sets, streaming is typically required.
