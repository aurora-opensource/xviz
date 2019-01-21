# Example Guide

This example guide describes converting the [KITTI](http://www.cvlibs.net/datasets/kitti) dataset
into XVIZ. It provides a starting point for understanding how data is converted to XVIZ and accessed
in the browser to quickly visualize and explore your data.

## What XVIZ enables

Describing your data in XVIZ allows you to tap into an ecosystem that is decoupled from any specific
platform and allowed to optimize for the target use-cases powered by web applications.

Our ecosystem enables critical features for engineers and operators to get access to data quickly
and efficiently with nothing more than a web browser.

Many features can be observed in the image above, including:

- 3D scene
- playback controls
- charts
- images
- base maps

## Guide Overview

This guide will explain the KITTI data to understand how we map the data to XVIZ elements. We will
cover each XVIZ concept in turn and see how to map the data and manage data dependencies and
relationships.

This tutorial will also cover some optional data generation to showcase some XVIZ features that are
not currently present in the KITTI data but are supported by XVIZ and streetscape.gl

Once the XVIZ data has been generated we will cover how to server up the XVIZ data using our simple
[XVIZ Server](/docs/getting-started/xviz-server.md) and view it using the example
[XVIZ Viewer](/docs/example-guide/xviz-viewer.md) web application.
