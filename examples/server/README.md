# XVIZ Streaming Server (Demo)

This is a minimal server that opens a WebSocket and starts serving XVIZ formatted data from a
directory

## Start xviz stream server

To show all options launch `index.js` with `--help`:

```
node index.js --help
```

To serve XVIZ data execute `index.js` and specify the data directory with `-d`:

```
node index.js -d ../../../xviz-data/kitti/2011_09_26_drive_0005_sync
```
