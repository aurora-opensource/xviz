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

import path from 'path';
import {XVIZBuilder, XVIZMetadataBuilder} from '@xviz/builder';

import {getTimestamps, createDir, nanosecondsToXVIZDateTime} from '../parsers/common';
import GPSConverter from './gps-converter';
import IMUConverter from './imu-converter';

import CameraConverter from './camera-converter';
import RandomDataGenerator from './random-data-generator';
import {getDeclarativeUI} from './declarative-ui';

import yaml from 'js-yaml';
import fs from 'fs';

export class Rosbag2Converter {
  constructor(inputDir, outputDir, {disabledStreams, fakeStreams, imageMaxWidth, imageMaxHeight}) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.disabledStreams = disabledStreams;
    this.fakeStreams = fakeStreams;
    this.imageOptions = {
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight
    };

    this.numFrames = 0;
    this.metadata = null;
  }

  initialize() {
    const metaDataPath = path.resolve(this.inputDir, 'metadata.yaml');

    const rosbagMetaData = this.loadRosbagMetaData(metaDataPath);

    this.startTime = nanosecondsToXVIZDateTime(
      rosbagMetaData.starting_time.nanoseconds_since_epoch
    );
    this.endTime = nanosecondsToXVIZDateTime(
      rosbagMetaData.starting_time.nanoseconds_since_epoch + rosbagMetaData.duration.nanoseconds
    );

    //this.timestamps = getTimestamps(timestampsFilePath);

    createDir(this.outputDir);

    this.numFrames =
      rosbagMetaData['message_count'] / rosbagMetaData['topics_with_message_count'].length;

    // These are the converters for the various data sources.
    // Notice that some data sources are passed to others when a data dependency
    // requires coordination with another data source.
    const files = fs.readdirSync(this.inputDir);
    let dbPath = '';
    for (const f in files) {
      if (files[f].endsWith('.db3')) {
        dbPath = files[f];
      }
    }

    dbPath = path.join(this.inputDir, dbPath);

    //const imuConverter = new IMUConverter(dbPath);
    const gps_topic = '/iris/fix';
    // Note: order is important due to data deps on the pose
    this.converters = [
      //imuConverter,
      new GPSConverter(dbPath, gps_topic),
      new CameraConverter(dbPath, {
        disabledStreams: this.disabledStreams,
        options: this.imageOptions
      })
    ];

    if (this.fakeStreams) {
      this.converters.push(new RandomDataGenerator());
    }

    this.converters.forEach(converter => converter.load());

    this.metadata = this.getMetadata();
  }

  frameCount() {
    return this.numFrames;
  }

  async convertFrame(frameNumber) {
    // The XVIZBuilder provides a fluent API to construct objects.
    // This makes it easier to incrementally build objects that may have
    // many different options or variant data types supported.
    const xvizBuilder = new XVIZBuilder({
      metadata: this.metadata,
      disabledStreams: this.disabledStreams
    });

    // As builder instance is shared across all the converters, to avoid race conditions',
    // Need wait for each converter to finish
    for (let i = 0; i < this.converters.length; i++) {
      await this.converters[i].convertFrame(frameNumber, xvizBuilder);
    }

    return xvizBuilder.getFrame();
  }

  loadRosbagMetaData(metaDataPath) {
    // maybe extract and put in helper function
    try {
      let doc = yaml.safeLoad(fs.readFileSync(metaDataPath, 'utf8'));
      return doc['rosbag2_bagfile_information'];
    } catch (e) {
      console.log(e);
    }
    return none;
  }

  getMetadata() {
    // The XVIZMetadataBuilder provides a fluent API to collect
    // metadata about the XVIZ streams produced during conversion.
    //
    // This include type, category, and styling information.
    //
    // Keeping this general data centralized makes it easy to find and change.
    const xb = new XVIZMetadataBuilder();

    xb.startTime(this.startTime).endTime(this.endTime);

    this.converters.forEach(converter => converter.getMetadata(xb));
    xb.ui(getDeclarativeUI({fakeStreams: this.fakeStreams}));

    xb.logInfo({
      description: 'Conversion of Rosbag2 data set into XVIZ',
      license: 'CC BY-NC-SA 3.0',
      'license link':
        '<a href="http://creativecommons.org/licenses/by-nc-sa/3.0/">http://creativecommons.org/licenses/by-nc-sa/3.0/</a>',
      uri: '<a href="https://github.com/uber/xviz-data">https://github.com/uber/xviz-data</a>',
      source: {
        title: 'Rosbag2',
        author: 'Andreas Klintberg',
        link: '<a href=""></a>',
        copyright:
          'All datasets and benchmarks on <a href="">this page</a> are copyright by us and published under the MIT License. This means that you must attribute the work in the manner specified by the authors.'
      }
    });

    return xb.getMetadata();
  }
}
