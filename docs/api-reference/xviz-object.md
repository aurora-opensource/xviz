# XVIZObject

The `XVIZObject` class tracks the status of each XVIZ object in a log.

```js
import {XVIZObject} from 'viz';
```

## Static Methods

##### get(id)

Parameters:

- id (Number): XVIZ object id

Returns: an `XVIZObject` instance for the given `id`.

##### getAll()

Returns: all XVIZ objects in the current log. Keys are ids and values are `XVIZObject` instances.

##### getAllInCurrentFrame()

Returns: all XVIZ objects in the current frame. Keys are ids and values are `XVIZObject` instances.

## Properties

##### id (String)

The XVIZ object id.

##### state (Object)

The app state of the object, such as `tracked` and `selected`.

##### startTime (Number)

Timestamp from when this object was first observed.

##### endTime (Number)

Timestamp from when this object was last observed.

##### position (Array)

The coordinates of the tracking point of the object. `null` if the object does not exist in the
current frame.

##### streamNames (Iterable)

A list of stream names where this object showed up. Empty if the object does not exist in the
current frame.

##### isValid (Bool)

`true` if the object is in the current frame.

## Methods

##### getProp(name)

Returns the value of the specified property in the current frame.

##### getFeature(streamName)

Returns the object's feature from the specified streamName in the current frame.
