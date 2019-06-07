# XVIZUIBuilder

The `XVIZUIBuilder` class provides convenient chaining functions to build declarative UI.

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
- [Panel](#XVIZPanelBuilder) has children, which could be either _component_ or _container_
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

const metrics1 = builder.metric({streams: ['/vehicle/velocity'], title: 'Velocity'});

const metrics2 = builder.metric({streams: ['/vehicle/acceleration'], title: 'Acceleration'});

container.child(metrics1);
container.child(metrics2);
builder.child(panel).child(container);

const ui = builder.getUI();
console.log(ui);
```

## XVIZUIBuilder

The root builder for declarative UI.

### Constructor

```js
import {XVIZUIBuilder} from '@xviz/builder';
const xvizUIBuilder = new XVIZUIBuilder(options);
```

Parameters:

- `options.validateWarn` (Function) - called when there is a validation warning. Default is
  `console.warn`.
- `options.validateError` (Function) - called when there is a validation error. Default is
  `console.error`.

### Methods

##### child(panel)

Append a [`XVIZPanelBuilder`](#XVIZPanelBuilder) instance to the root. Returns the child.

##### getUI()

Returns a JSON descriptor of all UI components.

##### panel(options)

Returns a new [`XVIZPanelBuilder`](#XVIZPanelBuilder) instance with the specified options.

```js
const panelBuilder = xvizUIBuilder.panel(options);
```

Parameters:

- `options.name` (String)
- `options.layout` (String) - `VERTICAL` or `HORIZONTAL`.
- `options.interactions` (String) - `REORDERABLE` or `DRAG_OUT`

##### container(options)

Returns a new [`XVIZContainerBuilder`](#XVIZContainerBuilder) instance with the specified options.

```js
const containerBuilder = xvizUIBuilder.container(options);
```

Parameters:

- `options.name` (String)
- `options.layout` (String) - `VERTICAL` or `HORIZONTAL`.
- `options.interactions` (String) - `REORDERABLE` or `DRAG_OUT`

##### metric(options)

Returns a new [`XVIZMetricBuilder`](#XVIZMetricBuilder) instance with the specified options.

```js
const metricBuilder = xvizUIBuilder.metric(options);
```

Parameters:

- `options.title` (String) - title of the metrics card
- `options.description` (String) - description of the metrics card
- `options.streams` (Array) - a list of variable streams to visualize

##### plot(options)

Returns a new [`XVIZPlotBuilder`](#XVIZPlotBuilder) instance with the specified options.

```js
const plotBuilder = xvizUIBuilder.plot(options);
```

Parameters:

- `options.title` (String) - title of the plot
- `options.description` (String) - description of the plot
- `options.independentVariable` (String) - the independent variable stream
- `options.dependentVariables` (Array) - a list of dependent variable streams

##### select(options) (WARNING: Unstable feature)

Returns a new [`XVIZSelectBuilder`](#XVIZSelectBuilder) instance with the specified options.

```js
const selectBuilder = xvizUIBuilder.select(options);
```

Parameters:

- `options.title` (String) - title of the select
- `options.description` (String) - description of the select
- `options.stream` (String) - the variable stream that provides the options
- `options.target` (String) - JSON pointer to configuration property to update

##### table(options)

Returns a new [`XVIZTableBuilder`](#XVIZTableBuilder) instance with the specified options.

```js
const tableBuilder = xvizUIBuilder.table(options);
```

Parameters:

- `options.title` (String) - title of the plot
- `options.description` (String) - description of the plot
- `options.stream` (String) - the stream that contains the table data
- `options.displayObjectId` (Boolean) - whether to display the object ID column

##### treetable(options)

Returns a new [`XVIZTreeTableBuilder`](#XVIZTreeTableBuilder) instance with the specified options.

```js
const treetableBuilder = xvizUIBuilder.treetable(options);
```

Parameters:

- `options.title` (String) - title of the plot
- `options.description` (String) - description of the plot
- `options.stream` (String) - the stream that contains the table data
- `options.displayObjectId` (Boolean) - whether to display the object ID column

##### video(options)

Returns a new [`XVIZVideoBuilder`](#XVIZVideoBuilder) instance with the specified options.

```js
const videoBuilder = xvizUIBuilder.video(options);
```

Parameters:

- `options.cameras` (Array) - a list of streams to render as video

## XVIZPanelBuilder

The panel builder for declarative UI.

### Methods

##### child(node)

Append a container or a component to the panel. Returns the child.

##### getUI()

Returns a JSON descriptor of this panel.

## XVIZContainerBuilder

The container builder for declarative UI.

### Methods

##### child(component)

Append a container or a component to the container. Returns the child.

##### getUI()

Returns a JSON descriptor of this container.

## XVIZMetricBuilder

The metric component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZPlotBuilder

The plot component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZSelectBuilder (WARNING: Unstable feature)

The select component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZTableBuilder

The table component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZTreeTableBuilder

The tree table component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.

## XVIZVideoBuilder

The video component builder for declarative UI.

### Methods

##### getUI()

Returns a JSON descriptor of this component.
