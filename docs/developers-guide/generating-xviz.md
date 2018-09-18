# Generating XVIZ


## Generating XVIZ metadata

```js
import {XVIZMetadataBuilder} from '@xviz/builder';

const xb = new XVIZMetadataBuilder();
xb.startTime(0).endTime(1);

const metadata = xb.getMetadata();
```

## Generating XVIZ primitives

```js
import {XVIZBuilder} from '@xviz/builder';

const builder = new XVIZBuilder();
const streamId = '/test/polygon';

const verts1 = [[0, 0, 0], [4, 0, 0], [4, 3, 0]];
const verts2 = [[1, 2, 3], [0, 0, 0], [2, 3, 4]];
const ts1 = 1.0;
const ts2 = 2.0;

builder
  .pose({time: ts1})
  .stream(streamId)
  .timestamp(ts1)
  .polygon(verts1)
  .polygon(verts2)
  .timestamp(ts2);
```


## Generating XVIZ declarative UI

See separate section.
