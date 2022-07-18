# Rosbag2 XVIZ Conversion

This sample Rosbag2 data set is used to demonstrate how to convert data into the XVIZ format.

The structure of this examples places the core conversion objects in `src/converters` with
an object per data source. Data source will also have parsing utilities in `src/parsers`.

The *converter* objects are responsible for calling the parsers and knowing the structure of the data
such that it can be processed by a *frame*, which is all the data required for a point in time.

In this example, the data has been synchronized for us, but XVIZ does support data sources operating at
different rates.

Please see the [Getting Started](https://github.com/uber/xviz/blob/master/docs/getting-started/README.md) guide for details this XVIZ conversion.

## Installation


## Usage



# Structure of the XVIZ conversion code

The [Getting Started](https://github.com/uber/xviz/blob/master/docs/getting-started/README.md) covers the
details of the XVIZ conversion. Here we briefly describe the structure of the conversion code itself.

We have defined a conversion class for each data source in the Rosbag2 data. Specifically we want this class to handle the following:

1. Handle data dependencies
2. Load Rosbag2 data source
3. Define XVIZ stream metadata this converter produces
4. Convert data to XVIZ streams based on the current frame

## Defining the XVIZ converter class structure

We will map each of these requirements to a function of our class. Each conversion class will
share the following structure.

```js
  // #1 Accept dependencies during construction
  constructor(...) {}

  // #2 Load and parse data
  load(...) {}

  // #3 Generate the XVIZ stream metadata for streams output from this converter
  getMetadata(...) {}

  // #4 Generate XVIZ stream data for the current frame
  convertFrame(...) {}
```

## Coordinating the conversion

We need to coordinate constructing each converter as well as managing data dependencies between any
of the converters. We will do this in the
[rosbag2-converter.js](/examples/converters/kitti/src/converters/rosbag2-converter.js).

This class simply constructs each individual converter and then delegates calls for metadata and
frame generation.

## Main application flow

With our classes defined, the main conversion code flow will be as follows

1. Process args and options
2. Construct the Rosbag2 Converter
3. Construct an [XVIZWriter](/docs/api-reference/xviz-writer.md)
4. Collect and write out [XVIZ Metadata](/docs/protocol-schema/session-protocol.md#metadata)
5. Process frames and write out with
   [XVIZWriter.writeFrame](/docs/api-reference/xviz-writer.md#writeframe)
6. Write out an [XVIZWriter.writeFrameIndex](/docs/api-reference/xviz-writer.md#writeframeindex) to
   support fast loading and random seek in the XVIZ Server
