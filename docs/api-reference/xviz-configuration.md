# XVIZ Configuration and Settings


## Functions

### setXVIZConfig(config)

Constants:

- `PRIMARY_POSE_STREAM` (String) - Name of the vehicle pose stream. Default `vehicle-pose`.
- `OBJECT_STREAM` (String) - Name of the object stream. Default `objects`.
- `STREAM_BLACKLIST` (Array) - Names of the streams to block. Default empty.

Parser plugins:

- `preProcessPrimitive` (Function) - Pre process a primitive. This can be used to change the type of a primitive (e.g. from `point` to `text`) and/or modify their properties.

### getXVIZConfig(config)

Returns the current XVIZ config.


### setXVIZSettings(config)

Sets the XVIZ settings. The default settings are:

- `hiTimeResolution` (Number) - Update pose and lightweight geometry up to 60Hz. Default `1 / 60`.
- `loTimeResolution` (Number) - Throttle expensive geometry updates. Default `1 / 10`
- `interpolateVehiclePose` (Boolean) - Injects interpolated vehicle pose datums. Default `false`.
- `pathDistanceThreshold` (Number) - Filters out close vertices (work around for PathLayer issue) Default `0.1`.


### getXVIZSettings(config)

Returns the current xviz settings.
