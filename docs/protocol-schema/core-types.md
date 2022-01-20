# XVIZ Core Types

## Basic Types

## ID Types

These are XVIZ specific ID types used throughout multiple different parts of the protocol. They are
listed here so that they can be defined only once.

| ID Type               | Type            | Description                                                                                               |
| --------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| `stream_id`           | `string`        | Describes a part of the world we are visualizing, example "/object/polygon"                               |
| `object_id`           | `guid`          | Uniquely identifies an object for all time.                                                               |
| `class_id`            | `string`        | Used to denote which styles apply to an object.                                                           |
| `widget_id`           | `guid`          | Uniquely identifies a UI element.                                                                         |
| `treetable_column_id` | `uint32`        | Used to associate treetable node values with their appropriate columns. Notably not a GUID to save space. |
| `treetable_node_id`   | `uint32`        | Uniquely identifies a node in a tree table and acts as a pointer to the node                              |
| `type_id`             | `variable_type` | An enum of bool, integer, double, and string types                                                        |

### Point3D

The Point3D type is used to represent coordinates. Note that it does not use fields x, y, and z but
rather has an array of three floating point values with the indexes 0, 1, and 2 corresponding to x,
y, and z respectively.

| Name          | Type              | Description                 |
| ------------- | ----------------- | --------------------------- |
| `coordinates` | `array<float>(3)` | What kind of object is this |

### Flat Arrays

For faster loading directly in memory buffers where you see `list<Point3d>` a flat list of numbers
can be supplied. In those cases that list must be a multiple of 3, where each 3 elements is the
`(x,y,z)` tuple that makes up a 3D point.

The same is true of `list<color>`, instead the list must be a multiple of 4, where each element is
the `(r, g, b, a)` color tuple.

## Stream Set

This is a single cohesive set of streams which all happened at the same time and be associated with
a single system frame. This is what an XVIZ extractor produces.

| Name            | Type                                 | Description                                                                                                                 |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`     | `timestamp`                          | The vehicle/log transmission_time associated with this data.                                                                |
| `poses`         | `map<stream_id, pose>`               | Related vehicle poses                                                                                                       |
| `primitives`    | `map<stream_id, primitive_state>`    | Streams containing list of primitives.                                                                                      |
| `future_states` | `map<stream_id, future_instances>`   | Streams containing This represents a collection of primitives at different timestamps, for the current stream set timestamp |
| `ui_primitives` | `map<stream_id, ui_primitive_state>` | Streams containing list of UI specific primitives.                                                                          |
| `time_series`   | `list<time_series_state>`            |                                                                                                                             |
| `variables`     | `map<stream_id, variable_state>`     | Streams containing list of values.                                                                                          |
| `annotations`   | `map<stream_id, annotation_state>`   | Streams containing annotations                                                                                              |

This is what a full stream set would look like populated with a basic example of each element:

```js
{
    "timestamp": 1001.3,
    "primitives": {
        "/object/polygon": {
            "polygons": [
                {
                  "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
                }
            ]
        }
    },
    "variables": [
        "/plan/time": {
            "values": {
              "doubles": [1001.3, 1002.3, 1003.3]
            }
        }
    }
}
```

## Pose

A core part of XVIZ is knowing the location of the vehicle(s) so they can be displayed relative to
the other data. This defines the location of the vehicle from it's own arbitrary frame, along with
it's location in latitude, longitude, form.

| Name          | Type              | Description                                                  |
| ------------- | ----------------- | ------------------------------------------------------------ |
| `timestamp`   | `float`           | The vehicle/log transmission_time associated with this data. |
| `map_origin`  | `map_origin`      | Geographic coordinates used by basemap.                      |
| `position`    | `array<float>(3)` | x, y, z position in meters                                   |
| `orientation` | `array<float>(3)` | roll, pitch, yaw angle in radians                            |

The `map_origin` object describes a location in geographic coordinates and altitude:

| Name        | Type    | Description                                      |
| ----------- | ------- | ------------------------------------------------ |
| `longitude` | `float` | The east-west geographic coordinate in degrees   |
| `latitude`  | `float` | The north-south geographic coordinate in degrees |
| `altitude`  | `float` | The altitude above sea level in meters           |

## Primitive State

This holds a lists of primitives of each type XVIZ supports. It's used by higher level to map
streams, `stream_set` or future points in time, `future_instances` to applicable primitives.

/object/bounds -> [<polygon>, <polygon>]

| Name        | Type              | Description       |
| ----------- | ----------------- | ----------------- |
| `polygons`  | `list<polygons>`  | polygons to draw  |
| `polylines` | `list<polylines>` | polylines to draw |
| `texts`     | `list<texts>`     | texts to draw     |
| `circles`   | `list<circles>`   | circles to draw   |
| `points`    | `list<points>`    | points to draw    |
| `stadiums`  | `list<stadiums>`  | stadiums to draw  |
| `images`    | `list<images>`    | images to draw    |

Go here to learn more about [geometry primitives](/docs/protocol-schema/geometry-primitives.md).

Example:

```js
{
    "points": [
        {
            "points": [[1, 2, 3]]
        }
    ]
}
```

## UI Primitive State

This holds a lists of UI primitives XVIZ. It's used by higher level to map streams, `stream_set`.

| Name        | Type        | Description                   |
| ----------- | ----------- | ----------------------------- |
| `treetable` | `treetable` | table/tree to display in a UI |

Go here to learn more about [panel primitives](/docs/protocol-schema/panel-specification.md).

Example:

```js
{
    "treetable": {
        "columns": [
            {
                "display_text": "Age",
                "type": "int32"
            }
        ],
        "nodes": [
            {
                "id": 0
            },
            {
                "id": 1,
                "parent": 0,
                "column_values": [10]
            }
        ]
    }
}
```

## Future Instances

Future instances are used to provide lookahead world states for a given instant. These future
instances can be used to keep track of what is predicted to happen in the seconds after a given
instant. These are not for normal time ordered primitives.

| Name         | Type                    | Description                             |
| ------------ | ----------------------- | --------------------------------------- |
| `timestamps` | `list<timestamp>`       | A list of timestamps in the future      |
| `primitives` | `list<primitive_state>` | A list of primitives for each timestamp |

```js
{
  "timestamps": [1.0, 1.1, 1.2],
  "primitives": [
    {
      "points": {
        "points": [[1, 2, 3]]
      }
    },
    {
      "points": {
        "points": [[1.5, 2, 3]]
      }
    },
    {
      "points": {
        "points": [[2, 2, 3]]
      }
    }
  ]
}
```

## Time Series State

This models a set of values that changes each time a data is transformed. These are used to provide
instantaneous data for a moment in time. These are not used for representing the values of functions
in the future. For that you would want to use Variable States.

| Name        | Type                  | Description                                                    |
| ----------- | --------------------- | -------------------------------------------------------------- |
| `timestamp` | `timestamp`           | The vehicle/log transmission_time associated with this data.   |
| `object_id` | `optional<object_id>` | Associated object, optional                                    |
| `streams`   | `list<stream_id>`     | The stream for each element of the `values` list               |
| `values`    | `value`               | Holds a list of Number/string/whatever, same size as `streams` |

Here is an example `time_series_state` for a system producing multiple values at a specific time:

```js
{
    "timestamp": 12345.5,
    "streams": [
        "/vehicle/torque/commanded",
        "/vehicle/torque/actual"
    ],
    "values": {
        "doubles": [
            5,
            4.8
        ]
    }
}
```

## Variable State

Maps a stream like `/constraints` to a single or multiple item list of variables. Multiple items
indicate each object refers to a different variable.

| Name        | Type             | Description          |
| ----------- | ---------------- | -------------------- |
| `variables` | `list<variable>` | Variables to display |

```js
{
    "variables": [
        {
            "values":
            {
                "doubles": [1001.3, 1002.3, 1003.3]
            }
        }
    ]
}
```

## Variables

Variable are for representing metrics data as a function of time, distance, or anything else.
Variable states can be used to provide lookahead values at a given moment, similar to how future
instances provide visual lookahead information.

An example of this would be planning data as a function of time over the next 10 seconds. For
example, the following three streams would represent three variable states

    /plan/time
    /plan/velocity
    /plan/jerk

Each stream would contain the same number of values and then the velocity and jerk streams could be
plotted as a function of the time stream. For more details on how to plot see the
[Declarative UI docs](/docs/declarative-ui/overview.md).

The base variable fields:

| Name        | Type                  | Description                 |
| ----------- | --------------------- | --------------------------- |
| `object_id` | `optional<object_id>` | Associated object, optional |

The full variable object:

| Name     | Type                      | Description                 |
| -------- | ------------------------- | --------------------------- |
| `values` | `values`                  | The values                  |
| `base`   | `optional<variable_base>` | Associated object, optional |

As an example a complete [`stream_set`](/docs/protocol-schema/core-protocol.md#stream-set),
containing the above variables would look like:

```js
{
    "values":
    {
        "doubles": [1001.3, 1002.3, 1003.3]
    }
}
```

## Annotation State

Maps a stream like `/annotations` to a single or multiple item list of variables. Multiple items
indicate each object refers to a different variable.

| Name          | Type               | Description          |
| ------------- | ------------------ | -------------------- |
| `annotations` | `list<annotation>` | Variables to display |

## Annotations

Annotations are additional data attached to existing primitive types. Annotations currently cover
visual changes in the appears of existing object.

Annotations must be produced in the stream set for as long as that annotation is active.

### Base

| Name     | Type        | Description                              |
| -------- | ----------- | ---------------------------------------- |
| `object` | `object_id` | The object the annotation corresponds to |

### Visual

Visual annotations are change how things are rendered.

| Name            | Type                     | Description                                                     |
| --------------- | ------------------------ | --------------------------------------------------------------- |
| `base`          | `optional<base>`         | The common annotation fields                                    |
| `style_classes` | `optional<list<string>>` | A list of style classes to apply                                |
| `style_info`    | `optional<style>`        | A block of style information as outlined in the "Style" section |
