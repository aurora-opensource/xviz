# XVIZ Configuration and Settings

## Functions

### setXVIZConfig(config)

Constants:

- `PRIMARY_POSE_STREAM` (String) - Name of the vehicle pose stream. Default `vehicle-pose`.
- `OBJECT_STREAM` (String) - Name of the object stream. Default `objects`.
- `STREAM_BLACKLIST` (Array) - Names of the streams to block. Default empty.
- `TIMESTAMP_FORMAT` (String) - `milliseconds` or `seconds`. Default `milliseconds`.

Parser plugins:

- `preProcessPrimitive` (Function) - Pre process a primitive. This can be used to change the type of
  a primitive (e.g. from `point` to `text`) and/or modify their properties.

### getXVIZConfig(config)

Returns the current XVIZ config.

### setXVIZSettings(config)

Sets the XVIZ settings. The default settings are:

- `TIME_WINDOW` (Number) - The maximum time difference allowed for a state update to be associated
  with a given timestamp. Increase this number to ensure that we cover a sufficient time window for
  any available data. Default `400`.
- `PLAYBACK_FRAME_RATE` (Number) - The number of frames to generate per second. Default `10`.

### getXVIZSettings(config)

Returns the current xviz settings.
