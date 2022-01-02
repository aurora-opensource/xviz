# xvizserver Tool

The `xvizserver` tool serves XVIZ data over a websocket. It supports multiple directories and
various sources for XVIZ data. It also will support the full XVIZ protocol.

## Running the tool

If you have build the modules, then you can run the tool directly.
`./modules/ros/bin/xvizserver -d xvizFolder`

It can be useful to run the tool against the modules directly instead of the built modules.
`./modules/ros/bin/babel-xvizserver -d xvizFolder`

To see the details on the available commands and options run `./modules/ros/bin/babel-xvizserver -h`

## Viewing applications

Either the
[Getting Started App](https://github.com/uber/streetscape.gl/tree/master/examples/get-started) or
[Test Viewer](https://github.com/uber/streetscape.gl/tree/master/test/apps/viewer).

Note that the _Getting Started App_ defaults to port: 8081 while the default for this tool is 3000.

## Host Options

- `--directory, -d <path>` - Adds a path to be search for any URL paths passed to the server
  (required)
- `--port #` - The port on which the server will listen (default: 3000)

## General Options

- `--verbose, -v` - Display additional information. Repeat for additional information, ex: -vv
- `--format <format>` - One of the following strings JSON_STRING, JSON_BUFFER, BINARY_GLB (default:
  BINARY_GLB)
- `--live` - Support a live session which sends data immediately upon connection
- `--delay #` - The number of milliseconds to delay between sending messages (default: 50)

## Scenarios

There are built-in XVIZ scenarios the server supports, mainly for testing.

#### URL Paths

- `/scenario-circle`
- `/scenario-straight`
- `/scenario-orbit`
- `/scenario-transforms`
- `/scenario-arm`

Example

```
http://localhost:8081/scenario-circle
```

### Options

- `--scenarios <true/false>` - Enable or disables Scenario support (default: true)
- `--duration #` - The number of seconds to generate data for the XVIZ scenario (default: 30)
- `--hz #` - The rate to send scenario updates (default: 10)
