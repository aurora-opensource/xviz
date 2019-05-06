# XVIZServer

This is a server to handle XVIZ hosting from multiple data sources.

The server operates by defining a middleware stack, and options will control how that stack is
structured and how requests and data are processed through that stack.

The flow does try to preserve a no touch data flow, but does allow conversions and eventually
filtering of data.

This is stil a work in progress

# XVIZServer(session, opts)

# XVIZSession(factory)

onConnection create SessionHandler if supported

# XVIZSessionHandler(socket, request, source, opts)

construct middleware stack for request/opts

# XVIZServerMiddlewareStack

Server middleware models the client side middleware to support a stack of handlers that will receive
the `(request, msg)`.

_request_ is the object of the original request from the client. _msg_ will be the current response
if is is set.

- \*data is an XVIZData object

## Connection events

### onClose

### onConnect

## XVIZ message types

### onStart

### onTransformLog

### onError

### onMetadata

### onStateUpdate

### onTransformLogDone

### onReconfigure

# XVIZ Data Format and encoding

XVIZ can be formatted a number of ways: - json string arraybuffer - glb arraybuffer

## args

- port
- d, multiple

- live server data w/o 'start' remove metadate start/end time do not send done

- scenario

- loop serverresponse hook frame index calculation middleware change frame times

- delay serverResponse

- limit serverResponse

- filterStream mw
- filterType mw

- validate validate request validate response

- format json, json_arraybuffer, binary mw

XVIZSourceFactory list([path]): [ [available sources] ] // for all internal impls collect based on
path // scenario would list everything it supports open([path], log_id): [ XVIZSource|null ] kitti
2011/2032_005 nutonom 203 rosbag cart_bot scenario scenario_circle
