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
- `--message-limit` Limit XVIZ message generation to this value. Useful testing conversion quickly
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

# Start Stream Server

Run the [example XVIZ server](/docs/getting-started/xviz-server.md) to serve your converted data:

```
$ cd examples/server
$ yarn  # install dependencies
$ yarn start -d kitti/2011_09_26/2011_09_26_drive_0005_sync
```

To see a full list of options of the stream server, run `yarn start --help`.

# Start Client Application

See
[streetscape.gl starter kit](https://github.com/uber/streetscape.gl/blob/master/docs/get-started/starter-kit.md).
