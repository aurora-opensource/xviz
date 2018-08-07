# XvizStylesheet

A stylesheet is used to render all XVIZ data. It is in the following shape:
```js
{
    '/object/shape':                          // channel name
    {
        'label=OBJECT_LABEL':            // selector1
        {
          strokeColor: '#9D9DA3'
        },
        'label=OBJECT_LABEL selected':   // selector2
        {
          strokeColor: '#FFC000',
          fillColor: '#FFC00080'
        }
    }
}
```

## Selectors

* `<name>` matches an object if it contains the given field.
* `<name>=<value>` matches an object if the given field is equal to the given value.
* Space separate multiple selectors to match an objects that satisfies them all.
* `*` matches all objects
* If an object matches multiple selectors in a stylesheet, the one that is defined last trumps.


## Properties

##### `strokeColor` (array | string)

The stroke color of a `line`, `path` or `polygon` primitive. Default `#FFF`.

##### `fillColor` (array | string)

The fill color of a `point`, `circle` or `polygon` primitive. Default `#FFF`.

##### `radius` (number)

The radius of a `point` or `circle` primitive in meters. Default `1`.

##### `radiusMinPixels` (number)

The minimum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from being too small to see at a far-away zoom level.

Cannot be customized per object * only effective when specified inside the `*` selector. Default no constraints.

##### `radiusMaxPixels` (number)

The maximum pixels to draw the radius of `point` or `circle` primitives. Prevent the circles from getting too large at a closed-up zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `strokeWidth` (number)

The stroke width of a `line`, `path` or `polygon` primitive. Default `1`.

##### `strokeWidthMinPixels` (number)

The minimum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the lines from being too thin to see at a far-away zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `strokeWidthMaxPixels` (number)

The maximum pixels to draw the stroke with of `line`, `path` or `polygon` primitives. Prevent the lines from getting too thick at a closed-up zoom level.

Cannot be customized per object - only effective when specified inside the `*` selector. Default no constraints.

##### `height` (number)

The height of an extruded `polygon` primitive in meters. Default `0`.

##### `opacity` (number)

Opacity of the object, between `0` and `1`. Cannot be customized per object - only effective when specified inside the `*` selector. Default `1`.

##### `stroked` (bool)

Whether to draw outline of `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `true`.

##### `filled` (bool)

Whether to fill `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `true`.

##### `extruded` (bool)

Whether to extrude `polygon` primitives into 3D objects. Cannot be customized per object - only effective when specified inside the `*` selector. Default `false`.

##### `wireframe` (bool)

Whether to draw 3D outline for extruded `polygon` primitives. Cannot be customized per object - only effective when specified inside the `*` selector. Default `false`.
