# XVIZ v2.0.0 Protocol Specification

## Introduction

XVIZ is an abstract visual world state description format that can be updated both incrementally and with complete snapshots.  It is designed to separate the reduction of large complex data streams into a logical visual hierarchy from the building of rich applications to view that data.


## Data Model

Here is a map of all the objects in a typical XVIZ world state:

### Streams and World State

XVIZ divides the state of the world into a set of streams.  This allows user to quickly explore and filter the visual world to suit their use case.  Each stream changes over time atomically.  The world state represents a complete set of all the latest stream states for a particular time.

### Primitives and Objects

The base types of XVIZ are individual elements of data: primitives, variables and time series.

* **Primitives** are abstract geometries.
* **Variables** are arrays of data (often over time).
* **Time series** are individual samples of a larger series.

These individual elements have a common semantics meaning, which is captured by the collection they are contained within, the stream.

As an example, the stream `/object/shape` would contain all primitive shapes, while /object/velocity would contain the numeric value for the objects' velocities.

Since the representation for an object is split across streams, XVIZ base types can have an ID which will be used to maintain the relationship of the data. In the example above, the /shape stream would transmit the object’s shape information, while the /velocity stream would transmit the object’s velocity information. These streams are separated for ease of parsing and improved data compression - for example, object shapes may only need to be updated once per second, whereas velocities might be more useful updated 10 times per second.



### Poses

A core part of XVIZ is knowing the location of the vehicle(s) so they can be displayed relative to the other data. This defines the location of the vehicle from it's own arbitrary frame, along with it's location in latitude, longitude, form.

| Name           | Type               | Description |
| ---            | ---                | --- |
| `timestamp`    | `float`            | The vehicle/log transmission\_time associated with this data. |
| `mapOrigin`    | `map_origin`       | Uniquely identifies an object for all time. |
| `position`     | `array<float>(3)`  | x, y, z position in meters |
| `orientation`  | `array<float>(3)`  | roll, pitch, yaw angle in radians  |

The `map_origin` object describes a location in geographic coordinates and altitude:

| Name        | Type     | Description |
| ---         | ---      | --- |
| `longitude` | `float`  | The east-west geographic coordinate in degrees |
| `latitude`  | `float`  | The north-south geographic coordinate in degrees |
| `altitude`  | `float`  | The altitude above sea level in meters |


### Styles

Similar to CSS each primitive can have one or more classes, each of which can have associated style information.  This allows the styling information to be sent out of band with the main data flows, and only once.  Learn more in the [style specification](/docs/protocol-schema/style-specification.md).


### Annotations

Annotations are themselves sent as XVIZ streams, but provide strictly supplemental information for another stream. Annotations are used when one team needs to append additional visual information to objects other than their own.


## Implementations

XVIZ is used when talking to a server or reading data exported and stored on disk. To learn more about them see:
 - [Session Protocol](/docs/protocol-schema/session-protocol.md)
 - ETL - current unspecified

> Need XVIZ OSS specification for XVIZ 2.0 ETL format

Both of those methods can use either of the two public XVIZ protocol implementations to encode the types described below:

 - [JSON protocol](/docs/protocol-formats/json-protocol.md) - a straight forward mapping of above types into JSON
 - [Binary protocol](/docs/protocol-formats/binary-protocol.md) - a Hybrid JSON binary protocol designed for larger data sets and faster performance


## ID Types

These are XVIZ specific ID types used throughout multiple different parts of the protocol.  They are listed here so that they can be defined only once.

| ID Type               | Type            | Description |
| ---                   | ---             | --- |
| `stream_id`           | `string`        | Describes a part of the world we are visualizing, example "/object/polygon" |
| `object_id`           | `guid`          | Uniquely identifies an object for all time. |
| `class_id`            | `string`        | Used to denote which styles apply to an object. |
| `widget_id`           | `guid`          | Uniquely identifies a UI element. |
| `treetable_column_id` | `uint32`        | Used to associate treetable node values with their appropriate columns. Notably not a GUID to  save space. |
| `treetable_node_id`   | `uint32`        | Uniquely identifies a node in a tree table and acts as a pointer to the node |
| `type_id`             | `variable_type` | An enum of bool, integer, double, and string types |


## Style

Style information describes the appearance of primitives. Color information can be directly attached to primitives but styles pertaining to many or all primitives should be pulled out into style messages. This reduces the amount of data sent across the network and improves maintainability.

Details in separate [style specification](/docs/protocol-schema/style-specification.md).

| Name         | Type                              | Description |
| ---          | ---                               | --- |
| `fields`     | `map<style_field, value_variant>` | The variant for HIDL will be a custom type.

**value_variant** - the most efficient variant type we can make represents, string, rgba_color, float, boolean


## Stream Set

This is a single cohesive set of streams which all happened at the same time and be associated with a single system frame.  This is what an XVIZ extractor produces.

| Name            | Type                                | Description |
| ---             | ---                                 | --- |
| `timestamp`     | `timestamp`                         | The vehicle/log transmission\_time associated with this data. |
| `primitives`    | `map<stream_id, primitive_state>`   | Streams containing list of primitives.  |
| `poses`         | `list<pose>`                        | Related vehicle poses  |
| `time_series`   | `list<time_series_state>`           |   |
| `future_states` | `map<stream_id, future_instances>`  | Streams containing This represents a collection of primitives at different timestamps, for the current stream set timestamp  |
| `variables`     | `map<stream_id, variable_state>`    | Streams containing list of values.  |
| `annotations`   | `map<stream_id, annotation_state>`  | Streams containing annotations  |


This is what a full stream set would look like populated with a basic example of each element:

```js
{
    "timestamp": 1001.3,
    "primitives": {
        "/object/polygon": {
            "primitives": [
                {
                  "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
                }
            ]
        }
    },
    "variables": [
        "/plan/time": {
            "values": [1001.3, 1002.3, 1003.3]
        }
    }
}
```


## Future Instances

Future instances are used to provide lookahead world states for a given instant. These future instances can be used to keep track of what is predicted to happen in the seconds after a given instant. These are not for normal time ordered primitives.

| Name         | Type                    | Description |
| ---          | ---                     | --- |
| `timestamps` | `list<timestamp>`       | A list of timestamps in the future |
| `primitives` | `list<list<primitive>>` | A list of primitives for each timestamp |

```js
{
  "timestamps": [1.0, 1.1, 1.2],
  "primitives": [
    [
      {
        "points": [[1, 2, 3]]
      }
    ],
    [
      {
        "points": [[1.5, 2, 3]]
      }
    ],
    [
      {
        "points": [[2, 2, 3]]
      }
    ]
  ]
}
```


## Primitive State

/object/bounds -> [<polygon>, <polygon>]

| Name         | Type              | Description |
| ---          | ---               | --- |
| `primitives` | `list<primitive>` | Primitives to draw |

```js
{
    "primitives": [
        {
            "points": [[1, 2, 3]]
        }
    ]
}

```


## Variable State

Maps a stream like `/constraints` to a single or multiple item list of variables.  Multiple items indicate each object refers to a different variable.

| Name         | Type              | Description |
| ---          | ---               | --- |
| `variables`  | `list<variables>` | Variables to display |

```js
{
    "variables": [
        {
            "values": [1001.3, 1002.3, 1003.3]
        }
    ]
}
```


## Time Series State

This models a set of values that changes each time a data is transformed. These are used to provide instantaneous data for a moment in time. These are not used for representing the values of functions in the future. For that you would want to use Variable States.

| Name        | Type                       | Description |
| ---         | ---                        | --- |
| `timestamp` | `timestamp`                | The vehicle/log transmission\_time associated with this data. |
| `values`    | `list<{stream_id, value}>` | Number/string/whatever |
| `object_id` | `optional<object_id>`      | Associated object, optional |

Here is an example `time_series_state` for a system producing multiple values at a specific time:

```js
{
    "timestamp": 12345.5,
    "values": [
        ["/vehicle/torque/commanded", 5],
        ["/vehicle/torque/actual", 4.8]
    ]
}
```


## Point3D

The Point3D type is used to represent coordinates. Note that it does not use fields x, y, and z but rather has an array of three floating point values with the indexes 0, 1, and 2 corresponding to x, y, and z respectively.

| Name          | Type              | Description |
| ---           | ---               | --- |
| `coordinates` | `array<float>(3)` | What kind of object is this |


## Primitive

Primitives are the most basic units of rendering data sent across the network.  Every primitives has all the following fields:

| Name      | Type                  | Description |
| ---       | ---                   | --- |
| `type`    | `primitive_type`      | What kind of object is this |
| `style`   | `optional<style>`     | Optional inline style |
| `classes` | `list<class_id>`      | Semantic/visualize classes. |
| `id`      | `optional<object_id>` | Which object is this primitive associated with |

To see all the primitives see:

 - [Geometry Primitives](/docs/protocol-schema/geometry-primitives.md)
 - [Panel Primitives](/docs/protocol-schema/panel-specification.md)

As an example in JSON of a `point` primitive using style classes:

```js
{
    "type": "polygon",
    "id": "178beda89169420cbb876c14acdba7f8",
    "classes": ["car", "important"]
    "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
}
```

You can do the same with inline styles but it is much less efficient to send the same styling information for each object over and over.  Here is what it looks like to use an inline style form:

```js
{
    "type": "polygon",
    "id": "178beda89169420cbb876c14acdba7f8",
    "style": [
        {
            "type": "fillColor"
            "value": "#FF0000",
        },
        {
            "type": "strokeColor",
            "value": "#000080"
        }
    ],
    "vertices": [[9, 15, 3], [20, 13, 3], [20, 5, 3]]
}
```


## Variables

Variable are for representing metrics data as a function of time, distance, or anything else. Variable states can be used to provide lookahead values at a given moment, similar to how future instances provide visual lookahead information.

An example of this would be planning data as a function of time over the next 10 seconds. For example, the following three streams would represent three variable states

    /plan/time
    /plan/velocity
    /plan/jerk

Each stream would contain the same number of values and then the velocity and jerk streams could be plotted as a function of the time stream. For more details on how to plot see the UI Metadata section.

| Name     | Type                      | Description |
| ---      | ---                       | --- |
| `values`    | `list<values>`         | The values |
| `object_id` | `optional<object_id>`  | Associated object, optional |


As an example a complete [`stream_set`](/docs/protocol-schema/core-protocol.md#stream-set), containing the above variables would look like:

```js
{
    "values": [1001.3, 1002.3, 1003.3]
}
```



## Annotations

Annotations are additional data attached to existing primitive types. Annotations currently cover visual changes in the appears of existing object.

Annotations must be produced in the stream set for as long as that annotation is active.

### Base

| Name     | Type              | Description |
| ---      | ---               | --- |
| `type`   | `annotation_type` | One of the possible annotation types,  what action to take when the annotation is triggered |
| `object` | `object_id`       | The object the annotation corresponds to |

### Visual
Visual annotations are change how things are rendered.

| Name            | Type                     | Description |
| ---             | ---                      | --- |
| `style_classes` | `optional<list<string>>` | A list of style classes to apply |
| `style_info`    | `optional<style>`        | A block of style information as outlined in the "Style" section |
