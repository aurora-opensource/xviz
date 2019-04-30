# XVIZMessage

An XVIZMessage represents a XVIZ message with access the fields. The XVIZData retains retains a
reference to the XVIZMessage and should be the primary object that is passed between functions.

## Constructor

_Parameters:_

- **data** (Object|ArrayBuffer|Buffer|String) - XVIZ data of any format.

## Properties

- **type** - The [XVIZMessageType](/docs/api-reference/io/xviz-message-type.md).
- **data** - The internal data for the XVIZMessage.
