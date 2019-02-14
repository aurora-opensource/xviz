# Viewing the generated XVIZ

This article describes details to visualize the KITTI data set. You will need to:

- Download the KITTI data
- Convert it to XVIZ format
- Start a streaming server
- Build and start the streetscape.gl UI application.

These steps are handled for you if you have used the **Quick Start** steps. Here we will go into
additonal detail and cover some available options.

# Convert KITTI to XVIZ Format

```
$ cd examples/converters/kitti
$ yarn  # install dependencies
$ yarn start -d 2011_09_26/2011_09_26_drive_0005_sync
```

To see a full list of options of the converter, run `yarn start --help`.

- `-d, --data-directory` Path to raw KITTI data. Relative path will resolved relative to
  /data/kitti/
- `-o, --output` Path to generated data. Relative path will resolved relative to
  /data/generated/kitti/
- `--disable-streams` Comma separated stream names to disable
- `--frame-limit` Limit XVIZ frame generation to this value. Useful testing conversion quickly
- `--image-max-width` max width allowed with aspect ratio preserved. Default is 400.
- `--image-max-height` max height allowed with aspect ratio preserved Default is 300.

## Image resizing

The converter script also provides image resizing options `--image-max-width` and
`--image-max-height`.

If both `image-max-width` and `image-max-height` are provided, will resize the image as large as
possible with ratio preserved.

## Disable cameras

The converter script option `disable-streams` allows user to select certain cameras to display, by
default all the four cameras `image_00`, `image_01`, `image_02`, `image_03` will be converted to
xviz format.

example

```
$ yarn start -d 2011_09_26/2011_09_26_drive_0005_sync --image-max-width=300 --disable-streams=image_01,image_02
```

# Start Demo Application

Start a XVIZ stream server:

```
$ cd examples/server
$ yarn  # install dependencies
$ yarn start -d kitti/2011_09_26/2011_09_26_drive_0005_sync
```

To see a full list of options of the stream server, run `yarn start --help`.

Add an application config file

```
$ cd examples/clients/config
```

- An example is xviz-config-kitti.js, for complete xviz configs, check
  [xviz-config](https://github.com/uber/xviz/blob/master/docs/api-reference/xviz-configuration.md)
- Config file naming convention: xviz-config-\${appName}.js

In another terminal, run the client app:

```
$ cd examples/clients/xviz-viewer
$ yarn  # install dependencies
$ appName=kitti yarn start-local
```

- `appName` is used for loading the correct configuration file for the client app (default is
  `kitti`).
