# XVIZProviderFactory

The XVIZProviderFactory provides the ability to create an XVIZProvider without knowing the specific
implementation that handles the underlying data source.

## Example

```js
import {FileSource, XVIZProviderFactory} from '@xviz/io';

const root = '.';
const source = new FileSource(root);
const provider = await XVIZProviderFactory.open({
  source,
  root
});

if (provider) {
  // ...
}
```

## Methods

### async open({root, source, options})

Attempts to open an XVIZ Provider from the given location and source. If a provider is successful it
will be returned otherwise null is returned.

_Parameters:_

- **root** (String) - the output directory.
- **source** (XVIZSource) - a [XVIZ Source](/docs/api-reference/io/xviz-source-sink.md) object.
- **options** (Object) - implementation defined options.
