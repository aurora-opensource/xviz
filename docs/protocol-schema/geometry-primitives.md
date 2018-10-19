# XVIZ Primitive Specification

The geometry primitives currently supported in XVIZ are:

- `point`
- `polygon`
- `polyline`
- `circle`
- `stadium`
- `text`
- `image`

## Flat Arrays

For faster loading directly in memory buffers where you see `list<Point3d>` a flat list of numbers
can be supplied. In those cases that list must be a multiple of 3, where each 3 elements is the
`(x,y,z)` tuple that makes up a 3D point.

The same is true of `list<color>`, instead the list must be a multiple of 4, where each element is
the `(r, g, b, a)` color tuple.

## Point Primitive

The point primitive is the most basic XVIZ drawable. It can represent either a single point or a
point cloud. If there is more than one vertex in the vertices field then it is a point cloud.

| Name   | Type                  | Description                                                                                                                   |
| ------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| points | list<Point3d>         | If more than one point is in the list then this is a point cloud, otherwise it is just a single point. (Optionally flattened) |
| colors | optional<list<color>> | If present this provides a color for every point in the `points` list, and overrides any inline or class color styling.       |

Example:

```
{
    "type": "point",
    "points": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
}
```

## Polygon Primitive

The polygon primitive is used to draw any closed shape.

| Name     | Type          | Description                                                                         |
| -------- | ------------- | ----------------------------------------------------------------------------------- |
| vertices | list<Point3d> | The vertices of the polygon. Minimum of 3 vertices required. (Optionally flattened) |

JSON example using style class for styling:

```
{
    "type": "polygon",
    "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
}
```

## PolyLine Primitive

The polyline primitive is used to draw any polygonal chain.

| Name     | Type          | Description                                                                          |
| -------- | ------------- | ------------------------------------------------------------------------------------ |
| vertices | list<Point3d> | The vertices of the polyline. Minimum of 2 vertices required. (Optionally flattened) |

JSON example using style class for styling:

```
{
    "type": "polyline",
    "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
}
```

## Circle Primitive

The circle primitive is used to draw circles and rings, it’s center lines up with the object center.

| Name     | Type    | Description                                           |
| -------- | ------- | ----------------------------------------------------- |
| center   | point3d | Continuous space position of the center of the circle |
| radius_m | float32 | The radius of the circle in meters                    |

Example:

```
{
    "type": "circle",
    "center": [9, 15, 3],
    "radius_m": 2.5
}
```

## Stadium Primitive

The stadium primitive is used to draw 2D geometric stadiums. As of XVIZ v2.0.0, stadiums are the
closest that XVIZ has to support for 3D capsule shapes.

| Name     | Type    | Description                                                                                                       |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| start    | point3d | The midpoint of one end of the rectangle portion of a stadium that is adjacent to a semi-circle.                  |
| end      | point3d | The midpoint of the other end of the rectangle portion of the stadium which is adjacent to the other semi-circle. |
| radius_m | float32 | The radius of the circles in meters                                                                               |

Example:

```
{
    "type": "stadium",
    "start": [9, 15, 3],
    "end": [20, 13, 3],
    "radius_m": 2.5
}
```

## Text Primitive

The text primitive is used to render any kind of purely textual information. Its position refers to
the top left corner of the text.

| Name     | Type    | Description                |
| -------- | ------- | -------------------------- |
| position | point3d | Continuous space           |
| text     | string  | The actual text to display |

Example:

```
{
    "type": "text",
    "position": [9, 15, 3],
    "text": "Location of interest"
}
```

## Image Primitive

The image primitive is used to render existing graphics.

| Name      | Type        | Description                                      |
| --------- | ----------- | ------------------------------------------------ |
| position  | point3d     | The position of the top left corner of the image |
| data      | byte_buffer | Packed RGB camera image data                     |
| width_px  | float32     | Width of the source image in pixels              |
| height_px | float32     | Height of the source image in pixels             |

This is a pure JSON example, for efficiency reasons you would normally use the binary protocol which
stores the raw image directly instead of needing to base64 encode it.

```
{
    "type": "image,
    "position": [9, 15, 3],
    "data": "/9j/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=",
    "width_px": 1280,
    "height_px": 720
}
```
