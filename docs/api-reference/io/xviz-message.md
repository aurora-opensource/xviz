# XVIZMessage

An XVIZMessage represents a parsed XVIZ message which can be traversed. The XVIZData retains retains
a reference to the XVIZMessage and should be the primary object that is passed between functions.

The XVIZData provides the state to know if the original data can be used or if a message has been
created it may have been mutated.

TODO: if a message is created, we could replace the .buffer with the message data

## Constructor

_Parameters:_

- **data** (Object|ArrayBuffer|Buffer|String) - XVIZ data of any format.

## Properties

- **type** - Returns the [XVIZMessageType](/docs/api-reference/io/xviz-message-type.md).

- **data** - Returns the internal data for the XVIZMessage.

## Methods

- **dataFormat()** - Returns the [XVIZFormat] of the original data. TODO: should just be format
  TODO: should be a property

- **message()** - Parses the data and returns an
  [XVIZMessage](/docs/api-reference/io/xviz-message.md).

- **hasMessage()** - Returns true if the original data has been parsed into a message.
