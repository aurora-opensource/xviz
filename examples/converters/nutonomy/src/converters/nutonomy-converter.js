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

/* eslint-disable camelcase */
import assert from 'assert';
import {createDir, toMap} from '../common';

import GPSConverter from './gps-converter';
import ObjectsConverter from './objects-converter';
import LidarConverter from './lidar-converter';
import CameraConverter from './camera-converter';
import FutureObjectsConverter from './future-objects-converter';

import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';
import RandomDataGenerator from './random-data-generator';
import {getDeclarativeUI} from './declarative-ui';

const TIME_WINDOW = 50000; // nano seconds

export default class NuTonomyConverter {
  constructor(
    inputDir,
    outputDir,
    samplesDir,
    staticData,
    {disabledStreams, fakeStreams, sceneName, imageMaxWidth, imageMaxHeight, keyframes}
  ) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.samplesDir = samplesDir;
    this.disabledStreams = disabledStreams;
    this.sceneName = sceneName;
    this.fakeStreams = fakeStreams;
    this.imageMaxWidth = imageMaxWidth;
    this.imageMaxHeight = imageMaxHeight;
    this.keyframes = keyframes;

    this.staticData = staticData;
    this.metadata = null;
  }

  load() {
    // each loader depend on the previous loaders
    this._loadFrames();
    this._loadFramesData();
    this._loadSensorCalibrations();
  }

  initialize() {
    this.load();

    createDir(this.outputDir);

    // These are the converters for the various data sources.
    // Notice that some data sources are passed to others when a data dependency
    // requires coordination with another data source.
    const gpsConverter = new GPSConverter(this.inputDir, 'ego_pose.json');
    const objectConverter = new ObjectsConverter(this.inputDir, 'sample_annotation.json');
    const lidarConverter = new LidarConverter(this.samplesDir, 'LIDAR_TOP');
    const cameraConverter = new CameraConverter(this.samplesDir, {
      disabledStreams: this.disabledStreams,
      imageMaxWidth: this.imageMaxWidth,
      imageMaxHeight: this.imageMaxHeight
    });
    const futureObjectsConverter = new FutureObjectsConverter(
      this.inputDir,
      'sample_annotation.json'
    );

    // Note: order is important due to data deps on the pose
    this.converters = [
      gpsConverter,
      objectConverter,
      lidarConverter,
      cameraConverter,
      futureObjectsConverter
    ];

    if (this.fakeStreams) {
      this.converters.push(new RandomDataGenerator());
    }

    gpsConverter.load({
      staticData: this.staticData,
      frames: this.frames
    });

    this.converters.filter(converter => converter !== gpsConverter).forEach(converter =>
      converter.load({
        staticData: this.staticData,
        frames: this.frames,
        posesByFrame: gpsConverter.getPoses()
      })
    );

    this.metadata = this.getMetadata();
  }

  async convertMessage(messageIndex) {
    const xvizBuilder = new XVIZBuilder({
      metadata: this.metadata,
      disabledStreams: this.disabledStreams
    });

    // As builder instance is shared across all the converters, to avoid race conditions,
    // Need wait for each converter to finish
    for (let i = 0; i < this.converters.length; i++) {
      await this.converters[i].convertMessage(messageIndex, xvizBuilder);
    }

    return xvizBuilder.getMessage();
  }

  getMessages() {
    return this.frames;
  }

  messageCount() {
    return this.frames.length;
  }

  getMetadata() {
    // The XVIZMetadataBuilder provides a fluent API to collect
    // metadata about the XVIZ streams produced during conversion.
    //
    // This include type, category, and styling information.
    //
    // Keeping this general data centralized makes it easy to find and change.
    const xb = new XVIZMetadataBuilder();

    this.converters.forEach(converter =>
      converter.getMetadata(xb, {
        staticData: this.staticData,
        sensorCalibrations: this.sensorCalibrations
      })
    );

    const timestamps = this.timestamps;
    xb.startTime(timestamps[0]).endTime(timestamps[timestamps.length - 1]);
    xb.ui(getDeclarativeUI({fakeStreams: this.fakeStreams}));

    xb.logInfo({
      description: 'Conversion of nuScenes dataset into XVIZ',
      license: 'CC BY-NC-SA 4.0',
      'license link':
        '<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode">https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode</a>',
      uri: '<a href="https://github.com/uber/xviz-data">https://github.com/uber/xviz-data</a>',
      source: {
        title: 'nuScenes dataset',
        link: '<a href="https://www.nuscenes.org/">https://www.nuscenes.org/</a>',
        copyright:
          'Copyright © 2018 nuScene <a href="https://www.nuscenes.org/terms-of-use">https://www.nuscenes.org/terms-of-use</a>'
      }
    });

    return xb.getMetadata();
  }

  _loadFrames() {
    const {scenes, sampleDataByToken} = this.staticData;
    const {first_sample_token: firstSampleToken, last_sample_token: lastSampleToken} = scenes[
      this.sceneName
    ];

    this.frames = [];

    // sample of first frame
    let sample = Object.values(sampleDataByToken).find(
      data => data.sample_token === firstSampleToken && data.filename.indexOf('LIDAR_TOP') !== -1
    );

    // retrieve samples until next token is empty
    while (sample) {
      // if only convert keyframes
      // keyframe is 5-10 times less frequent than frame sample
      if (this.keyframes) {
        while (sample && !sample.is_key_frame) {
          sample = sampleDataByToken[sample.next];
        }
      }

      if (sample) {
        this.frames.push(sample);
        if (!sample.next) {
          // last frame
          assert(sample.sample_token === lastSampleToken);
        }

        sample = sampleDataByToken[sample.next];
      }
    }

    this.timestamps = this.frames.map(frame => frame.timestamp / 1e6);
  }

  // lidar frame is synchronized with ego pose
  // use lidar frame's timestamp as the frame reference timestamp
  _getFrameSensors(frameIndex, sensorsMetadata) {
    const lidar = sensorsMetadata.LIDAR_TOP[frameIndex];
    const timestamp = lidar.timestamp;
    const sensors = {
      LIDAR_TOP: lidar
    };

    const otherSensors = Object.keys(sensorsMetadata).filter(channel => channel !== 'LIDAR_TOP');
    otherSensors.forEach(channel => {
      const samples = sensorsMetadata[channel];
      let i = 0;
      // look for the sample of other sensors with timestamp >= lidar timestamp of current frame
      while (i < samples.length && samples[i].timestamp < timestamp - TIME_WINDOW) {
        i++;
      }
      if (samples[i]) {
        sensors[channel] = samples[i];
      }
    });

    return sensors;
  }

  _loadCalibratedSensors(firstFrameData) {
    /**
     * sensorsMetadata
     * {
     *   LIDAR_TOP: {calibrated_sensor_token, filename, ego_pose_token, modality, channel}
     *   ...
     * }
     */
    const sensorsMetadata = {};
    const {sensors, sampleDataByToken} = this.staticData;

    // 1 lidar, 6 cameras, 6 radars (radar data is not used)
    const lidarSample = firstFrameData.find(data => data.filename.indexOf('LIDAR') !== -1);
    const cameraSamples = firstFrameData.filter(data => data.filename.indexOf('CAM') !== -1);

    [lidarSample, ...cameraSamples].forEach(sample => {
      while (sample) {
        // if only convert keyframes
        // keyframe is 5-10 less frequent than frame sample
        if (this.keyframes) {
          while (sample && !sample.is_key_frame) {
            sample = sampleDataByToken[sample.next];
          }
        }

        if (sample) {
          const sensor = sensors[sample.calibrated_sensor_token];
          if (!sensorsMetadata[sensor.channel]) {
            sensorsMetadata[sensor.channel] = [];
          }
          sensorsMetadata[sensor.channel].push({
            timestamp: sample.timestamp,
            calibrated_sensor_token: sample.calibrated_sensor_token,
            filename: sample.filename,
            ego_pose_token: sample.ego_pose_token,
            sensor_token: sensor.sensor_token,
            modality: sensor.modality,
            channel: sensor.channel
          });

          sample = sampleDataByToken[sample.next];
        }
      }
    });

    return sensorsMetadata;
  }

  _loadSensorCalibrations() {
    const firstFrameSensors = this.frames[0].sensors;
    const sensorCalibrations = Object.keys(firstFrameSensors).map(channel => {
      const sensorToken = firstFrameSensors[channel].calibrated_sensor_token;
      return this.staticData.sensors[sensorToken];
    });
    this.sensorCalibrations = toMap(sensorCalibrations, 'channel');
  }

  _loadFramesData() {
    // find first LIDAR keyframe
    const {sampleDataByToken} = this.staticData;
    const firstFrameData = Object.values(sampleDataByToken).filter(
      data => data.sample_token === this.frames[0].sample_token
    );

    const sensorsMetadata = this._loadCalibratedSensors(firstFrameData);

    this.frames.forEach((frame, i) => {
      // attach sensors for each frame
      frame.sensors = this._getFrameSensors(i, sensorsMetadata);
      // use lidar data's ego_pose because
      // A sample is data collected at (approximately) the same timestamp as part of a single LIDAR sweep.
      // https://github.com/nutonomy/nuscenes-devkit/blob/master/schema.md#sample
      frame.ego_pose_token = frame.sensors.LIDAR_TOP.ego_pose_token;
    });
  }
}
