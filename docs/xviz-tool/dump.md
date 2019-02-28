# `dump` - see XVIZ data

## Overview

With this you can see what data an XVIZ server is providing and debug connectivity issues.

```
xviz dump DATAARGS [-m] [-s]

Display the content to disk.

-m, --metadata    Request just metadata
-c, --condensed   Display short summary information.
```

## Dump to stdout

Connect and do `transform_log` on a full log, streams content to stdout in pretty printed form:

```
$ xviz dump ws://localhost:8081 630e522f-d2b1-403c-a9a3-468b398cbf60
{
  “type”: “xviz/metadata,
  “data”: {
    “version”: “2.0.0”
   }
}
{
  “type: “xviz/state_update
  “data”: {
  ...
```

## Get metadata

Get and display just the metadata

```
$ xviz dump --metadata ws://localhost:8081 630e522f-d2b1-403c-a9a3-468b398cbf60
{
  “version”: “2.0.0”,
  ...
```

## Condensed view

This view shows minimal summary information about a working server.

```
$ xviz dump --condensed ws://localhost:8081 630e522f-d2b1-403c-a9a3-468b398cbf60
[METADATA] version 2.0.0 time: 123456 - 123660 streams: 320
[STATE_UPDATE] time: 123456.0 - 123456.1 updates: 2 streams: 4 items: 84
...
```
