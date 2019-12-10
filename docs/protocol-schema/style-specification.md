# Styling XVIZ

The appearance of an XVIZ object can be customized using JSON styles. Each
[primitive](/docs/protocol-schema/geometry-primitives.md) type allows for its own set of styling
options, such as stroke width, fill color, etc.

## Styling Levels

Styling in XVIZ may happen at multiple levels. This allows the definition of shared defaults as well
as fine-grain control to avoid excessive style redundancy while not compromising on expressiveness.

The styles of an object is resolved in the following priority:

1. Object styles
2. Class styles
3. Stream styles

### Stream Styles

Stream styles are defined as part of the stream's metadata.

```js
// metadata
{
  'version': '2.0.0',
  'streams': {
    '/object/shape': {
      "category": "PRIMITIVE",
      "primitive_type": "POLYGON",
      "stream_style": {
        "stroked": false,
        "fill_color": "#9D9DA3"
      }
    }
  }
}
```

Any style defined at the stream level will be the default style for any object in that stream.

Some style properties can only be defined on the stream level. These properties allow for some
performance advantage in the rendering pipeline. See the properties table of each primitive type for
details.

### Class Styles

Class styles are also defined as part of the stream's metadata, but selectively applied to the
objects in that stream based on their classes.

```js
// metadata
{
  "version": "2.0.0",
  "streams": {
    '/object/shape': {
      "category": "PRIMITIVE",
      "primitive_type": "POLYGON",
      "stream_style": {
        "stroked": false,
        "fill_color": "#9D9DA3"
      },
      "style_classes": [
        {
          "name": "Pedestrian",            // class selector
          "style": {
            "fill_color": "#00C8EF"
          }
        },
        {
          "name": "Pedestrian selected",   // class selector
          "style": {
            "fill_color": "#FFDC00"
          }
        }
      ]
    }
  }
}
```

In later frames, consider the following objects:

```js
// snapshot
"primitives": {
  "/object/shape": {
    "polygons": [
      {
        "vertices": [[-6, -6, 0], [-6, -4, 0], [-4, -4, 0], [-4, -6, 0]],
        "base": {
          "classes": ["Car"]         // fill color resolves to #9D9DA3
        }
      },
      {
        "vertices": [[-3, 3, 0], [-3, 5, 0], [-1, 5, 0], [-1, 3, 0]],
        "base": {
          "classes": ["Pedestrian"]  // fill color resolves to #00C8EF
        }
      }
    ]
  }
}
```

Style classes work similar to HTML and CSS. Each stream has multiple styling rules defined with
selectors. Each rule contains the following fields:

- `name`: the selector for this rule, as space-separated class names.
- `styles`: the key-value map of style properties.

Every object in that stream may contain a `classes` field. A styling rule applies to an object if:

- The object contains all the classes in the selector.
- If an object matches multiple rules, the rule that is defined last trumps.

Rules and classes are scoped by streamId.

Class styling can be generated through the `XVIZMeBuilder` interface. Specifially the `styleClass()`
and `classes()` functions.

### Object Styles

An object can define its own style inline. Inline styles override any other styles.

```js
// snapshot
"primitives": {
  "/object/shape": {
    "polygons": [
      {
        "vertices": [[-6, -6, 0], [-6, -4, 0], [-4, -4, 0], [-4, -6, 0]],
        "base": {
          "style": {
            "fill_color": "#FF0000"
          }
        }
      }
    ]
  }
}
```

Note that some style properties cannot be defined per-object. See the properties table of each
primitive type for details.

## Style Properties

Supported style properties by primitive types:

### circle

| Property                  | Description                                                                                                         | Type            | Default  | Per-stream | Per-object |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ---------- | ---------- |
| `radius`                  | The circle radius in meters                                                                                         | Number          | `1`      | X          | X          |
| `radius_min_pixels`       | The minimum pixels to draw the radius at. Prevents the circles from being too small to see at a far-away zoom level | Number          | (none)   | X          |            |
| `radius_max_pixels`       | The maximum pixels to draw the radius at. Prevents the circles from being too large at a close-up zoom level        | Number          | (none)   | X          |            |
| `filled`                  | Whether to fill the circle                                                                                          | Bool            | `true`   | X          |            |
| `stroked`                 | Whether to draw outline around the circle                                                                           | Bool            | `true`   | X          |            |
| `fill_color`              | Fill color of the circle                                                                                            | [Color](#color) | `'#fff'` | X          | X          |
| `stroke_color`            | Stroke color of the outline                                                                                         | [Color](#color) | `'#000'` | X          | X          |
| `stroke_width`            | Stroke width of the outline in meters                                                                               | Number          | `1`      | X          | X          |
| `stroke_width_min_pixels` | The minimum pixels to draw the outline at. Prevents the lines from being too thin to see at a far-away zoom level.  | Number          | (none)   | X          |            |
| `stroke_width_max_pixels` | The maximum pixels to draw the outline at. Prevents the lines from being too thick at a close-up zoom level.        | Number          | (none)   | X          |            |
| `opacity`                 | Opacity of the object                                                                                               | Number          | `1`      | X          |            |

### point

| Property             | Description                                                                                                                            | Type                                | Default                                                               | Per-stream | Per-object |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- | ---------- | ---------- |
| `radius_pixels`      | The point radius in pixels                                                                                                             | Number                              | `1`                                                                   | X          |            |
| `fill_color`         | Fill color of the point                                                                                                                | [Color](#color)                     | `'#fff'`                                                              | X          |            |
| `point_color_mode`   | How to color point primitives                                                                                                          | [PointColorMode](#point-color-mode) | `'DEFAULT'`                                                           | X          |            |
| `point_color_domain` | The lower and upper bounds of the point measurement that maps to blue and red respectively. Only used if `point_color_mode` is defined | Array                               | `[0, 3]` in `ELEVATION` mode, `[0, 60]` in `DISTANCE_TO_VEHICLE` mode | X          |            |
| `opacity`            | Opacity of the object                                                                                                                  | Number                              | `1`                                                                   | X          |            |

### polygon

| Property                  | Description                                                                                                        | Type            | Default  | Per-stream | Per-object |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------- | -------- | ---------- | ---------- |
| `extruded`                | Whether to extrude the polygon                                                                                     | Bool            | `false`  | X          |            |
| `height`                  | The extrusion of the polygon in meters. Only works if `extruded: true`                                             | Number          | `0`      | X          | X          |
| `filled`                  | Whether to fill the polygon                                                                                        | Bool            | `true`   | X          |            |
| `stroked`                 | Whether to draw outline around the polygon                                                                         | Bool            | `true`   | X          |            |
| `fill_color`              | Fill color of the polygon                                                                                          | [Color](#color) | `'#fff'` | X          | X          |
| `stroke_color`            | Stroke color of the outline                                                                                        | [Color](#color) | `'#000'` | X          | X          |
| `stroke_width`            | Stroke width of the outline in meters. Only works if `extruded: false`                                             | Number          | `1`      | X          | X          |
| `stroke_width_min_pixels` | The minimum pixels to draw the outline at. Prevents the lines from being too thin to see at a far-away zoom level. | Number          | (none)   | X          |            |
| `stroke_width_max_pixels` | The maximum pixels to draw the outline at. Prevents the lines from being too thick at a close-up zoom level.       | Number          | (none)   | X          |            |
| `opacity`                 | Opacity of the object                                                                                              | Number          | `1`      | X          |            |

### polyline

| Property                  | Description                                                                                                         | Type            | Default  | Per-stream | Per-object |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ---------- | ---------- |
| `stroke_color`            | Stroke color of the polyline                                                                                        | [Color](#color) | `'#000'` | X          | X          |
| `stroke_width`            | Stroke width of the polyline in meters                                                                              | Number          | `1`      | X          | X          |
| `stroke_width_min_pixels` | The minimum pixels to draw the polyline at. Prevents the lines from being too thin to see at a far-away zoom level. | Number          | (none)   | X          |            |
| `stroke_width_max_pixels` | The maximum pixels to draw the polyline at. Prevents the lines from being too thick at a close-up zoom level.       | Number          | (none)   | X          |            |
| `opacity`                 | Opacity of the object                                                                                               | Number          | `1`      | X          |            |

### stadium

| Property            | Description                                                                                                          | Type            | Default  | Per-stream | Per-object |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ---------- | ---------- |
| `fill_color`        | Fill color of the stadium                                                                                            | [Color](#color) | `'#fff'` | X          | X          |
| `radius`            | Radius of the stadium in meters                                                                                      | Number          | `1`      | X          | X          |
| `radius_min_pixels` | The minimum pixels to draw the radius at. Prevents the stadiums from being too small to see at a far-away zoom level | Number          | (none)   | X          |            |
| `radius_max_pixels` | The maximum pixels to draw the radius at. Prevents the stadiums from being too large at a close-up zoom level        | Number          | (none)   | X          |            |
| `opacity`           | Opacity of the object                                                                                                | Number          | `1`      | X          |            |

### text

| Property        | Description                                                                                              | Type            | Default   | Per-stream | Per-object |
| --------------- | -------------------------------------------------------------------------------------------------------- | --------------- | --------- | ---------- | ---------- |
| `font_family`   | Font name of the texts. A valid CSS font-family value                                                    | String          | `'Arial'` | X          |            |
| `font_weight`   | Font weight of the texts. A valid CSS numeric font-weight value                                          | Number          | `400`     | X          |            |
| `fill_color`    | Color of the texts                                                                                       | [Color](#color) | `'#fff'`  | X          | X          |
| `text_size`     | Size of the text in pixels                                                                               | Number          | `12`      | X          | X          |
| `text_rotation` | Counter-clockwise rotation of the text in degrees                                                        | Number          | `0`       | X          | X          |
| `text_anchor`   | The horizontal alignment of a `text` primitive relative to its position. One of `START`, `MIDDLE`, `END` | String          | `MIDDLE`  | X          | X          |
| `text_baseline` | The vertical alignment of a `text` primitive relative to its position. One of `TOP`, `CENTER`, `BOTTOM`  | String          | `CENTER`  | X          | X          |
| `opacity`       | Opacity of the object                                                                                    | Number          | `1`       | X          |            |

## Property Types

### Color

Color values can be in one of the following formats:

- Hex string in RGB or RGBA, e.g. `'#F00'`, `'#F00A'`, `'#FF0000'`, `'#FF000080'`.
- Valid CSS color string, e.g. `'red'`, `'rgba(255, 0, 0, 0.5)'`.
- RGB or RGBA array, each component in 0-255 range. e.g. `[255, 0, 0]`, `[255, 0, 0, 128]`.

### Point Color Mode

How to color `point` primitives. Can be one of 3 values:

- `DEFAULT` - use inline colors if provided, or `fill_colors` style otherwise
- `ELEVATION` - color by elevation from the ground.
- `DISTANCE_TO_VEHICLE` - color by distance to the vehicle.

## Remarks

Some styling features cause additional rendering overhead. For example, stroke and fill are done in
separate passes.

In XVIZ we have setup styling to take advantage of this if possible. For example, assume you have an
extruded polygon stream. If you want to differentiate objects with stroke and fill style differences
you can achieve this in 2 ways.

### Use opacity to control stroke & fill on objects when enabled on the stream

Since every object would have stroke and fill enabled you would need to set the color with an
opacity 0 to have the stroke or fill not show up on a specific element. You will be paying the cost
of these passes, but you will be able to have styling difference all within a single stream.

### Separate out different styled object in different streams

An alternative approach would be to seperate out objects in a different stream that had stream level
settings for stroke and fill. This approach may reduce the overhead required in per-object styling
and render costs.
