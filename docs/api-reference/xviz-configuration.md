# Xviz Configuration and Settings


## Functions

### setXvizConfig(config)

Constants:

- `DEFAULT_METADATA` (Object) - Loaded metadata will be merged with this object. Default `{}`.
- `PRIMARY_POSE_STREAM` (String) - Name of the vehicle pose stream. Default `vehicle-pose`.
- `OBJECT_STREAM` (String) - Name of the object stream. Default `objects`.
- `NON_RENDERING_STREAMS` (Array) - List of stream names to block from rendering. Default `[]`.

Parser plugins:

- `filterStream` (Function) - Use to filter out unwanted streams.
- `preProcessPrimitive` (Function) - Pre process a primitive. This can be used to change the type of a primitive (e.g. from `point` to `text`) and/or modify their properties.
- `postProcessMetadata` (Function) - Post process a metadata message.
- `postProcessTimeslice` (Function) - Post process a timeslice message.
- `postProcessVehiclePose` (Function) - Post process the vehicle pose object.
- `postProcessFrame` (Function) - Called before the current log frame is rendered.
- `getTrackedObjectPosition` (Function) - Returns the tracking position of a selected object. The returned position should be in the same coordinate system as the object stream, in `[x, y, z]`. By default, returns the centroid of the primitive in the object stream.
- `observeObjects` (Function) - called when new objects arrive in the object stream. Can be used to track all objects in the log.


### getXvizConfig(config)

Returns the current Xviz config.


### setXvizSettings(config)

Sets the XVIZ settings. The default settings are:

- `hiTimeResolution` (Number) - Update pose and lightweight geometry up to 60Hz. Default `1 / 60`.
- `loTimeResolution` (Number) - Throttle expensive geometry updates. Default `1 / 10`
- `interpolateVehiclePose` (Boolean) - Injects interpolated vehicle pose datums. Default `false`.
- `pathDistanceThreshold` (Number) - Filters out close vertices (work around for PathLayer issue) Default `0.1`.


### getXvizSettings(config)

Returns the current xviz settings.
