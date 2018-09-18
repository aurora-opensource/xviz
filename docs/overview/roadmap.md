# Roadmap


## XVIZ Protocol Evolution

Actively being discussed, some ideas are:

* **Better support for binary data** - e.g. encoding graphical primitives in a GPU friendly way so that they can visualized more efficiently on the front-end.

* **Improved support for static data** - Make it easier to load local maps and other contextual data.


## XVIZ Library Improvements

* **Builder Support for C++ and other Languages** - We want to provide support for generating XVIZ from non-JavaScript backends, such as C++, Python etc. We currently envision one or more versions of the XVIZ builder APIs to be ported to other languages.

Note that for parsing we are currently focusing on visualizing XVIZ in the browser (i.e. in JavaScript. We'd be interested in collaborating in case someone wants to implement parsing of XVIZ in other languages such as C++).


* **Support for streaming XVIZ** - Ideally we want to provide a non-JavaScript based socket server to serve as a reference/starting point.


## Ecosystem Aspirations

* **UI Applications** - We expect to keep improving [streetscape.gl](https://github.com/uber/streetscape.gl) as a reference application for XVIZ, and provide to support the ecosystem in case other open source applications emerge.


* **Base Converters from other formats** - To help new users quickly get started. (E.g. improved rosbag support.)

* **Loaders for Open Map Libraries** - We want to work with providers of open autonomy-type map data and make sure turn-key loaders are available for those data sets to serve as the backdrop for XVIZ sequences
