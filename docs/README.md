# XVIZ - A Protocol for Real-Time Transfer and Visualization of Autonomy Data


## Main Features

The XVIZ protocol provides a rich feature

* Support for synchronization across multiplexed, time sliced data streams
* Rich set of Geometry Primitives
* Visual styling using stylesheets
* Declarative UI components
* A machine readable JSON scheme definition

and much more...


## Complementary Code

Once you have encoded your data using the XVIZ protocol, its time to start visualizing it. There is a growing ecosystem with multiple complementary components that you can use stand-alone or in combination.

* WebGL2-powered `deck.gl` layers to render 3D visualizations of your data.
* React componentry to visualize data as time series and other formats.
* React components to implement the Declarative UI parts of XVIZ.
* A machine readable [JSON schema](http://json-schema.org/) in `@xviz/schema` package

## Similar Systems

* [glTF 2.0](https://github.com/KhronosGroup/glTF) - "JPEG for 3D", standard for 3D scene interchange, optimized for fast loading and the Web, has wide import & export support.
* [USD/USDZ](https://graphics.pixar.com/usd/docs/index.html) - portable format for storing arbitrary 3D scenes, animations and scene graphs, in production pipelines, used and developed by Pixar.
* [x3dom](https://www.x3dom.org/) - declarative 3D content format, built in WebGL support.
* [A-Frame](https://aframe.io/) - declarative DOM style system for 3D VR applications.
* [VRML 2.0](http://gun.teipir.gr/VRML-amgem/spec/index.html) - 1990’s format for full 3D scene description, in the spirit of a 3D HTML.
