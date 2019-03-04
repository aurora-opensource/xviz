# XVIZ Server

## Overview

This simple XVIZ Server will read XVIZ index and data files produced from the
[XVIZBuilder](/docs/api-reference/xviz-builder.md) and server them over a web socket. The server
supports the basic [XVIZ Session](/docs/protocol-schema/session-protocol.md).

A more capable server is planned in our [Roadmap](/docs/overview/roadmap.md).

## Quick Start

Change to the server directory

```
$ cd ./examples/server
```

Install dependencies

```
$ yarn
```

Launch the server point it at your XVIZ data folder

```
$ node index.js -d <XVIZ data folder>
```
