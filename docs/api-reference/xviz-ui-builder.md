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

##### metric()
Return `XvizMetricBuilder`

##### container()
Return `XvizContainerBuilder`

# Shared in different UI Builders (XvizPanelBuilder, XvizContainerBuilder, XvizMetricBuilder)

## Methods

##### children()
Start adding children to the `panel` instance.

##### done()
Return root `XvizUIBuilder` instance.

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


## How does Xviz UI builder work?
* UI root has a list of `panel`s
* `panel` (`XvizPannelBuilder`) has children, which could be either `component` or `container`
* `container` (`XvizContainerBuilder`) children could be either `component` or `container`
* `component` could be one of the following types
  - `metric` - `XvizMetricBuilder`
  - `tree_table` (coming soon)
  - `table` (coming soon)
  - `plot` (coming soon)
  - `video` (coming soon)

## Example

```js
import { XvizUIBuilder } from '@xviz/builder';
const builder = new XvizUIBuilder({});

  builder
    .panel()
    .name('Metrics')
    .children()

    .container()
    .children()

    .metric()
    .title('Velocity')
    .done()

    .metric()
    .title('Acceleration')
    .done()

    .done();
```

Expected result is as following.
```js
   [
    {
      type: 'panel',
      children: [
        {
          type: 'container',
          children: [
            {
              type: 'metric',
              title: 'Velocity'
            },
            {
              type: 'metric',
              title: 'Acceleration'
            }
          ]
        }
      ],
      name: 'Metrics'
    }
  ];


```
