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

const CAMERA_SOURCES = [
  'CAM_FRONT',
  'CAM_FRONT_LEFT',
  'CAM_FRONT_RIGHT',
  'CAM_BACK',
  'CAM_BACK_LEFT',
  'CAM_BACK_RIGHT'
];

export default class CameraConverter {
  constructor(rootDir, {disabledStreams = [], imageMaxWidth, imageMaxHeight}) {
    this.rootDir = rootDir;
    disabledStreams = disabledStreams.map(stream => stream.toUpperCase());

    this.imageConverters = [];
    this.options = {
      disabledStreams,
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight
    };
    this.cameraSources = disabledStreams
      ? CAMERA_SOURCES.filter(source => disabledStreams.indexOf(source) === -1)
      : CAMERA_SOURCES;
  }

  load({frames}) {
    this.cameraSources.forEach(cameraSource => {
      this.imageConverters.push(new ImageConverter(this.rootDir, cameraSource, this.options));
    });

    this.imageConverters.forEach(imageConverter => imageConverter.load({frames}));
  }

  async convertMessage(messageIndex, xvizBuilder) {
    const promises = this.imageConverters.map(imageConverter =>
      imageConverter.convertMessage(messageIndex, xvizBuilder)
    );

    await Promise.all(promises);
  }

  getMetadata(xvizMetaBuilder) {
    this.imageConverters.forEach(imageConverter => imageConverter.getMetadata(xvizMetaBuilder));
  }
}
