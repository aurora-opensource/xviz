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

const CAMERA_SOURCES = ['image_00', 'image_01', 'image_02', 'image_03'];

export default class CameraConverter {
  constructor(rootDir, {disabledStreams = [], options = {}}) {
    this.rootDir = rootDir;
    this.cameraSources = CAMERA_SOURCES.filter(camera => !disabledStreams.includes(camera));
    this.imageConverters = [];
    this.options = options;
  }

  load() {
    this.cameraSources.forEach(cameraSource => {
      this.imageConverters.push(new ImageConverter(this.rootDir, cameraSource, this.options));
    });

    this.imageConverters.forEach(imageConverter => imageConverter.load());
  }

  async convertMessage(messageNumber, xvizBuilder) {
    const promises = this.imageConverters.map(imageConverter =>
      imageConverter.convertMessage(messageNumber, xvizBuilder)
    );

    await Promise.all(promises);
  }

  getMetadata(xvizMetaBuilder) {
    this.imageConverters.forEach(imageConverter => imageConverter.getMetadata(xvizMetaBuilder));
  }
}
