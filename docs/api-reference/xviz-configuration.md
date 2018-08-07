# Xviz Configuration and Settings


## Functions

### setXvizConfig(config)

Default Configuration.

* `getLabelNameFromStream`: channelName => channelName, // Relabel channels
* `filterPrimitive`: _ => true // Filter out primitives before post processing


### getXvizConfig(config)

Returns the current Xviz config.


### setXvizSettings(config)

Sets the XVIZ settings. The default settings are:

* `hiTimeResolution`: 1 / 60, // Update pose and lightweight geometry up to 60Hz
* `loTimeResolution`: 1 / 10, // Throttle expensive geometry updates to 10Hz
* `interpolateVehiclePose`: false, // Injects interpolated vehicle pose datums @100Hz
* `pathDistanceThreshold`: 0.1 // Filters out close vertices (work around for PathLayer issue)


### getXvizSettings(config)

Returns the current xviz settings.
