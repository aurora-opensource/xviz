# Download KITTI data

Download raw data from the [KITTI website](http://www.cvlibs.net/datasets/kitti/raw_data.php). For
each dataset you'll need to download the **synced+rectified** data and the **tracklets** files.
Extract to the `data/kitti` directory in this project. It will look like this:

```
/data/kitti
    |- 2011_09_26
        |- 2011_09_26_drive_0005_sync
            |- tracklet_labels.xml
            |- image_00
            |- image_01
            |- image_02
            |- image_03
            |- oxts
            |- velodyne_points
```

Once downloaded and unzipped, the data set is divided into directories for different data types and
each type has one file per KITTI frame.

We provide some conveniece scripts to help with this. Here is an example you can run from the
command-line from the repository root directory.

```
$ ./scripts/download-kitti-data 2011_09_26_drive_0005
```

In this example `2011_09_26_drive_0005` is the name of the data set which you can replace as
necessary.

# What data is available

The full details of the KITTI data set can be found at their
[website](http://www.cvlibs.net/datasets/kitti/raw_data.php).

The data provides the following that we will take advantage of in this conversion example:

- Vehicle location, orientation, and metrics
- Objects classified with bounds (tracklets)
- Camera imagery
- Lidar scans

# Data synchronization

XVIZ does not handle synchronizing data across the multiple data sources that come from a system. We
rely on data synchronization to be handled during the conversion step if necessary. For this reason
we are using the **sync+rectified** data from KITTI which aligns all the data by timestamp.
