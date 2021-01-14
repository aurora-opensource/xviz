// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {getXVIZConfig} from '../config/xviz-config';
import XVIZObject from '../objects/xviz-object';
import {findInsertPos, INSERT_POSITION} from '../utils/search';
import log from '../utils/log';

import {getTransformsFromPose} from '../parsers/parse-vehicle-pose';

// lookAheads is an array of arrays, so we need to fetch out the first
// timestamp of the inner array.
function lookAheadTimesliceAccessor(timeslice) {
  if (timeslice && timeslice.length) {
    return timeslice[0].timestamp;
  }

  log.warn('Missing entry or timestamp in lookAhead array')();
  return 0;
}

function updateObjects(streamName, features) {
  for (const feature of features) {
    const xvizObject = XVIZObject.get(feature.id);
    if (xvizObject) {
      xvizObject._addFeature(streamName, feature);
    }
  }
}

function addObjectAttributesFromTimeSeries(streamName, entries) {
  // Get last part of name or use full name
  const mark = streamName.lastIndexOf('/');
  let attribute = streamName;
  if (mark !== -1) {
    attribute = `${streamName.substring(mark + 1)}`;
  }

  for (const entry of entries) {
    const xvizObject = XVIZObject.get(entry.id);
    if (xvizObject) {
      xvizObject._setAttribute(streamName, attribute, entry.variable);
    }
  }
}

// LOGSLICE CLASS

// One time slice, one datum from each stream.
export default class LogSlice {
  constructor(
    streamFilter,
    lookAheadMs,
    linksByReverseTime,
    posesByReverseTime,
    streamsByReverseTime
  ) {
    this.features = {};
    this.variables = {};
    this.pointCloud = null;
    this.lookAheads = {};
    this.components = {};
    this.links = {};
    this.poses = {};
    this.streams = {};

    this.initialize(
      streamFilter,
      lookAheadMs,
      linksByReverseTime,
      posesByReverseTime,
      streamsByReverseTime
    );
  }

  // Extract car data from vehicle_pose and get geoJson for related frames
  /* eslint-disable max-statements */
  getCurrentFrame(params, postProcessFrame) {
    const {vehiclePose} = params;
    if (!vehiclePose) {
      return null;
    }

    const {OBJECT_STREAM} = getXVIZConfig();

    const frame = {
      ...params,
      ...getTransformsFromPose(vehiclePose),
      vehiclePose,
      // from primitives
      features: this.features,
      lookAheads: this.lookAheads,
      pointCloud: this.pointCloud,
      components: this.components,
      // from variables
      variables: this.variables,
      // from this.initialize
      streams: this.streams,
      links: this.links,
      poses: this.poses
    };

    // OBJECTS
    XVIZObject.resetAll();
    if (postProcessFrame) {
      postProcessFrame(frame);
    }

    // OBJECT_STREAM is deprecated, only keeping for backward compatibility
    if (OBJECT_STREAM) {
      updateObjects(OBJECT_STREAM, this.features[OBJECT_STREAM] || []);
    } else {
      for (const streamName in this.features) {
        const features = this.features[streamName];
        if (features.length && features[0].id) {
          updateObjects(streamName, features);
        }
      }

      for (const streamName in this.variables) {
        const variables = this.variables[streamName];
        if (variables.length && variables[0].id) {
          updateObjects(streamName, variables);
        }
      }

      this.updateObjectsFromTimeSeries();
    }

    frame.objects = XVIZObject.getAllInCurrentFrame(); // Map of XVIZ ids in current slice

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
  initialize(
    streamFilter,
    lookAheadMs,
    linksByReverseTime,
    posesByReverseTime,
    streamsByReverseTime
  ) {
    const filter = streamFilter && Object.keys(streamFilter).length > 0 ? streamFilter : null;

    // get data if we don't already have that stream && it is not filtered.
    streamsByReverseTime.forEach(streams => {
      for (const streamName in streams) {
        if (
          this.streams[streamName] !== null && // Explicit no data entry
          !this.streams[streamName] && // undefined means it has not been seen so keep looking for valid entry
          this._includeStream(filter, streamName)
        ) {
          this.addStreamDatum(streams[streamName], streamName, lookAheadMs, this);
        }
      }
    });

    // get data if we don't already have that stream && it is not filtered.
    linksByReverseTime.forEach(links => {
      for (const streamName in links) {
        if (
          this.links[streamName] !== null && // Explicit no data entry
          !this.links[streamName] && // undefined means it has not been seen so keep looking for valid entry
          this._includeStream(filter, streamName)
        ) {
          this.links[streamName] = links[streamName];
        }
      }
    });

    // get data if we don't already have that stream && it is not filtered.
    posesByReverseTime.forEach(poses => {
      for (const streamName in poses) {
        if (
          this.poses[streamName] !== null && // Explicit no data entry
          !this.poses[streamName] && // undefined means it has not been seen so keep looking for valid entry
          this._includeStream(filter, streamName)
        ) {
          this.poses[streamName] = poses[streamName];
        }
      }
    });
  }

  /**
   * Process a stream and put the appropriate data into
   */
  addStreamDatum(datum, streamName, lookAheadMs) {
    this.streams[streamName] = datum;

    // Handle the no data case
    if (!datum) {
      return;
    }

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
      this.pointCloud = pointCloud;
    }

    if (variable !== undefined) {
      this.variables[streamName] = variable;
    }
  }

  updateObjectsFromTimeSeries() {
    const handledStreams = new Set([...Object.keys(this.features), ...Object.keys(this.variables)]);
    const remainingStreams = new Set(
      Object.keys(this.streams).filter(stream => !handledStreams.has(stream))
    );
    for (const streamName of remainingStreams) {
      const stream = this.streams[streamName];
      // Handle timeSeries entries
      if (Array.isArray(stream)) {
        addObjectAttributesFromTimeSeries(streamName, stream);
      }
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
        object._setProp(label.labelName, label.value);
      }
    });
  }

  // Helper function to get a stream from data
  // @param {Object} data - log data
  // @param {String} stream - name of stream
  // @param {*} defaultValue={} - return value in case stream is not present
  // @return {Object} - contents of stream or defaultValue
  getStream(stream, defaultValue = {}) {
    const streamData = this.streams[stream] || this.poses[stream];
    if (!streamData) {
      return defaultValue;
    }
    return streamData;
  }

  _includeStream(streamFilter, streamName) {
    return !streamFilter || streamFilter[streamName];
  }
}
