# XvizUIBuilder

`XvizUIBuilder` class provides convenient chaining functions to build declarative UI.

## Xviz Declarative UI hierarchy

```
Root
 ┣━ Panel
 ┃   ┣━ Container
 ┃   ┃    ┣━ Container
 ┃   ┃    ┃    ┗━ Component
 ┃   ┃    ┗━ Component
 ┃   ┣━ Component
 ┃   ┗━ Component
 ┗━ Panel
```

* UI root has a list of `panel`s
* [Panel](#XvizPannelBuilder) has children, which could be either *component* or *container*
* [Container](#XvizContainerBuilder) children could be either *component* or *container*
* Component could be one of the following types:
  - [Metric](#XvizMetricBuilder)
  - [TreeTable](#XvizTreeTableBuilder)
  - [Table](#XvizTableBuilder)
  - [Plot](#XvizPlotBuilder)
  - [Video](#XvizVideoBuilder)


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

Output:
```js
builder.getUI();
/* returns:
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
  ]
*/
```

## XvizUIBuilder

The root builder for declarative UI.

### Constructor

```js
new XvizUIBuilder(options);
```

Parameters:

* **options.validateWarn** (Function) - called when there is a validation warning. Default is `console.warn`.
* **options.validateError** (Function) - called when there is a validation error. Default is `console.error`.

### Methods

##### child(panel)
Append a [`XvizPannelBuilder`](#XvizPannelBuilder) instance to the root.

##### getUI()
Returns a JSON descriptor of all UI components.

##### panel(options)
Returns a new [`XvizPannelBuilder`](#XvizPannelBuilder) instance with the specified options.

##### container(options)
Returns a new [`XvizContainerBuilder`](#XvizContainerBuilder) instance with the specified options.

##### metric(options)
Returns a new [`XvizMetricBuilder`](#XvizMetricBuilder) instance with the specified options.

##### table(options)
Returns a new [`XvizTableBuilder`](#XvizTableBuilder) instance with the specified options.

##### treeTable(options)
Returns a new [`XvizTreeTableBuilder`](#XvizTreeTableBuilder) instance with the specified options.

##### plot(options)
Returns a new [`XvizPlotBuilder`](#XvizPlotBuilder) instance with the specified options.

##### video(options)
Returns a new [`XvizVideoBuilder`](#XvizVideoBuilder) instance with the specified options.


## XvizPanelBuilder

The panel builder for declarative UI.

### Constructor

```js
new XvizPanelBuilder(options);
```

Parameters:
* **options.name** (String)
* **options.layout** (String) - `vertical` or `horizontal`.
* **options.interactions** (String) - `reorderable` or `drag_out`

### Methods

##### child(panel)
Append a container or a component to the panel.

##### getUI()
Returns a JSON descriptor of this panel.

## XvizContainerBuilder

The container builder for declarative UI.

### Constructor

```js
new XvizContainerBuilder(options);
```

Parameters:
* **options.name** (String)
* **options.layout** (String) - `vertical` or `horizontal`.
* **options.interactions** (String) - `reorderable` or `drag_out`

### Methods

##### child(panel)
Append a container or a component to the container.

##### getUI()
Returns a JSON descriptor of this container.


## XvizMetricBuilder

The metric component builder for declarative UI.

### Constructor

```js
new XvizMetricBuilder(options);
```

Parameters:
* **options.title** (String) - title of the metrics card
* **options.description** (String) - description of the metrics card
* **options.streams** (Array) - a list of variable streams to visualize

### Methods

##### getUI()
Returns a JSON descriptor of this component.


## XvizPlotBuilder

The plot component builder for declarative UI.

### Constructor

```js
new XvizPlotBuilder(options);
```

Parameters:
* **options.title** (String) - title of the plot
* **options.description** (String) - description of the plot
* **options.independentVariable** (String) - the independent variable stream
* **options.dependentVariable** (Array) - a list of dependent variable streams

### Methods

##### getUI()
Returns a JSON descriptor of this component.


## XvizTableBuilder

The table component builder for declarative UI.

### Constructor

```js
new XvizTableBuilder(options);
```

Parameters:
* **options.title** (String) - title of the plot
* **options.description** (String) - description of the plot
* **options.stream** (String) - the stream that contains the table data
* **options.displayObjectId** (boolean) - whether to display the object ID column

### Methods

##### getUI()
Returns a JSON descriptor of this component.


## XvizTreeTableBuilder

The tree table component builder for declarative UI.

### Constructor

```js
new XvizTreeTableBuilder(options);
```

Parameters:
* **options.title** (String) - title of the plot
* **options.description** (String) - description of the plot
* **options.stream** (String) - the stream that contains the table data
* **options.displayObjectId** (boolean) - whether to display the object ID column

### Methods

##### getUI()
Returns a JSON descriptor of this component.


## XvizVideoBuilder

The video component builder for declarative UI.

### Constructor

```js
new XvizVideoBuilder(options);
```

Parameters:
* **options.cameras** (Array) - a list of streams to render as video

### Methods

##### getUI()
Returns a JSON descriptor of this component.
