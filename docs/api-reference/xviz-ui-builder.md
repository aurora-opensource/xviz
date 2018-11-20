# XVIZUIBuilder

`XVIZUIBuilder` class provides convenient chaining functions to build declarative UI.

## XVIZ Declarative UI hierarchy

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

- UI root has a list of `panel`s
- [Panel](#XVIZPannelBuilder) has children, which could be either _component_ or _container_
- [Container](#XVIZContainerBuilder) children could be either _component_ or _container_
- Component could be one of the following types:
  - [Metric](#XVIZMetricBuilder)
  - [TreeTable](#XVIZTreeTableBuilder)
  - [Table](#XVIZTableBuilder)
  - [Plot](#XVIZPlotBuilder)
  - [Video](#XVIZVideoBuilder)

## Example

```js
import {XVIZUIBuilder} from '@xviz/builder';
const builder = new XVIZUIBuilder({});

const builder = new XVIZUIBuilder({});

const panel = builder.panel({name: 'Metrics Panel'});

const container = builder.container({name: 'Metrics Container 1'});

const metrics1 = builder.metric({streams: ['/vehicle/velocity']}).title('Velocity');

const metrics2 = builder.metric({streams: ['/vehicle/acceleration']}).title('Acceleration');

container.child(metrics1);
container.child(metrics2);
builder.child(panel).child(container);
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

## XVIZUIBuilder

The root builder for declarative UI.

### Constructor

```js
new XVIZUIBuilder(options);
```

Parameters:

- **options.validateWarn** (Function) - called when there is a validation warning. Default is
  `console.warn`.
- **options.validateError** (Function) - called when there is a validation error. Default is
  `console.error`.

### Methods

##### child(panel)

Append a [`XVIZPannelBuilder`](#XVIZPannelBuilder) instance to the root. Returns the child.

##### getUI()

Returns a JSON descriptor of all UI components.

##### panel(options)

Returns a new [`XVIZPannelBuilder`](#XVIZPannelBuilder) instance with the specified options.

##### container(options)

Returns a new [`XVIZContainerBuilder`](#XVIZContainerBuilder) instance with the specified options.

##### metric(options)

Returns a new [`XVIZMetricBuilder`](#XVIZMetricBuilder) instance with the specified options.

##### table(options)

Returns a new [`XVIZTableBuilder`](#XVIZTableBuilder) instance with the specified options.

##### treetable(options)

Returns a new [`XVIZTreeTableBuilder`](#XVIZTreeTableBuilder) instance with the specified options.

##### plot(options)

Returns a new [`XVIZPlotBuilder`](#XVIZPlotBuilder) instance with the specified options.

##### video(options)

Returns a new [`XVIZVideoBuilder`](#XVIZVideoBuilder) instance with the specified options.

## XVIZPanelBuilder

The panel builder for declarative UI.

### Constructor

```js
new XVIZPanelBuilder(options);
```

Parameters:

- **options.name** (String)
- **options.layout** (String) - `vertical` or `horizontal`.
- **options.interactions** (String) - `reorderable` or `drag_out`

### Methods

##### child(node)

Append a container or a component to the panel. Returns the child.

##### getUI()

Returns a JSON descriptor of this panel.

## XVIZContainerBuilder

The container builder for declarative UI.

### Constructor

```js
new XVIZContainerBuilder(options);
```

Parameters:

- **options.name** (String)
- **options.layout** (String) - `vertical` or `horizontal`.
- **options.interactions** (String) - `reorderable` or `drag_out`

### Methods

##### child(panel)

Append a container or a component to the container.

##### getUI()

Returns a JSON descriptor of this container.

## XVIZMetricBuilder

The metric component builder for declarative UI.

### Constructor

```js
new XVIZMetricBuilder(options);
```

Parameters:

- **options.title** (String) - title of the metrics card
- **options.description** (String) - description of the metrics card
- **options.streams** (Array) - a list of variable streams to visualize

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZPlotBuilder

The plot component builder for declarative UI.

### Constructor

```js
new XVIZPlotBuilder(options);
```

Parameters:

- **options.title** (String) - title of the plot
- **options.description** (String) - description of the plot
- **options.independentVariable** (String) - the independent variable stream
- **options.dependentVariable** (Array) - a list of dependent variable streams

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZTableBuilder

The table component builder for declarative UI.

### Constructor

```js
new XVIZTableBuilder(options);
```

Parameters:

- **options.title** (String) - title of the plot
- **options.description** (String) - description of the plot
- **options.stream** (String) - the stream that contains the table data
- **options.displayObjectId** (boolean) - whether to display the object ID column

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZTreeTableBuilder

The tree table component builder for declarative UI.

### Constructor

```js
new XVIZTreeTableBuilder(options);
```

Parameters:

- **options.title** (String) - title of the plot
- **options.description** (String) - description of the plot
- **options.stream** (String) - the stream that contains the table data
- **options.displayObjectId** (boolean) - whether to display the object ID column

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZVideoBuilder

The video component builder for declarative UI.

### Constructor

```js
new XVIZVideoBuilder(options);
```

Parameters:

- **options.cameras** (Array) - a list of streams to render as video

### Methods

##### getUI()

Returns a JSON descriptor of this component.
