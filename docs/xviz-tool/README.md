# XVIZ Tool

The `xviz` tool is the primary program in an XVIZ client or server developers toolkit. The goal for
this tool is to be to a combination curl, wget, a simple HTTP server, and a specification validator
all in one.

Here is an example of dumping data from a local server over websocket to grab data from log
`9f54b978-1186-4082-a2e6-e8f1e70abdd7`, showing the terse output.

```
$ xviz dump --condensed ws://localhost:8088 9f54b978-1186-4082-a2e6-e8f1e70abdd7
[CONNECTED]
[< START]
[> METADATA] version: 2.0.0
[< TRANSFORM_LOG] LOG-START - LOG-END (tid: f8b38a41-59fa-44b9-9311-cd612886bb37)
[> STATE_UPDATE] time: 1317042272.349
...
[> STATE_UPDATE] time: 1317042288.15
[> TRANSFORM_LOG_DONE] tid: f8b38a41-59fa-44b9-9311-cd612886bb37
[CONNECTION CLOSED]
```

## XVIZ Data Location

All commands start with an xviz data location that specifies the source of the XVIZ data to process
and options to bound it.

```
<host|path> [<log>] [-s <time>] [-e <time>]

host   URL to connect, supports only websocket
path   file system path
log    id or name of log, if not passed “live” mode is assumed

-s, --start     Get data after this starting point, inclusive.
-e, --end       Get data up to this point, inclusive.
```

## Subcommands

The currently available sub-commands:

- **[dump](/docs/xviz-tool/dump.md)** - Output XVIZ content to stdout
- **[validate](/docs/xviz-tool/validate.md)** - Ennsure data and server conform to the specification

## Future subcommands

The `xviz` tool is a work in progress, the following commands are planned:

- **log** - Save XVIZ content to disk
- **analyze** - Print out statistics about sizes, rates and counts
- **serve** - Server over websocket the given log or directory of logs
- **render** - Create an image or video from XVIZ data
- **bench** - Measure performance of an XVIZ server
