# XVIZ - A Protocol for Real-Time Transfer and Visualization of Autonomy Data

XVIZ is the data layer for AVS.

![XVIZ high-level data flow](./overview/images/data-flow.png)

## Main Features

XVIZ allows you to describe:

- Visual elements
  - Geometry
  - Point clouds
  - Images
  - Text
  - Metrics
- Stylesheets
- Declarative User Interface with data bindings
- A machine readable [JSON schema](http://json-schema.org/) in `@xviz/schema` package

## XVIZ Protocol Specification

The [XVIZ Protocol](/docs/protocol-schema/introduction.md) covers important concepts and the data
types .

## XVIZ Javascript Libraries

The [XVIZ Javascript](/docs/api-reference/xviz-builder.md) libraries are a set of modules to
validate, build, and parse XVIZ data. These libraries make working with XVIZ easier and provide
support for validation of any other language implementations.

## XVIZ Server

XVIZ was designed with a focus on distributed systems and teams. This means taking into account data
size and processing as well as optimizing for data transmission over network infrastructures.

The XVIZ Server is a simple demonstration of how XVIZ data can be delivered to your application.
Follow the [Quick Start](/docs/getting-started/xviz-server.md) to start sending XVIZ data to your
application.
