### nuTonomy XVIZ Conversion Example

This nuTonomy data set is used to demonstrate how to convert data into the XVIZ format.

The structure of this examples places the core conversion objects in `src/converters`.

The _converter_ objects are responsible for calling the parsers and knowing the structure of the
data such that it can be processed by a _frame_, which is all the data required for a point in time.

In this example, the data has been synchronized for us, but XVIZ does support data sources operating
at different rates.

Follow the comments to get an understanding of the how's converting data to XVIZ.

### nuTonomy Data Set

- [nuTonomy dataset](https://www.nuscenes.org/download)
- [python lib](https://github.com/nutonomy/nuscenes-devkit/tree/master/python-sdk)
- [Jupyter notebook](https://github.com/nutonomy/nuscenes-devkit/blob/master/python-sdk/tutorial.ipynb)

### Download nuTonomy Data

1. Go to **[nuTonomy dataset](https://www.nuscenes.org/download)**
2. Download `Meta data and annotations`, `LIDAR and RADAR pointclouds used as keyframes`,
   `Camera images used as keyframes`
3. Extract three archives and put them under directory `data` of root.

## Transform nuTonomy to XVIZ format

e.g load `scene-0006`

```bash
yarn start
   -d <path-to-data-source>/nutonomy/nuscenes_teaser_meta_v1/v0.1   # metadata and annotation directory
   --samples-directory=<path-to-data-source>/nutonomy/samples       # lidar, radar, camera data directory
   -o <path-to-output>
   --scenes=6   # could pass more than 1 --scenes=1,2,3
```

Other options may be useful:

```bash
   --keyframes # only convert keyframes

   --image-max-width
   --image-max-height # reduce image size

   --disable-streams=CAM_FRONT_LEFT,CAM_FRONT_RIGHT # disable streams
```

To get a full list of acceptable parameters, run `yarn start --help`

### Structure of nuTonomy data

Detailed [schema](https://github.com/nutonomy/nuscenes-devkit/blob/master/schema.md)

```
|--data
    |--nutonomy
    |    |--nuscenes_teaser_meta_v1
    |    |    |--v0.1
    |    |    |    |--ego_pose.json              // vehicle pose
    |    |    |    |--sample_data.json
    |    |    |    |--sample_annotation.json
    |    |    |    |--...
    |    |    |--maps                            // maps png files
    |    |
    |    |--samples                              // camera data, lidar and radar data


|--output                                        // generated data dir
    |--nutonomy
        |--nuscenes_teaser_meta_v1
            |--v0.1
                |--0-frame.json                  // timing index file
                |--1-frame.glb                   // per frame per json file
```
