# XVIZ - A Protocol for Real-Time Transfer and Visualization of Autonomy Data

## Main Features

The XVIZ protocol provides

* Support for synchronization across multiplexed, time sliced data streams
* A rich set of Geometry Primitives
* Visual styling using stylesheets
* Declarative UI components
* A machine readable JSON scheme definition

## Complementary Code

Once you have encoded your data using the XVIZ protocol, its time to start visualizing it. There is a growing ecosystem with multiple complementary components that you can use stand-alone or in combination.

* WebGL2-powered `deck.gl` layers to render 3D visualizations of your data.
* React components to visualize data as time series and other formats.
* React components to implement the Declarative UI parts of XVIZ.
* A machine readable [JSON schema](http://json-schema.org/) in `@xviz/schema` package

