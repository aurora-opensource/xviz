# Mapping Lidar scans

Lidar data is very rich and useful, but can be large. XVIZ supports binary encoding of points and
per-point color.

## XVIZ Mapping

The following code comes from the KITTI converter file
[lidar-converter.js](https://github.com/uber/xviz/tree/master/examples/converters/kitti/src/converters/lidar-converter.js)
and
[parse-lidar-points.js](https://github.com/uber/xviz/tree/master/examples/converters/kitti/src/parsers/parse-lidar-points.js).

### Lidar scans

First lets define the metadata.

```js
const xb = xvizMetaBuilder;
xb.stream(this.LIDAR_POINTS)
  .category('primitive')
  .type('point')
  .streamStyle({
    fill_color: '#00a',
    radius: 2
  })
  // laser scanner relative to GPS position
  // http://www.cvlibs.net/datasets/kitti/setup.php
  .pose({
    x: 0.81,
    y: -0.32,
    z: 1.73
  });
```

You can see we are setting standard attributes and taking into account the `pose()` offset required
for the lidar sensor.

To convert the data to XVIZ it is worth show how this data is parsed first.

```js
export function loadLidarData(data) {
  const binary = readBinaryData(data);
  const float = new Float32Array(binary);
  const size = Math.round(binary.length / 4);

  const positions = new Float32Array(3 * size);
  const colors = new Uint8Array(4 * size).fill(255);

  for (let i = 0; i < size; i++) {
    positions[i * 3 + 0] = float[i * 4 + 0];
    positions[i * 3 + 1] = float[i * 4 + 1];
    positions[i * 3 + 2] = float[i * 4 + 2];

    const reflectance = Math.min(float[i * 4 + 3], 3);
    colors[i * 4 + 0] = 80 + reflectance * 80;
    colors[i * 4 + 1] = 80 + reflectance * 80;
    colors[i * 4 + 2] = 80 + reflectance * 60;
  }
  return {positions, colors};
}
```

I will point out that we are creating a flat array `positions` with each point taking 3 values for
x, y, and z. The `colors` flat array expects 4 values per vertex for red, blue, green, and alpha.

Knowing that lidar data is just a set of flat arrays, the XVIZ code is now simple.

```js
xvizBuilder
  .primitive(this.LIDAR_POINTS)
  .points(lidarData.positions)
  .colors(lidarData.colors);
```
