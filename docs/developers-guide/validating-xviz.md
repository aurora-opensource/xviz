# Validating XVIZ

## Validating XVIZ metadata

```js
import {XVIZValidator} from '@xviz/schema';

const validator = new XVIZValidator();

// Throws on error
metadata = {
  version: '2.0.0'
};

validator.validateMetadata(metadata);
```

## Validating XVIZ primitives

```js
// Create a stream
import {XVIZBuilder} from '@xviz/builder';

const builder = new XVIZBuilder();

// prettier-ignore
builder
  .pose()
  .timestamp(ts1);
builder
  .primitive('/test/polygon')
  .timestamp(ts1)
  .polygon([[0, 0, 0], [4, 0, 0], [4, 3, 0]]);

// Validate it
import {XVIZValidator} from '@xviz/schema';

const validator = new XVIZValidator();

validator.validateStateUpdate(builder.getMessage());
```
