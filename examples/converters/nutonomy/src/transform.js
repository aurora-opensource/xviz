/* eslint-disable camelcase */
import {XVIZWriter} from '@xviz/builder';

import {zeroPaddedPrefix} from './common';
import NuTonomyConverter from './converters/nutonomy-converter';
import StaticData from './converters/static-data';

module.exports = async function main(args) {
  const {inputDir, samplesDir, disabledStreams, fakeStreams, frameLimit, scenes, imageMaxWidth, imageMaxHeight} = args;

  const staticData = new StaticData(inputDir);
  for (const scene of scenes) {
    const sceneName = `scene-${zeroPaddedPrefix(scene, 4)}`;
    const outputDir = `${args.outputDir}/${sceneName}`;
    // This object orchestrates any data dependencies between the data sources
    // and delegates to the individual converters
    const converter = new NuTonomyConverter(inputDir, outputDir, samplesDir, staticData, {
      disabledStreams,
      sceneName,
      fakeStreams,
      imageMaxWidth,
      imageMaxHeight
    });

    console.log(`Converting NuScenes data scene ${sceneName} at ${inputDir}`); // eslint-disable-line
    console.log(`Saving to ${outputDir}`); // eslint-disable-line

    converter.initialize();

    // This abstracts the details of the filenames expected by our server
    const xvizWriter = new XVIZWriter();

    // Write metadata file
    const xvizMetadata = converter.getMetadata();
    xvizWriter.writeMetadata(outputDir, xvizMetadata);

    const start = Date.now();

    const limit = Math.min(frameLimit, converter.frameCount());
    for (let i = 0; i < limit; i++) {
      const xvizFrame = await converter.convertFrame(i);
      if (xvizFrame) {
        xvizWriter.writeFrame(outputDir, i, xvizFrame);
      }
    }

    xvizWriter.writeFrameIndex(outputDir);

    const end = Date.now();
    console.log(`Generate ${limit} frames in ${end - start}s`); // eslint-disable-line
  }
};
