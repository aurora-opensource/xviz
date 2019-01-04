# Components

## Common Fields

Component is the base type for all visual elements.

| **Name** | **Type**                 | **Description**                     |
| -------- | ------------------------ | ----------------------------------- |
| `type`   | `enum{ component_type }` | The explicit type of this component |

The valid values of `component_type`:

- `table`
- `metric`
- `plot`
- `treetable`
- `video`
- `select` (WARNING: Unstable feature)

## Table

The Table element renders data similar to how data is presented in a traditional HTML table.

_TODO: screentshot: panel with table from streetscape.gl demo app_

| **Name**          | **Type**    | **Description**                                                                                          |
| ----------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `stream`          | `stream_id` | The stream name to populate the table data from. Must be a stream of [[LINK EM TO TreeTable] primitives. |
| `title`           | `string`    | A title to display above the component.                                                                  |
| `description`     | `string`    | A description of this element, displayed when hovering over the title.                                   |
| `displayObjectId` | `boolean`   | Controls whether or not the object ID column, which is automatically added to TreeTables, is displayed.  |

### Supported Interactions

| **Interaction**    | **Description**                                                                      |
| ------------------ | ------------------------------------------------------------------------------------ |
| Highlight on Hover | Highlight an object in the world view when hovering over a row or a row is selected. |
| Copy               | Copy and paste data out of the table                                                 |
| Sort               | Sort the table based on the contents of the columns                                  |
| Filter             | Exclude rows based on their values in certain columns                                |

### JSON Example

```js
{
  "components": [
    {
      "type": "table",
      "title": "A table showing something"
      "description": "These are the details of this table",
      "displayObjectId": true,
      "stream": "/prediction/some_table",
    }
  ]
}
```

### YAML Example

```
components:
  - description: These are the details of this table
    display_object_id: true
    stream: /prediction/some_table
    title: A table showing something
    type: table
```

## Metric

The Metric element renders time series data. A single metric element can render multiple streams of
time series data on the same chart so that data can be easily compared.

_TODO: screenshot: streetscape.gl demo app showing drag-able sub-panels_

| **Name**      | **Type**                 | **Description**                                                                                         |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `streams`     | `map<string, stream_id>` | The streams to display in the chart.. Must be a stream of [time series states TODO LINK TO TIME SERIES] |
| `title`       | `string`                 |                                                                                                         |
| `description` | `string`                 | Displayed when hovering over the title                                                                  |

### Supported Interactions

| **Interaction**  | **Description**                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Details on Hover | When hovering over a metrics element, the current value of the metric at the location is shown |

### JSON Example

```js
{
  "components": [
    {
      "title": "Some metric",
      "type": "metric",
      "description": "The actual vs commanded value for some variable",
      "streams": ["/some_value/actual", "/some_value/commanded"]
    }
  ]
}
```

### YAML Example

```
components:
  - type: metric
    title: Some metric
    description: The actual vs commanded value for some variable
    streams:
      - /some_value/actual
      - /some_value/commanded
```

## Plot

The Plot component is used for showing one or more variables at once on screen. It has a standard
mode where it shows a set of dependent variables as a function of an independent variable. In region
mode 2D regions defined by an x variable and min and max y variables.

_TODO: screenshot: streetscape.gl demo app showing normal variable plot_

| **Name**      | **Type** | **Description**                        |
| ------------- | -------- | -------------------------------------- |
| `title`       | `string` | Shown at the top of the plot           |
| `description` | `string` | Displayed when hovering over the title |

#### Standard Mode Fields

| **Name**              | **Type**          | **Description**                                                                         |
| --------------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `independentVariable` | `stream_id`       | The stream to use as the X axis.                                                        |
| `dependentVariables`  | `list<stream_id>` | The streams to plot on the Y axis as a function of the stream that makes up the X axis. |

#### Region Mode Fields (WARNING: Unstable feature)

Theses define areas between an upper and lower bound along a set of x coordinates. These streams can
contain multiple objects so you can plot a full set of regions with a single entry region entry. To
style these regions apply style information to the `x` stream.

| **Name**  | **Type**       | **Description**    |
| --------- | -------------- | ------------------ |
| `regions` | `list<region>` | The set of regions |

| **Name** | **Type**    | **Description**                                                                                                              |
| -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `x`      | `stream_id` | The X axis values of the regions, expects a floating point variable stream. Style's on this stream apply to the full region. |
| `yMin`   | `stream_id` | The visible lower bound of the region on the Y axis, expects a floating point variable stream.                               |
| `yMax`   | `stream_id` | The visible upper bound of the region on the Y axis, expects a floating point variable stream.                               |

### Supported Interactions

| **Interaction**       | **Description**                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Details on Hover      | When hovering over the plot, the exact value of every stream at the point being hovered over will be displayed. |
| Toggle Streams On/Off | Below the plot a list of streams is shown, clicking on the streams will toggle displaying them on the plot      |

### JSON Example

```js
{
  "components": [
    {
      "type": "plot",
      "title": "Some Other Streams vs Some Stream",
      "description": "The change in some streams as a function of the other one",
      "independentVariable": "/some/stream",
      "dependentVariables": ["/some/other_stream", "/some/second_other_stream"]
    }
  ]
}
```

### YAML Example

```
components:
  - type: plot
    title: Some Other Streams vs Some Stream
    description: The change in some streams as a function of the other one
    independentVariable: /some/stream
    dependentVariables:
    - /some/other_stream
    - /some/second_other_stream
```

## Video

The Video element is used to display streams of video data. A single video element can support
multiple streams of video, however not all streams may be viewed at the same time. To view multiple
streams concurrently, multiple video elements need to be created.

_TODO: screenshot: streetscape.gl demo app showing the video element_

| **Name**  | **Type**       | **Description**                                                                                                            |
| --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cameras` | `list<string>` | A list of the streams of video that can be rendered by this element. Only [[cameras listed - TODO link to camera metadata] |

### Supported Interactions

| **Interaction**           | **Description**                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Select source             | Using a dropdown overlayed on the video, a user can select which video to show.                                                               |
| Video settings adjustment | A user can adjust video settings such as saturation, brightness, and contrast from the settings menu that is overlaid on the video component. |

### JSON Example

```js
{
  "components": [
    {
      "type": "video",
      "cameras": [
        "front-center-roof-camera",
        "rear-starboard-roof-camera",
        "rear-port-roof-camera"
      ]
    }
  ]
}
```

### YAML Example

```
components:
  - type: video
    cameras:
      - front-center-roof-camera
      - rear-starboard-roof-camera
      - rear-port-roof-camera
```

## TreeTable

The TreeTable represents data in a way similar to that of a file system explorer window. The data is
hierarchical with common fields at each node, some fields being empty depending on where the node
sits in the tree. Each node is typically rendered as one row in TreeTable with higher level nodes
being collapsible.

[LINK ME TO tree-table.md]
([similar in concept to this](http://doc.qt.io/qt-5/qtwidgets-itemviews-simpletreemodel-example.html#design-and-concepts))

_TODO: screenshot: streetscape.gl demo app showing treetable data_

| **Name**            | **Type**    | **Description**                                                                      |
| ------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `stream`            | `stream_id` | The stream of TreeTable primitives to populate with which to populate this component |
| `title`             | `string`    | A title to display at the top of the TreeTable                                       |
| `description`       | `string`    | A description of this component, displayed when hovering over the title.             |
| `display_object_id` | `boolean`   | Whether or not to display the object ID column                                       |

### Supported Interactions

| **Interaction**    | **Description**                                                                      |
| ------------------ | ------------------------------------------------------------------------------------ |
| Highlight on Hover | Highlight an object in the world view when hovering over a row or a row is selected. |
| Copy               | Copy and paste data out of the table                                                 |
| Sort               | Sort the table based on the contents of the columns                                  |
| Filter             | Exclude rows based on their values in certain columns                                |

### JSON Example

```js
{
  "components": [
    {
      "display_object_id": false,
      "type": "treetable",
      "description": "These are the details of the TreeTable",
      "stream": "/some/stream/of/treetable/primmatives",
      "title": "A TreeTable!"
    }
  ]
}
```

### YAML Example

```
components:
  - description: These are the details of the TreeTable
    display_object_id: false
    stream: /some/stream/of/treetable/primmatives
    title: A TreeTable!
    type: treetable
```

## Select (WARNING: Unstable feature)

The Select components allows dynamically configuring the XVIZ transformation done on data sent to
client. The component displays a list of options populated by a XVIZ variable stream, and allows the
user to select one of them. This also known as a "combobox" or "dropdown".

When a new option is selected the client sends backend a message reconfiguration with the updated
value then:

- The backend responds with an updated view of the world for the current time
- Any future requests will use the updated configuration

| **Name**      | **Type**    | **Description**                                              |
| ------------- | ----------- | ------------------------------------------------------------ |
| `title`       | `string`    | Displayed on screen besides the selection box                |
| `description` | `string`    | Displayed when hovering over the title                       |
| `stream`      | `stream_id` | A XVIZ variable stream containing the options to select      |
| `onchange`    | `onchange`  | Describes what to happen when a new select option is chosen. |

**onchange** fields

| **Name** | **Type** | **Description**                                            |
| -------- | -------- | ---------------------------------------------------------- |
| `target` | `string` | A JSON pointer (RFC 6901) that describes the key to update |

### Supported Interactions

| **Interaction** | **Description**                                 |
| --------------- | ----------------------------------------------- |
| `onchange`      | Reconfigure the backend when the select changes |

### Resulting messages

The reconfiguration message sent preforms an update to the configuration of the backend. Allow to
for example to toggle on and off an expensive to compute and transmit feature.

So for the examples below we would get a `reconfigure` message of the form:

```
{
    "update_type": "delta",
    "config_update": {
        "system": {
            "info": {
                "type": "newvalue"
            }
        }
    }
}
```

### JSON Example

```js
{
  "components": [
    {
      "title": "Additional Info Type",
      "description": "Which type of additional information you want sent",
      "type": "select",
      "stream": "/system/additional_info/types",
      "onchange": {
        "target": "/system/info/type"
      }
    }
  ]
}
```

### YAML Example

```
components:
  - type: select
    title: Additional Info Type
    description: Which type of additional information you want sent
    streams: /system/additional_info/types
    onchange:
      target: /system/info/type
```

## Complete Example

Below is a complete example of what a panel definition would look like

## JSON Example

```js
{
  "type": "panel",
  "layout": "vertical",
  "name": "Example Panel",
  "interactions": ["reorderable"],
  "children": [
    {
      "type": "container",
      "layout": "horizontal",
      "name": "Example Container #1",
      "interactions": ["dragout"],
      "children": [
        {
          "type": "table",
          "title": "A nested table showing something",
          "description": "These are the details of this table",
          "stream": "/some/table_stream",
          "displayObjectId": false
        },
        {
          "type": "plot",
          "title": "A nested plot!",
          "description": "The change in some streams as a function of the other one",
          "independentVariable": "/some/stream",
          "dependentVariable": [
            "/some/other_stream",
            "/some/second_other_stream"
          ]
        }
      ]
    },
    {
      "type": "table",
      "title": "A table showing something",
      "description": "These are the details of this table",
      "displayObjectId": true,
      "stream": "/prediction/some_table"
    },
    {
      "type": "metric",
      "title": "Some metric",
      "description": "The actual vs commanded value for some variable",
      "streams": [
        "/some_value/actual",
        "/some_value/commanded"
      ]
    },
    {
      "type": "plot",
      "title": "Some Other Streams vs Some Stream",
      "description": "The change in some streams as a function of the other one",
      "independentVariable": "/some/stream",
      "dependentVariable": [
        "/some/other_stream",
        "/some/second_other_stream"
      ]
    },
    {
      "type": "video",
      "cameras": [
        "front-center-roof-camera",
        "rear-starboard-roof-camera",
        "rear-port-roof-camera"
      ]
    },
    {
      "type": "treetable",
      "title": "A TreeTable!",
      "description": "These are the details of the TreeTable",
      "displayObjectId": false,
      "stream": "/some/stream/of/treetable/primmatives"
    }
  ]
}
```

## YAML Example

```
components:
  - description: These are the details of this table
    display_object_id: true
    stream: /prediction/some_table
    title: A table showing something
    type: table
  - description: The actual vs commanded value for some variable
    streams:
      - /some_value/actual
      - /some_value/commanded
    title: Some metric
    type: metric
  - dependent_variables:
      - /some/other_stream
      - /some/second_other_stream
    description: The change in some streams as a function of the other one
    independent_variable: /some/stream
    title: Some Other Streams vs Some Stream
    type: plot
  - cameras:
      - front-center-roof-camera
      - rear-starboard-roof-camera
      - rear-port-roof-camera
    type: video
  - description: These are the details of the TreeTable
    display_object_id: false
    stream: /some/stream/of/treetable/primmatives
    title: A TreeTable!
    type: treetable
containers:
  - components:
      - description: These are the details of this table
        display_object_id: false
        stream: /some/table_stream
        title: A nested table showing something
        type: table
      - dependent_variables:
          - /some/other_stream
          - /some/second_other_stream
        description: The change in some streams as a function of the other one
        independent_variable: /some/stream
        title: A nested plot!
        type: plot
    containers: []
    interactions:
      - drag_out
    layout: horizontal
    name: 'Example Container #1'
interactions:
  - reorderable
layout: vertical
name: Example Panel
```
