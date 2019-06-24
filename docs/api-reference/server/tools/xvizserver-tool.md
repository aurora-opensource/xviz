# xvizserver Tool

The `xvizserver` tool serves XVIZ data over a websocket. It supports multiple directories and
various sources for XVIZ data. It also will support the full XVIZ protocol.

## Running the tool

If you have build the modules, then you can run the tool directly.
`./modules/ros/bin/xvizserver -d xvizFolder`

It can be useful to run the tool against the modules directly instead of the built modules.
`./modules/ros/bin/babel-xvizserver -d xvizFolder`

To see the details on the available commands and options run `./modules/ros/bin/babel-xvizserver -h`

## Viewing application

The server is best Streetscape.gl
[Test Viewer](https://github.com/uber/streetscape.gl/tree/master/test/apps/viewer)

## Options

- `--directory, -d <path>` - Adds a path to be search for any URL paths passed to the server
- `--port #` - The port on which the server will listen
- `--verbose, -v` - Display additional information. Repeat for additional information, ex: -vv
- `--format <format>` - One of the following strings JSON_STRING, JSON_BUFFER, BINARY_GLB
- `--live` - Support a live session which sends data immediately upon connection
- `--delay #` - The number of milliseconds to delay between sending messages

## Scenarios

There are built-in XVIZ scenarios the server supports, mainly for testing.

#### URL Paths

- `/scenario-circle`
- `/scenario-straight`

Example

```
http://localhost:8080/scenario-circle
```

### Options

`--duration #` - The number of seconds to generate data for the XVIZ scenario `--hz #` - The rate to
send scenario updates
