# ROS Comparson

It comes up often how XVIZ and [ROS](http://www.ros.org/) relate. ROS is the most popular open
source robotics development platform, and it has it's own [RViz](http://wiki.ros.org/rviz) based
visualization stack. While XVIZ is a protocol, and eventually an ecosystem, for visualizing robotics
systems.

XVIZ goals are more focused than ROS. It's designed to create a standard protocol that allows
innovative clients to be built, offload expensive data transformations to a server, and minimize data
sent to the client. Doing for robotics what HTML and MP4 do for video and multi-media content.

On our [roadmap](/docs/overview/roadmap.md) is a plan to bridge these worlds by updating our example
XVIZ server to support realtime conversion of ROS's [bag](http://wiki.ros.org/Bags) log format and
common ROS data types.

## Simularties

There is a decent amout of overlap between ROS and RViz and XVIZ, which is due to the nature of the
space and XVIZ being inspired by RViz. They both:

- Break the world down into stream of primitives
- Support geometry, image and timeseries streams
- Can view data from live systems
- Can tie primitives to objects
- Have binary and text protocols

## Advantages

### XVIZ

XVIZ's advantages comes from it's focus on fully decoupling clients from data formats and server
implementations. Along those lines it has a:

- Config only UI system - [Declarative UI](/docs/declarative-ui/overview.md)
- Comprehensive [styling system](/docs/protocol-schema/style-specification.md)
- [Metadata system](/docs/protocol-schema/session-protocol.md#metadata) for easier data
  introspection
- Remote [log viewing protocol](/docs/protocol-schema/session-protocol.md#data-transfer---logs), no
  need to copy logs
- Web focus, ie. standard JSON
- Protobuf support (in alpha)

### ROS

ROS's advantages from it's long history of development and use, as well as basis in manipulator
robotics:

- ROS 1.0 is stable with 10 years of development
- More primitives - cubes, spheres, arrows
- RViz native client with existing plugins
- Dynamic transform support

## Disadvantages

Here we'll stick to unique downsides of each platform and not just the converse of the above
advantages.

### XVIZ

XVIZ's downsides stem from it's young age and the paucity of open source code, which is being fixed.

- Binary protocol does not yet support optimized layout for all data types
- No open source C++ or Python implementation
- No mature open source server, example Node.js version

### ROS

ROS is a pretty solid system with it's main downsides steming from reduced development support in
recent years, platform choice, and architectual choices.

- No first class thin/remote client story
- Serialization has no forwards compatibility
- ROS 1.0 -> 2.0 transition is happening slowly and splits development efforts

## Checkbox Comparision

These tables let you figure out at a glance the how the XVIZ and ROS compare. Please see the details
above to get a more nuanced view.

### Platform Comparison

|                      | XVIZ                 | ROS           |
| -------------------- | -------------------- | ------------- |
| Web App Support      | First Class          | Community     |
| Native App Support   | None (Uber Internal) | First Class   |
| C++ Support          | None (Uber Internal) | First Class   |
| Python Support       | None                 | First Class   |
| JavaScript Support   | First Class          | Community     |
| Serialization Format | JSON or Custom       | Custom or DDS |
| Protobuf             | Alpha                | None          |

### Feature Comparision

|                        | XVIZ          | ROS                         | Comments                                                                       |
| ---------------------- | ------------- | --------------------------- | ------------------------------------------------------------------------------ |
| Styling                | Comprehensive | None                        | Reduces data size, make easier to understand, and more pleasing visualizations |
| Metadata               | Comprehensive | Partial (ROS bag type info) | Introspect on data before you read it                                          |
| Live streaming         | Yes           | Yes                         | View data from a currently running system                                      |
| Remote log protocol    | Yes           | None                        | Look with bringing any of a log to the client                                  |
| Codeless UI            | Yes           | None                        | Store UI with data, reduce dev time through less coupling                      |
| Point clouds           | Yes           | Yes                         |                                                                                |
| Time series            | Yes           | Yes                         |                                                                                |
| 2D Image display       | Yes           | Yes                         | Show an image in the UI                                                        |
| 2D Geometry primitives | Yes           | Most                        | Polygons, Polylines, cricles, stadium                                          |
| 3D Image Display       | Planned       | Community                   | Display an image in the 3D world                                               |
| 3D Geometry primitives | None          | Yes                         | Sphere, Cube, Cylinder, Arrow                                                  |
