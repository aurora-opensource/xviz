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

import ImageConverter from './image-converter';

// either get all possible cameras looking at all sensor_msg/compressed_image or
// config file specifying all camera topics
// this is also the name of the xviz stream
const CAMERA_SOURCES = ['/iris/image_color/compressed'];

export default class CameraConverter {
  constructor(dbPath, {disabledStreams = [], options = {}}) {
    this.dbPath = dbPath;
    this.cameraSources = CAMERA_SOURCES.filter(camera => !disabledStreams.includes(camera));
    this.imageConverters = [];
    this.options = options;
  }

  load() {
    this.cameraSources.forEach(cameraSource => {
      this.imageConverters.push(new ImageConverter(this.dbPath, cameraSource, this.options));
    });

    this.imageConverters.forEach(imageConverter => imageConverter.load());
  }

  async convertFrame(frameNumber, xvizBuilder) {

    const promises = this.imageConverters.map(imageConverter =>
      imageConverter.convertFrame(frameNumber, xvizBuilder)
    );

    await Promise.all(promises);
  }

  getMetadata(xvizMetaBuilder) {
    this.imageConverters.forEach(imageConverter => imageConverter.getMetadata(xvizMetaBuilder));
  }
}
