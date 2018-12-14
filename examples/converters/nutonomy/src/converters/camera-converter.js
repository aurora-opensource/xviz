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

  async convertFrame(frameIndex, xvizBuilder) {
    const promises = this.imageConverters.map(imageConverter =>
      imageConverter.convertFrame(frameIndex, xvizBuilder)
    );

    await Promise.all(promises);
  }

  getMetadata(xvizMetaBuilder) {
    this.imageConverters.forEach(imageConverter => imageConverter.getMetadata(xvizMetaBuilder));
  }
}
