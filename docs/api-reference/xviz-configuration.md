# XVIZ Configuration

##### setXVIZConfig(config)

Constants:

- `STREAM_BLACKLIST` (Array) - Names of the streams to block. Default empty.
- `TIME_WINDOW` (Number) - The maximum time difference allowed for a state update to be associated
  with a given timestamp. Increase this number to ensure that we cover a sufficient time window for
  any available data. Default `400`.
- `PLAYBACK_FRAME_RATE` (Number) - The number of frames to generate per second. Default `10`.

Parser hooks:

- `preProcessPrimitive` (Function) - Pre-process a primitive. This can be used to change the type of
  a primitive (e.g. from `point` to `text`) and/or modify their properties.

Parameters:

- `object` (Object)
  - `primitive` (Object) - The primitive object being processed.
  - `type` (String) - The type of the primitive.
  - `streamName` (String) - The stream name of the primitive.
  - `time` (Number) - The timestamp of the primitive.

##### getXVIZConfig(config)

Parameters:

- `config` (Object)

Returns: current XVIZ config (Object).
