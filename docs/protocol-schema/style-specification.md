# Styling XVIZ

# Introduction

Styling in XVIZ happens at multiple levels. This allows definition of defaults and control to avoid
excessive style redundancy while not compromising on expressiveness.

The styling levels are, in resolution priority:

- Object inline styles
- Stream style classes
- Stream style defaults

# Style Levels

## Object Styling

There are two ways to specify styles at the object level:

- inline
- classes

Object styling happens thru the XVIZBuilder interface. Specifially the `style()` and `classes()`
functions.

## Style Classes

Style classes work similar to HTML and CSS. Objects have class selectors defined, which resolve
against a stylesheet. XVIZ defines this stylesheet in the metadata (see XVIZMetadataBuilder) and the
classes are scoped by streamId.

An important part of style class resolution is how style precedence is defined. In XVIZ the last
class takes precedences over classes that are defined before it. This enables you to control your
style ordering when defining classes using the XVIZMetadataBuilder.

### Selectors

Each style object contains a `class` field that specifies the selector of the style. A style only
applies to an object if the selector is matched.

- `<name>` matches an object if it contains the given field.
- Space separate multiple selectors to match an objects that satisfies them all.
- If an object matches multiple selectors in a stylesheet, the one that is defined last trumps.

Here is an example of metadata with style classes defined for a stream '/object/shape'

```js
{
    'version': '2.0.0',
    'streams': {
        '/object/shape': {                      // stream name
            'style_classes': [
                {
                  'name': 'OBJECT_LABEL',            // selector
                  'style': {
                      'stroke_color': '#9D9DA3'
                  }
                },
                {
                  'name': 'OBJECT_LABEL selected',   // selector
                  'style': {
                      'stroke_color': '#FFC000',
                      'fill_color': '#FFC00080'
                  }
                }
            ]
        }
    }
}
```

## Stream Styling

Stream styling allows you to define all the properties that an Object my use, but also includes
additional properties that effectively act as toggles for rendering. These properties allow for some
performance advantage in the rendering pipeline when set to 'false'.

Any style defined at the stream level will be the default style for any Objcts in that stream.

# Styles

## Per Object Properties

These style properties that can be set on individual objects or in a stylesheet.

##### `fill_color` (array | string)

The fill color of a `point`, `circle`, `text` or `polygon` primitive.

Default: `#FFFFFF`

##### `stroke_color` (array | string)

The stroke color of a `line`, `path` or `polygon` primitive.

Default: `#FFFFFF`

##### `stroke_width` (number)

The stroke width of a `line`, `path` or `polygon` primitive in meters.

Default: `1`

##### `radius` (number)

The radius of a `point` or `circle` primitive in meters.

Default: `1`

##### `height` (number)

The height of an extruded `polygon` primitive in meters.

Default: `0`

##### `size` (number)

The size of a `text` primitive in pixels.

Default: `12`

##### `angle` (number)

The rotation of a `text` primitive in degrees.

Default: `0`

##### `text_anchor` (string)

The horizontal alignment of a `text` primitive relative to its position.

One of `start`, `middle`, `end`.

Default: `middle`

##### `alignment_baseline` (string)

The vertical alignment of a `text` primitive relative to its position.

One of `top`, `center`, `bottom`.

Default: `center`

## Per Stream Properties

Cannot be customized per object - only effective when specified inside in the stream style.

##### `radius_min_pixels` (number)

The minimum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from
being too small to see at a far-away zoom level.

Default: no constraint

##### `radius_max_pixels` (number)

The maximum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from
getting too large at a closed-up zoom level.

Default: no constraint

##### `stroke_width_min_pixels` (number)

The minimum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the
lines from being too thin to see at a far-away zoom level.

Default: no constraint

##### `stroke_width_max_pixels` (number)

The maximum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the
lines from getting too thick at a closed-up zoom level.

Default: no constraint

##### `opacity` (number)

Opacity of the object, between `0` and `1`.

Default: `1`.

##### `stroked` (bool)

Whether to draw outline of `polygon` primitives.

Default: `true`

##### `filled` (bool)

Whether to fill `polygon` primitives.

Default: `true`

##### `extruded` (bool)

Whether to extrude `polygon` primitives into 3D objects.

Default: `false`

##### `wireframe` (bool)

Whether to draw 3D outline for extruded `polygon` primitives.

Default: `false`

## Explanation of Object Property and Stream Property

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

# Style Property Tables

## Object Style Property Table

This table shows what style properties apply to each primitive type.

| Type\Property | fill_color | radius | stroke_width | stroke_color | size | angle | text_anchor | alignment_baseline |
| ------------- | ---------- | ------ | ------------ | ------------ | ---- | ----- | ----------- | ------------------ |
| circle        | X          | X      |              |              |      |       |             |                    |
| image         |            |        |              |              |      |       |             |                    |
| point         | X          | X      |              |              |      |       |             |                    |
| polygon       | X          |        | X            | X            |      |       |             |                    |
| polyline      |            |        | X            | X            |      |       |             |                    |
| stadium       | X          |        | X            | X            |      |       |             |                    |
| text          | X          |        |              |              | X    | X     | X           | X                  |

## Stream Property Table

This table shows the _additional_ style properties that apply at the stream level for each primitive
type.

| Type\Property | opacity | stroked | filled | extruded | wireframe | radiusMinPixel | radius_max_pixels | stroke_width_min_pixels | stroke_width_min_pixels |
| ------------- | ------- | ------- | ------ | -------- | --------- | -------------- | ----------------- | ----------------------- | ----------------------- |
| circle        | x       |         |        |          |           | x              | x                 |                         |                         |
| image         |         |         |        |          |           |                |                   |                         |                         |
| point         | x       |         |        |          |           |                |                   |                         |                         |
| polygon       | x       | x       | x      | x        | x         |                |                   | x                       | x                       |
| polyline      | x       |         |        |          |           |                |                   | x                       | x                       |
| stadium       | x       | x       | x      | x        | x         |                |                   | x                       | x                       |
| text          | x       |         |        |          |           |                |                   |                         |                         |

## Stype Property Default Values

| Property                | Default Value |
| ----------------------- | ------------- |
| fill_color              | '#FFFFFF'     |
| stroke_color            | '#FFFFFF'     |
| stroke_width            | 1             |
| radius                  | 1             |
| height                  | 0             |
| size                    | 12            |
| angle                   | 0             |
| text_anchor             | 'middle'      |
| alignment_baseline      | 'center'      |
| opacity                 | 1             |
| stroked                 | true          |
| filled                  | true          |
| extruded                | false         |
| wireframe               | false         |
| radius_min_pixels       | no constraint |
| radius_max_pixels       | no constraint |
| stroke_width_min_pixels | no constraint |
| stroke_width_max_pixels | no constraint |
