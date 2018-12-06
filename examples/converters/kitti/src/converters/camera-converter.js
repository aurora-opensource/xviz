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
