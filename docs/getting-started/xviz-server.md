# XVIZ Server

## Overview

This simple XVIZ Server will read XVIZ index and data files produced from the
[XVIZBuilder](/docs/api-reference/xviz-builder.md) and server them over a web socket. The server
supports the basic [XVIZ Session](/docs/protocol-schema/session-protocol.md).

## Quick Start

Run our bootstrap to install dependencies and build the modules if you have not already

```
$ yarn bootstrap
```

Change to the @xviz/server module directory

```
$ cd ./modules/server
```

Launch the server point it at your XVIZ data folder

```
$ ./bin/xvizserver -d <XVIZ data folder> --port 8081
```
