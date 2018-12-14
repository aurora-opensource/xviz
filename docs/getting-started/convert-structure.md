# Structuring the XVIZ conversion code

We have already covered what data is available and how we want to map it into XVIZ. What we want to
do is define a class per data source that can handle all the necessary XVIZ conversion operations.

Specifically we want this class to handle the following:

1. Handling of any data dependencies
2. Load KITTI data source
3. Define XVIZ stream metadata this converter produces
4. Convert data to XVIZ streams based on current frame being processed

## Defining the XVIZ converter class structure

We will map each of these requirements to a function of our class. So a basic conversion class will
have the following structure.

```js
class XVIZConversionBase {
  constructor(...) {}

  // will handled how to load and parse the data
  load(...) {}

  // called once for each frame to generate XVIZ data
  convertFrame(...) {}

  // called to collect the XVIZ stream metadata for this converter
  getMetadata(...) {}
}
```

## Coordinating the conversion

We need to coordinate constructing each converter as well as manageing data dependencies between any
of the converters. We will do this in the
[kitti-converter.js](/examples/converters/kitti/src/converters/kitt-converter.js).

This class simply constructs each individual converter and then delegates calls for metadata and
frame generation.

## Main application flow

With our classes defined, the main convertion code flow will be as follows

1. Process args and options
2. Construct the KITTI Converter
3. Construct an [XVIZWriter](/docs/api-reference/xviz-writer.md)
4. Collect and write out [XVIZ Metadata](/docs/protocol-schema/session-protocol.md#metadata)
5. Process frames and write out with
   [XVIZWriter.writeFrame](/docs/api-reference/xviz-writer.md#writeframe)
6. Write out an [XVIZWriter.writeFrameIndex](/docs/api-reference/xviz-writer.md#writeframeindex) to
   support fast loading and random seek in the XVIZ Server
