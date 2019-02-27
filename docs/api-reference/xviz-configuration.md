# XVIZ Configuration

##### setXVIZConfig(config)

Constants:

- `STREAM_BLACKLIST` (Array) - Names of the streams to block. Default empty.
- `TIME_WINDOW` (Number) - The maximum time difference allowed for a state update to be associated
  with a given timestamp. Increase this number to ensure that we cover a sufficient time window for
  any available data. Default `400`.
- `PLAYBACK_FRAME_RATE` (Number) - The number of frames to generate per second. Default `10`.
- `ALLOW_MISSING_PRIMARY_POSE` (Boolean) - Whether to render logs where there is no `/vehicle_pose`
  stream. If `true`, `VEHICLE_RELATIVE` coordinates are treated as `IDENTITY`. Using this may break
  certain functionalities in the `LogViewer` and `PlaybackControl`. Default `false`.

Parser hooks:

- `preProcessPrimitive` (Function) - Pre process a primitive. This can be used to change the type of
  a primitive (e.g. from `point` to `text`) and/or modify their properties.

##### getXVIZConfig(config)

Parameters:

- `config` (Object)

Returns: current XVIZ config (Object).
