# XvizUIBuilder

`XvizUIBuilder` class provides convenient chaining functions to build declarative UI 

## Constructor

##### metadata (Object)
* Use `XvizMetadataBuilder` to construct metadata object.

##### validateWarn (Function),
* called when there is a validation warning. Default is `console.warn`.

##### validateError (Function)
* called when there is a validation error. Default is `console.error`.

## Methods

##### panelLeft()
Return `XvizPannelBuilder`

##### panelRight()
Return `XvizUIBuilder` instance (root).

##### containerLeft()
Return `XvizContainerBuilder`

##### panelRight()
Return `XvizUIBuilder` instance (root).

##### metricLeft()
Return `XvizMetricBuilder`

##### metricRight()
Return `XvizUIBuilder` instance (root).

##### tableLeft()
Return `XvizMetricBuilder`

##### tableRight()
Return `XvizUIBuilder` instance (root).

##### treeTableLeft()
Return `XvizTreeTableBuilder`

##### treeTableRight()
Return `XvizUIBuilder` instance (root).

##### plotLeft()
Return `XvizMetricBuilder`

##### plotRight()
Return `XvizUIBuilder` instance (root).

##### videoLeft()
Return `XvizMetricBuilder`

##### videoRight()
Return `XvizUIBuilder` instance (root).

# Shared in different UI Builders (XvizPanelBuilder, XvizContainerBuilder, XvizMetricBuilder)

## Methods

##### children()
Start adding children to the `panel` instance.

##### getUI()
Return an object containing all the UI elements in this instance and all its children


# XvizPanelBuilder

## Methods

##### name(string)

##### layout(string)
`vertical` or `horizontal`.

##### interactions
`reorderable` or `drag_out`


# XvizContainerBuilder

## Methods

##### layout(string)
`vertical` or `horizontal`.

##### interactions
`reorderable` or `drag_out`


# XvizMetricBuilder

## Methods

##### streams(array)

##### description(string)

##### title(string)


## Xviz UI types hierarchy 
* UI root has a list of `panel`s
* `panel` (`XvizPannelBuilder`) has children, which could be either `component` or `container`
* `container` (`XvizContainerBuilder`) children could be either `component` or `container`
* `component` could be one of the following types
  - `metric` - `XvizMetricBuilder`
  - `tree_table` - `XvizTreeTableBuilder`
  - `table` - `XvizTableBuilder`
  - `plot` - `XvizPlotBuilder`
  - `video` - `XvizVideoBuilder`

## Example

```js
import { XvizUIBuilder } from '@xviz/builder';
const builder = new XvizUIBuilder({});

  builder
    .panelLeft({
      name: 'Metrics Panel'
    })
    .children()

    .containerLeft({
      name: 'Metrics Container'
    })
    .children()

    .metricLeft({
      streams: ['/vehicle/velocity']
    })
    .metricRight()

    .metricLeft({
      streams: ['/vehicle/acceleration']
    })
    .title('Acceleration')
    .metricRight()

    .containerRight()
    .panelRight();
```

Expected result is as following.
```js
   [
    {
      type: 'panel',
      name: 'Metrics Panel',
      children: [
        {
          type: 'container',
          name: 'Metrics Container',
          children: [
            {
              type: 'metric',
              title: 'Velocity',
              streams: ['/vehicle/velocity']
            },
            {
              type: 'metric',
              title: 'Acceleration',
              streams: ['/vehicle/acceleration']
            }
          ]
        }
      ]
    }
  ];


```
