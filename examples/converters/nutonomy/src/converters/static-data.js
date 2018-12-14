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

import {parseJsonFile, toMap} from '../common';

export default class StaticData {
  constructor(dataDir) {
    this._dataDir = dataDir;

    this._scenes = this._loadScenes();
    this._categories = this._loadCategories();
    // rely on this._categories
    this._instances = this._loadInstances();
    this._sensors = this._loadCalibratedSensors();
    this._samplesByToken = this._loadAllSamples();
    this._sampleDataByToken = this._loadAllSampleData();
  }

  get scenes() {
    return this._scenes;
  }
  get categories() {
    return this._categories;
  }
  get instances() {
    return this._instances;
  }
  get sensors() {
    return this._sensors;
  }
  get samplesByToken() {
    return this._samplesByToken;
  }
  get sampleDataByToken() {
    return this._sampleDataByToken;
  }

  _loadScenes() {
    const scenes = parseJsonFile(this._dataDir, 'scene.json');
    return toMap(scenes, 'name');
  }

  _loadCategories() {
    const categories = parseJsonFile(this._dataDir, 'category.json');
    return toMap(categories, 'token', category => {
      category.streamName = `/${category.name.replace(/\./g, '/')}`;
      return category;
    });
  }

  _loadInstances() {
    const instances = parseJsonFile(this._dataDir, 'instance.json');
    return toMap(instances, 'token', instance => {
      const category = this._categories[instance.category_token];
      instance.category = category.streamName;
      return instance;
    });
  }

  _loadSensors() {
    const sensors = parseJsonFile(this._dataDir, 'sensor.json');
    return toMap(sensors, 'token');
  }

  _loadCalibratedSensors() {
    const sensors = this._loadSensors();
    let calibratedSensors = parseJsonFile(this._dataDir, 'calibrated_sensor.json');
    calibratedSensors = toMap(calibratedSensors, 'token');
    Object.values(calibratedSensors).forEach(calibratedSensor => {
      const sensorToken = calibratedSensor.sensor_token;
      // add sensor metadata
      calibratedSensor.modality = sensors[sensorToken].modality;
      calibratedSensor.channel = sensors[sensorToken].channel;
    });

    return calibratedSensors;
  }

  // basic data, data with scene_token
  _loadAllSamples() {
    const allSamples = parseJsonFile(this._dataDir, 'sample.json');
    return toMap(allSamples, 'token');
  }

  // detail data, e.g. ego_pose_token, calibrated_sensor_token
  _loadAllSampleData() {
    const sampleData = parseJsonFile(this._dataDir, 'sample_data.json');
    return toMap(sampleData, 'token');
  }
}
