## XVIZProviderFactory

The XVIZProviderFactory provides the ability to create an XVIZProvider without knowing the specific
implementation that handles the underlying data source.

### Example

```js
TODO;
```

### Constructor

```js
TODO;
```

### Methods

##### open({root, source, options})

Attempts to open an XVIZ Provider from the given location and source. If a provider is successful it
will be returned otherwise null is returned.

Parameters:

- **root** (String) - the output directory.
- **source** (XVIZSource) - a XVIZ Source object. See
  [XVIZ Source](/docs/api-reference/io/xviz-source-sink.md).
- **options** (Object) - the output directory.
