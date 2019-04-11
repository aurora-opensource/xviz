# Writers

## writeMetadata
## writeFrame
## writeFrameIndex

# XVIZJSONWriter
# XVIZBinaryWriter

# Readers

## readMetadata
## readFrame
## readFrameIndex

# XVIZJSONReader
# XVIZBinaryReader

# TODO: structure source & sink together
# IO Sink

## FileSink
## MemorySink

# IO Source
## FileSource

# XVIZ Data objects

## XVIZData
Raw data which can be efficiently parsed to determine
the XVIZ dataFormat().

### buffer()
### dataFormat()
### hasMessage()
### message()

## XVIZMessage

### type
### data

# XVIZ Utility

## encodeBinaryXVIZ
## XVIZFormatter

# Utilities

## TextEncoder
## TextDecoder
