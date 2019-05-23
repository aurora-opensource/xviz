# XVIZProviderFactory

The XVIZProviderFactory provides the ability to create a Provider without knowing the specific
implementation that handles the underlying data source.

## Example

```js
import {XVIZProviderFactory} from '@xviz/io';
import {FileSource} from '@xviz/io/node';

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

##### async open({root, source, options})

Attempts to open an XVIZ Provider from the given location and source by iterating over an internal
list of Providers. If a provider is successful it will be returned otherwise null is returned.

Parameters:

- `root` (string) - the output directory
- `source` ([XVIZ Source](/docs/api-reference/io/xviz-source-sink.md)) - the source of XVIZ data
- `options` (Object) - options passed through to the underlying Providers

Returns: ([XVIZ Provider](/docs/api-reference/io/overview-provider.md)) - Provider object
