# KITTI XVIZ Conversion

This public KITTI data set is used to demonstrate how to convert data into the XVIZ format.

The structure of this examples places the core conversion objects in `src/converters` with an object
per data source. Data source will also have parsing utilities in `src/parsers`.

The _converter_ objects are responsible for calling the parsers and knowing the structure of the
data such that it can be processed by a _message_, which is all the data required for a point in
time.

In this example, the data has been synchronized for us, but XVIZ does support data sources operating
at different rates.

Please see the
[Getting Started](https://github.com/uber/xviz/blob/master/docs/getting-started/README.md) guide for
details this XVIZ conversion.

# Structure of the XVIZ conversion code

The [Getting Started](https://github.com/uber/xviz/blob/master/docs/getting-started/README.md)
covers the details of the XVIZ conversion. Here we briefly describe the structure of the conversion
code itself.

We have defined a conversion class for each data source in the original KITTI data. Specifically we
want this class to handle the following:

1. Handle data dependencies
2. Load KITTI data source
3. Define XVIZ stream metadata this converter produces
4. Convert data to XVIZ streams based on the current message

## Defining the XVIZ converter class structure

We will map each of these requirements to a function of our class. Each conversion class will share
the following structure.

```js
  // #1 Accept dependencies during construction
  constructor(...) {}

  // #2 Load and parse data
  load(...) {}

  // #3 Generate the XVIZ stream metadata for streams output from this converter
  getMetadata(...) {}

  // #4 Generate XVIZ stream data for the current message
  convertMessage(...) {}
```

## Coordinating the conversion

We need to coordinate constructing each converter as well as managing data dependencies between any
of the converters. We will do this in the
[kitti-converter.js](/examples/converters/kitti/src/converters/kitti-converter.js).

This class simply constructs each individual converter and then delegates calls for metadata and
message generation.

## Main application flow

With our classes defined, the main convertion code flow will be as follows

1. Process args and options
2. Construct the KITTI Converter
3. Construct an [XVIZBinaryWriter](/docs/api-reference/xviz-binary-writer.md)
4. Collect and write out [XVIZ Metadata](/docs/protocol-schema/session-protocol.md#metadata)
5. Process messages and write out with
   [XVIZBinaryWriter.writeMessage](/docs/api-reference/xviz-binary-writer.md#writeMessage)
6. Call [XVIZBinaryWriter.close](/docs/api-reference/xviz-binary-writer.md#close) to allow cleanup
   and writing of an index file to support fast loading and random seek in the XVIZ Server
