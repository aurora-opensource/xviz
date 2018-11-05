# Change Log

All notable changes to XVIZ will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [Unreleased]
- Add `XVIZWriter.writeFrameIndex` to write out a timestamp index file to be used
  by the Streetscape.gl XVIZ file server

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
