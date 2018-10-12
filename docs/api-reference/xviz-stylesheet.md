# XvizStylesheet

A stylesheet is used to render all XVIZ data. It is in the following shape:
```js
{
    '/object/shape':                              // stream name
    [
        {
          class: '*',
          strokeColor: '#FFFFFF'
        },
        {
          class: 'OBJECT_LABEL',            // selector
          strokeColor: '#9D9DA3'
        },
        {
          class: 'OBJECT_LABEL selected',   // selector
          strokeColor: '#FFC000',
          fillColor: '#FFC00080'
        }
    ]
}
```

## Selectors

Each style object contains an optional `class` field that specifies the selector of the style. A style only applies to an object if the selector is matched. The default selector is `*`.

* `<name>` matches an object if it contains the given field.
* Space separate multiple selectors to match an objects that satisfies them all.
* `*` matches all objects.
* If an object matches multiple selectors in a stylesheet, the one that is defined last trumps.

## Per Object Property Table

This table shows what style properties apply to each primitive type.

| Type\Property | fillColor | radius | strokeWidth | strokeColor | size | angle | textAnchor | alignmentBaseline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| circle | X | X | | | | | | |
| image | | | | | | | | |
| point | X | X | | | | | | |
| polygon | X | | X | X | | | | |
| polyline | | | X | X | | | | |
| stadium | X | | X | X | | | | |
| text | X | | | | X | X | X | X |

## Per Stream Property Table

This table shows the style properties that apply at the stream level for each primitive type.

| Type\Property| opacity | stroked | filled | extruded | wireframe | radiusMinPixel | radiusMaxPixels | strokeWidthMinPixels | strokeWidthMinPixels |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| circle |x| | | | |x|x| | |
| image | | | | | | | | | |
| point |x| | | | | | | | |
| polygon |x|x|x|x|x| | |x|x|
| polyline |x| | | | | | |x|x|
| stadium |x|x|x|x|x| | |x|x|
| text |x| | | | | | | | |

## Per Object Properties

These style properties that can be set on individual objects or in a stylesheet.

##### `fillColor` (array | string)

The fill color of a `point`, `circle`, `text` or `polygon` primitive. Default `#FFF`.

##### `strokeColor` (array | string)

The stroke color of a `line`, `path` or `polygon` primitive. Default `#FFF`.

##### `strokeWidth` (number)

The stroke width of a `line`, `path` or `polygon` primitive. Default `1`.

##### `radius` (number)

The radius of a `point` or `circle` primitive in meters. Default `1`.

##### `height` (number)

The height of an extruded `polygon` primitive in meters. Default `0`.

##### `size` (number)

The size of a `text` primitive in pixels. Default `12`.

##### `angle` (number)

The rotation of a `text` primitive in degrees. Default `0`.

##### `textAnchor` (string)

The horizontal alignment of a `text` primitive relative to its position. One of `start`, `middle`, `end`. Default `middle`.

##### `alignmentBaseline` (string)

The vertical alignment of a `text` primitive relative to its position. One of `top`, `center`, `bottom`. Default `center`.

## Per Stream Properties

Cannot be customized per object - only effective when specified inside the `*` selector. 

##### `radiusMinPixels` (number)

The minimum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from being too small to see at a far-away zoom level.

Cannot be customized per object * only effective when specified inside the `*` selector. Default no constraints.

##### `radiusMaxPixels` (number)

The maximum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from getting too large at a closed-up zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `strokeWidthMinPixels` (number)

The minimum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the lines from being too thin to see at a far-away zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `strokeWidthMaxPixels` (number)

The maximum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the lines from getting too thick at a closed-up zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `opacity` (number)

Opacity of the object, between `0` and `1`. Default `1`.

##### `stroked` (bool)

Whether to draw outline of `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `true`.

##### `filled` (bool)

Whether to fill `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `true`.

##### `extruded` (bool)

Whether to extrude `polygon` primitives into 3D objects. Cannot be customized per object - only effective when specified inside the `*` selector. Default `false`.

##### `wireframe` (bool)

Whether to draw 3D outline for extruded `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `false`.

## Explanation of Object Property and Stream Property

Some styling features cause additional rendering overhead. For example, stroke and fill are done in separate passes.

In XVIZ we have setup styling to take advantage of this if possible.  For example, assume you have an extruded polygon stream. If you want to differentiate objects with stroke and fill style differences you can achieve this in 2 ways.

### Use opacity to control stroke & fill on objects when enabled on the stream

Since every object would have stroke and fill enabled you would need to set the color with an opacity 0 to have the stroke or fill not show up on a specific element. You will be paying the cost of these passes, but you will be able to have styling difference all within a single stream.

### Separate out different styled object in different streams

An alternative approach would be to seperate out objects in a different stream that had stream level settings for stroke and fill. This approach may reduce the overhead required in per-object styling and render costs.

