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

##### panel()
Return `XvizPannelBuilder`

##### container()
Return `XvizContainerBuilder`

##### metric()
Return `XvizMetricBuilder`

##### table()
Return `XvizMetricBuilder`

##### treeTable()
Return `XvizTreeTableBuilder`

##### plot()
Return `XvizMetricBuilder`

##### video()
Return `XvizMetricBuilder`

# Shared in different UI Builders (XvizPanelBuilder, XvizContainerBuilder, XvizMetricBuilder, etc.)

## Methods

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

  const builder = new XvizUIBuilder({});

  const panel = builder
    .panel({name: 'Metrics Panel'});

  const container = builder
    .container({name: 'Metrics Container 1'});

  const metrics1 = builder
    .metric({streams: ['/vehicle/velocity']})
    .title('Velocity');

  const metrics2 = builder
    .metric({streams: ['/vehicle/acceleration']})
    .title('Acceleration');
  
  container.child(metrics1).child(metrics2);
  panel.child(container);
  builder.child(panel);
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
