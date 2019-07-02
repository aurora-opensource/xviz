# VisualizationMarker

[visualization_msgs/Marker](http://docs.ros.org/api/visualization_msgs/html/msg/Marker.html)

Provides a mapping from ROS Markers to XVIZ primitives.

The supported marker types:

- Arrow
- Sphere
- Line Strip
- Line List
- Text

## Metadata

An XVIZ stream with the marker type will be added as a suffix. Given the topic '/marker' the
following stream metadata will be registered.

- '/marker/arrow'
- '/marker/sphere'
- '/marker/linestrip'
- '/marker/linelist'
- '/marker/text'

## Remarks

The semantics of ROS markers requires that this converter is statefule and keeps track of the state
of markers and their lifetime.
