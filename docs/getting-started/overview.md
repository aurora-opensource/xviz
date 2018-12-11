# Mapping KITTI data to XVIZ

This section describes how to convert KITTI autonomy data into XVIZ. It is intended to provide and
understanding of the concepts of XVIZ.

Before we begin you must have read the [XVIZ Concepts](/docs/overview/concepts.md) as this guide
will assume those are known.

We will link to relevant detailed XVIZ documentation, but following up with
[XVIZ](http://uber.github.com/xviz)

## KITTI Data format

The data is divided into directories for each data types and each type has one file per KITTI frame.
A _frame_ here represents the data at that point in time. We will process each KITTI frame and
convert them into an XVIZ frame.

The KITTI data provides us a rich set of source material, including:

- Vehicle location, orientation, and metrics
- Tracklets, which are relative to the vehicle position
- Camera images
- Lidar scans, which are relative to the vehicle position

Lets focus on each of these below, covering how they relate to the concepts in XVIZ and how to use
the XVIZ Javascript libraries convert.

We will not cover the actual parsing of the data but instead focus on the relationships that must be
taken into consideration.

## General XVIZ Concepts

XVIZ organizes data into [streams](/docs/protocol-schema/introduction.md). A stream is an identifier
that follows a path-like syntax, e.g. '/object/bounds', and is used to store homogeneous data. We
provide a Javascript class [XVIZBuilder](/docs/api-reference/xviz-builder.md) to help build up
streams.

Each stream has [metadata](/docs/protocol-schema/session-protocol.md#stream_metadata) which must be
set to interpret and validate the stream data. We provide a Javascript class
[XVIZMetadataBuilder](/docs/api-reference/xviz-metadata-builder.md) to assist in defining the stream
metadata.

Next we can get into the details of the KITTI data conversion.
