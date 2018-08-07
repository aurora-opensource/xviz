# XvizObject

The `XvizObject` class tracks the status of each Xviz object in a log.

```js
import {XvizObject} from 'viz';
```


## Static Methods

##### `get(id)`

Returns an `XvizObject` instance for the given `id`.

##### `getAll()`

Returns all Xviz objects in the current log. Keys are ids and values are `XvizObject` instances.

##### `getAllInCurrentFrame()`

Returns all Xviz objects in the current frame. Keys are ids and values are `XvizObject` instances.


## Properties

##### `id` (string)

The Xviz object id.

##### `state` (object)

The app state of the object, such as `tracked` and `selected`.

##### `props` (Map)

The properties of the object from the XVIZ log, such as `label` and `soc`. `props` is empty if the object does not exist in the current frame.

##### `position` (array)

The coordinates of the tracking point of the object. `undefined` if the object does not exist in the current frame.

##### `isValid` (bool)

`true` if the object is in the current frame.


## Methods

Apps should not directly call any methods on the XvizObject objects.
