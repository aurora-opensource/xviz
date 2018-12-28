import {getXVIZConfig} from '../config/xviz-config';
import XVIZObject from '../objects/xviz-object';
import {findInsertPos, INSERT_POSITION} from '../utils/search';

import {getTransformsFromPose} from '../parsers/parse-vehicle-pose';

// lookAheads is an array of arrays, so we need to fetch out the first
// timestamp of the inner array.
function lookAheadTimesliceAccessor(timeslice) {
  if (timeslice && timeslice.length) {
    return timeslice[0].timestamp;
  }

  throw new Error('Missing entry or timestamp in lookAhead array');
}

// LOGSLICE CLASS

// One time slice, one datum from each stream.
export default class LogSlice {
  constructor(streamFilter, lookAheadMs, streamsByReverseTime) {
    this.features = {};
    this.variables = {};
    this.pointCloud = null;
    this.lookAheads = {};
    this.components = {};
    this.streams = {};

    this.initialize(streamFilter, lookAheadMs, streamsByReverseTime);
  }

  // Extract car data from vehicle_pose and get geoJson for related frames
  /* eslint-disable max-statements */
  getCurrentFrame(params, postProcessFrame) {
    const {vehiclePose} = params;
    if (!vehiclePose) {
      return null;
    }

    const {OBJECT_STREAM} = getXVIZConfig();

    const objects = XVIZObject.getAllInCurrentFrame(); // Map of XVIZ ids in current slice

    const frame = {
      ...params,
      ...getTransformsFromPose(vehiclePose),
      vehiclePose,
      features: this.features,
      lookAheads: this.lookAheads,
      variables: this.variables,
      pointCloud: this.pointCloud,
      components: this.components,
      objects, // Map of XVIZ object ids in current slice
      streams: this.streams
    };

    // OBJECTS
    XVIZObject.resetAll();
    if (postProcessFrame) {
      postProcessFrame(frame);
    }

    const objectFeatures = this.features[OBJECT_STREAM] || [];

    objectFeatures.forEach(feature => {
      const xvizObject = XVIZObject.get(feature.id);
      if (xvizObject) {
        xvizObject._setLabel(feature.label);
        // Populate feature with information from other streams
        Object.assign(feature, xvizObject.getProps());
      }
    });

    return frame;
  }
  /* eslint-enable max-statements */

  // HELPER METHODS

  /**
   * In-contrast to the per-stream post-processors,
   * this function has the ability to look at and correlate data from multiple streams.
   * Among other things parses XVIZ Object-related info from misc streams and merge into XVIZ
   * feature properties.
   */
  initialize(streamFilter, lookAheadMs, streamsByReverseTime) {
    const filter = streamFilter && Object.keys(streamFilter).length > 0 ? streamFilter : null;

    // get data if we don't already have that stream && it is not filtered.
    streamsByReverseTime.forEach(streams => {
      for (const streamName in streams) {
        if (!this.streams[streamName] && this._includeStream(filter, streamName)) {
          this.addStreamDatum(streams[streamName], streamName, lookAheadMs, this);
        }
      }
    });
  }

  /**
   * Process a stream and put the appropriate data into
   */
  addStreamDatum(datum, streamName, lookAheadMs) {
    this.streams[streamName] = datum;

    this.setLabelsOnXVIZObjects(datum.labels);

    const {features = [], lookAheads = [], variable, pointCloud = null} = datum;

    // Future data is separate from features so we can control independently
    if (lookAheads.length && lookAheadMs > 0) {
      const lookAheadTime = datum.time + lookAheadMs;
      const lookAheadIndex = findInsertPos(
        lookAheads,
        lookAheadTime,
        INSERT_POSITION.RIGHT,
        lookAheadTimesliceAccessor
      );

      if (lookAheadIndex) {
        this.lookAheads[streamName] = lookAheads[lookAheadIndex - 1];
      }
    }

    // Combine data from current datums
    if (features.length) {
      this.features[streamName] = features;
    }

    // Point cloud
    if (pointCloud) {
      if (this.pointCloud) {
        console.warn(`Point cloud for ${streamName} overwriting previous cloud`); // eslint-disable-line
      }
      this.pointCloud = pointCloud;
    }

    if (variable !== undefined) {
      this.variables[streamName] = variable;
    }
  }

  setLabelsOnXVIZObjects(labels = []) {
    // Sort labels by id
    labels.forEach(label => {
      const object = XVIZObject.get(label.id);
      if (object && label.labelName) {
        // Extract label name (acceleration, velocity etc.) from stream name

        // For streams that do not follow the simple pattern in STREAM_REGEXP
        // Lookup for exact matches for labels first.
        object.setProp(label.labelName, label.value);
      }
    });
  }

  // Helper function to get a stream from data
  // @param {Object} data - log data
  // @param {String} stream - name of stream
  // @param {*} defaultValue={} - return value in case stream is not present
  // @return {Object} - contents of stream or defaultValue
  getStream(stream, defaultValue = {}) {
    const streamData = this.streams[stream];
    if (!streamData) {
      return defaultValue;
    }
    return streamData;
  }

  _includeStream(streamFilter, streamName) {
    return !streamFilter || streamFilter[streamName];
  }
}
