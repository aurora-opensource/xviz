# XVIZStyleParser

The `XVIZStyleParser` class offers convenient APIs to evaluate a
[XVIZ stylesheet](/docs/protocol-schema/style-specification.md).

Example:

```js
import {XVIZStyleParser} from '@xviz/parser';

// `metadata` is the log's metadata
const parser = new XVIZStyleParser(metadata.styles);
const objectStreamStyles = parser.getStylesheet('/object/shape');
// `object` is a primitive in the /object/shape stream
const objectColor = objectStreamStyles.getProperty('fill_color', object);
```

## XVIZStyleParser

### Constructor

```js
new XVIZStyleParser(styles);
```

Parameters:

- **styles** (Object) - a map from stream name to stylesheet definition

### Methods

##### getStylesheet(streamName)

Returns a `Stylesheet` instance for the given stream. If the stream name does not exist, an empty
`Stylesheet` is returned.

Parameters:

- **streamName** (String)

## Stylesheet

### Methods

##### getProperty(propertyName, object)

Returns the value of a styling property when this stylesheet is applied to the given object. `null`
if not defined.

Parameters:

- **propertyName** (String)
- **object** (Object) - the object to evaluate

##### getPropertyDefault(propertyName)

Returns the default value of a styling property.

Parameters:

- **propertyName** (String)

##### getPropertyDependencies(propertyName)

Returns a list of attribute names that a property depends on. When an object's attributes are
updated, this list may be used to determine whether the appearance of the object will change.

Parameters:

- **propertyName** (String)
