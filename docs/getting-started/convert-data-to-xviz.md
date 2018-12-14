## Adding Prediction Data

// todo: Move to separate section

Many autonomous driving systems generate prediction and planning data in addition to perception
data. Visualization of this data is often critical to allow deeper analysis. Unfortunately, the
public KITTI data set does not come with prediction data, but for illustration purposes, we can
synthesize some of that data since we have access to future frames.

See the example for details on how this can be done.

And of course we want to declare the channels in the metdata:

```js
xvizMetaBuilder
  .stream('/vehicle_pose')
  .category('pose')

  .stream(this.VEHICLE_TRAJECTORY)
  .category('primitives')
  .type('polyline')

  // This styling information is applied to *all* objects for this stream.
  // It is possible to apply inline styling on individual objects.
  .streamStyle({
    stroke_color: '#57AD57AA',
    stroke_width: 1.4,
    stroke_width_min_pixels: 1
  });
```

## Pulling it all together

```js
const xvizBuilder = new XVIZBuilder({
  metadata: this.metadata,
  disabledStreams: this.disabledStreams
});

const promises = this.converters.map(converter => converter.convertFrame(frameNumber, xvizBuilder));

await Promise.all(promises);

return xvizBuilder.getFrame();
```

## Serving and Visualizing the Data

Now that you have generated the `.glb` files for the XVIZ frames, you can start an XVIZ server to
stream those frames over a WebSocket. Once the server is running you can run the streetscape.gl
client, and start playing back and interacting in 3D with the newly converted KITTI log data.

## Validating XVIZ

As a final note, it may be interesting to validate the generated XVIZ data, especially if you build
your XVIZ "manually" rather than through the XVIZ builder API. XVIZ provides JSON schemas that can
me used to automate extensive correctness checks. For more information visit
[xviz](http://uber.github.com/xviz).

## Converting your own Data

The comments in the
[KITTI Converter](http://github.com/uber/xviz/blob/master/examples/converters/kitti/src/converters/kitti-converter.js)

[XVIZ Documentation](http://github.com/uber/xviz) has information under the Developers Guide.
