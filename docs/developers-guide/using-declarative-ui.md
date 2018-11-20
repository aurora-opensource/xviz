# Using the Declarative UI

XVIZ allows the producer to declartively connect strams to UI components like control widgets,
tables, charts, and tree-views. These UI components can be rendered by the XVIZ client, and can be
used to provide additional information beyond what can be captured in the primary 3D scene.

The easiest way to add declarative UI components to your XVIZ in JavaScript is to use the
`XVizUIBuilder` class.

```js
const builder = new XVIZDeclarativeUIBuilder({});

builder
  .panel('Metrics')
  .container('child-1')

  .metric('child-1-1')
  .title('Acceleration')
  .end()

  .metric('child-1-2')
  .title('Velocity')
  .end()

  .end();
```
