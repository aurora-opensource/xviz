# @xviz/server Overview

A server to handle hosting XVIZ data from multiple data sources.

The server operates by defining a middleware stack and options will control how that stack is
structured and how requests and data are processed through the stack.

The server tries to preserve a no-touch data flow, but does allow conversions and mutation 
of data.

## Examples

For a list of all options type `./bin/babel-xvizserver --help`.

### KITTI data

This example shows how to server the KITTI data once converted.

```
$ cd modules/server
$ ./bin/babel-xvizserver -d ../../data/generated/kitti/2011_09_26/2011_09_26_drive_0005_sync
```

### Test Scenarios

The default server supports test XVIZ scenarios that can be accessed at the following URL's:

 - /scenario-circle
 - /scenario-straight

[Try this example](http://localhost:8080/scenario-circle?radius=30&duration=60) with a local server running.

The scenarios support a few query parameters you can play with:

#### common options

 - hz - number of frames per second
 - duration - length of the scenario generated in seconds

#### scenario-circle

 - hz - number of frames per second
 - duration - length of the scenario generated in seconds
 - radius - size of the circle the vehicle traverse
