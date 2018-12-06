### KITTI XVIZ Conversion Example

This public KITTI data set is used to demonstrate how to convert data into the XVIZ format.

The structure of this examples places the core conversion objects in `src/converters` with
an object per data source. Data source will also have parsing utilities in `src/parsers`.

The *converter* objects are responsible for calling the parsers and knowing the structure of the data
such that it can be processed by a *frame*, which is all the data required for a point in time.

In this example, the data has been synchronized for us, but XVIZ does support data sources operating at
different rates.

Follow the comments to get an understanding of the how's and why's of converting data to XVIZ.

### KITTI Data Set

* [kitti dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php)**

* [python lib](https://github.com/utiasSTARS/pykitti)
* [Jupyter notebook](https://github.com/navoshta/KITTI-Dataset/blob/master/kitti-dataset.ipynb)


### Download Kitti Data

1. Go to **[kitti dataset](http://www.cvlibs.net/datasets/kitti/raw_data.php)**
2. Select any category and drive you are interested in
3. Download 3 archives: `[synced+rectified data] [calibration] [tracklets]`


## Transform Kitti to XVIZ format

E.g date=2011_09_26 drive=0005

Unzip these archives and put them in `../../../data/kitti` directory

```
yarn start -d 2011_09_26/2011_09_26_drive_0005_sync
```


## Available Streams in KITTI data sets

```
  /vehicle_pose
  /vehicle/velocity
  /vehicle/acceleration
  /vehicle/trajectory
  /lidar/points
  /tracklets/objects
  /tracklets/trajectory
```

### Structure of KITTI data

```
|--data
     |--2011_09_26     
            |--2011_09_26_drive_005_sync                    // synced original data
            |             |--oxts                           // GPS data  
            |             |    |--data               
            |             |    |   |--0000000000.txt        // per frame per file
            |             |    |   |--...
            |             |    |--timestamps.txt
            |             |--velodyne_points
            |             |         |--data
            |             |         |    |--0000000000.bin
            |             |         |    |--...
            |             |         |--timestamps.txt
            |             |--tracklet_labels.xml  
            |--generated                                    // generated data dir
                   |--0                                     // per frame per folder
                      |--0-frame.json                       // per frame per json file
                   |--1
                      |--1-frame.json
```
