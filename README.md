# XVIZ

XVIZ is a protocol for real-time transfer and visualization of autonomy data.

[XVIZ Specification](http://avs.auto/#/xviz)

## Tools and examples

This repo contains the following submodules:

- `@xviz/builder` - Node.js utilities for converting data to the XVIZ protocol.
- `@xviz/parser` - Client-side decoder and synchronizer for consuming XVIZ data.
- `@xviz/schema` - Validator for the XVIZ protocol.
- `xviztool` - CLI utilities for the XVIZ protocol.

And examples:

- Sample converters that convert open datasets such as [KITTI](http://www.cvlibs.net/datasets/kitti/raw_data.php) and [Nutonomy](https://nuscenes.org) to the XVIZ protocol.
- A minimal Node.js-based XVIZ stream server.

## Quick start

You need [Node.js](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/lang/en/docs/install) to run the examples.

```bash
# Clone XVIZ
$ git clone https://github.com/uber/xviz.git
$ cd xviz

# Install dependencies
$ yarn bootstrap
```

Convert and serve KITTI data:

```bash
# Download KITTI data
$ ./scripts/download-kitti-data.sh

# Convert KITTI data if necessary and run the XVIZ Server and Client
$ ./scripts/run-kitti-example.sh
```
