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

import {getXvizConfig} from '../config/xviz-config';
import XvizObject from '../objects/xviz-object';

import {getTransformsFromPose} from '../parsers/parse-vehicle-pose';

// LOGSLICE CLASS

// One time slice, one datum from each stream.
export default class LogSlice {
  constructor(streamFilter, lookAheadIndex, ...streamsByReverseTime) {
    this.features = {};
    this.variables = {};
    this.pointCloud = null;
    this.lookAheads = {};
    this.components = {};
    this.streams = {};

    this.initialize(streamFilter, lookAheadIndex, ...streamsByReverseTime);
  }

  // Extract car data from vehicle_pose and get geoJson for related frames
  /* eslint-disable max-statements */
  getCurrentFrame({vehiclePose, trackedObjectPosition, ...others}) {
    if (!vehiclePose) {
      return null;
    }

    const {postProcessFrame, OBJECT_STREAM} = getXvizConfig();

    const objects = XvizObject.getAllInCurrentFrame(); // Map of XVIZ ids in current slice

    const frame = {
      ...others,
      ...getTransformsFromPose(vehiclePose),
      vehiclePose,
      trackedObjectPosition,
      features: this.features,
      lookAheads: this.lookAheads,
      variables: this.variables,
      pointCloud: this.pointCloud,
      components: this.components,
      objects, // Map of XVIZ object ids in current slice
      streams: this.streams
    };

    // OBJECTS
    XvizObject.resetAll();
    postProcessFrame(frame);

    const objectFeatures = this.features[OBJECT_STREAM] || [];

    objectFeatures.forEach(feature => {
      const xvizObject = XvizObject.get(feature.id);
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
  initialize(streamFilter, lookAheadIndex, ...streamsByReverseTime) {
    // get data if we don't already have that stream && it is not filtered.
    // TODO: make streamFilter a list of filtered streams
    // so it can default to [], and then only exclude if filter.includes(x)
    streamsByReverseTime.forEach(streams => {
      for (const streamName in streams) {
        if (!this.streams[streamName] && this._includeStream(streamFilter, streamName)) {
          this.addStreamDatum(streams[streamName], streamName, lookAheadIndex, this);
        }
      }
    });
  }

  /**
   * Process a stream and put the appropriate data into
   */
  addStreamDatum(datum, streamName, lookAheadIndex) {
    const {NON_RENDERING_STREAMS} = getXvizConfig();

    this.streams[streamName] = datum;

    this.setLabelsOnXvizObjects(datum.labels);

    const isRenderable = !NON_RENDERING_STREAMS.includes(streamName);
    if (isRenderable) {
      const {features = [], lookAheads = [], variable, pointCloud = null, components = []} = datum;

      // Future data is separate from features so we can control independently
      if (lookAheads.length) {
        this.lookAheads[streamName] = lookAheads[lookAheadIndex] || [];
      }

      // Combine data from current datums
      if (features.length) {
        this.features[streamName] = features;
      }

      if (components.length) {
        this.components[streamName] = components;
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
  }

  setLabelsOnXvizObjects(labels = []) {
    // Sort labels by id
    labels.forEach(label => {
      const object = XvizObject.get(label.id);
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
