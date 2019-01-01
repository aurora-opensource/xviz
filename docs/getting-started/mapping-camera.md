# Mapping Camera Images

KITTI has 4 camera image sources. The conversion code converts each image into a separate stream.

> Due to transmission size considerations, it is typically important to down scale images as much as
> possible. Many cameras today capture at HD resolutions and downsizing to e.g. 720x480 leads to a
> 4x size reduction, even without reducing quality.

## XVIZ Mapping

The following code comes from the KITTI converter file
[image-converter.js](https://github.com/uber/xviz/tree/master/examples/converters/kitti/src/converters/tracklets-converter.js).

### Camera data

For image data we can simply add the raw image data to XVIZ.

First lets define the metadata.

```js
const xb = xvizMetaBuilder;
xb.stream(this.streamName)
  .category('primitive')
  .type('image');
```

Next lets add the actual image data

```js
xvizBuilder
  .primitive(this.streamName)
  .image(nodeBufferToTypedArray(data), 'png')
  .dimensions(width, height);
```

This is rather straight forward as we are simply embedding the binary image data into the XVIZ data
and passing it through. We are providing additional data with the type and dimensions of the image.
