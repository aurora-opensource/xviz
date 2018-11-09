# Change Log

All notable changes to XVIZ will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [Unreleased]
- Add `XVIZWriter.writeFrameIndex` to write out a timestamp index file to be used
  by the Streetscape.gl XVIZ file server

## [0.2.0] - 2018-XX-XXX
### Changes
Protobuf 3 schema compatibility updates.

#### Breaking changes

Protobuf 3 does not support inheritance so common fields had to be moved:

 - Primitives moved `object_id`, `style_classes` and `inline_style` to a `base` sub-object
 - Annotations moved `object_id` to a `base` sub-object
 - Variables moved `object_id` to a `base` sub-object

Due lack of polymorphism all mixed type arrays were removed:

 - Changed `primitive_state` from one mixed `primitives` array to a array for each possible primitive type
 - Changed `annotation_state` from one mixed `annotations` array to one `visuals` array
 - Changed `future_instances` to hold an array of `primitive_state` objects instead of an arrays of mixed primitives
 - Changed `treetable`'s node `column_value` to be an array of strings

Protobuf 3 also lacks variants so we had to remove all usages:

 - A new `values` type is defined that holds one array for each plain type: ints, double, strings, bools
 - `timeseries_state` changed to holds parallel arrays of stream IDs and `values` type
 - In `stream_metadta` the `DYNAMIC` transform type now specifies it's callback function name as the `transform_callback` field
 - Changed `variable` to contain the `values` type instead of variant based `values` array

Since everything is explicitly typed now we have:

 - Removed type tags from annotations and primitives

#### Non-Breaking changes

 - Unstable Protobuf 3 IDL files are in `modules/schema/proto/v2`
 - The 3x3 and 4x4 Matrix types can now be passed flat, because that that is how they are represented in protobuf
 - `ui_panel_info` can now represent the declarative UI content as raw string because that is how protobuf will pass the JSON format of the declarative UI files


## [0.1.0] - 2018-10-24
### Changes
- XVIZ specification finalization and tooling updates
  - [Pose](docs/protocol-schema/core-protocol.md) is now well defined
  - support for CSS like charactor color codes
  - `point` primitive supports per point colors array
  - support for flattened arrays
  - declarative UI spec and documentation added

- [XVIZBuilder API](docs/api-reference/xviz-builder.md) refactor
  - `XVIZBuilder.stream()` has split into seperate methods for each XVIZ data category
    - `pose()`
    - `primtive()`
    - `variable()`
    - `timeSeries()`
  - `XVIZBuilder.pose()` has a well-defined type with fluent API
  - [style properties](docs/protocol-schema/style-specification.md) are snake_case, no longer camelCase

- [XVIZMetadataBuilder](docs/api-reference/xviz-metadata-builder.md) changes
  - `category()` takes singular form
  - style properties are snake_case, no longer camelCase
  - `styleClassDefault()` became `streamStyle()`
  - `coordinate()` and `transform()` support for reference frame support

## [0.0.1] - 2018-10-24
- Untracked beta development
