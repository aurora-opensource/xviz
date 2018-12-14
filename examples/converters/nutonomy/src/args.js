const {ArgumentParser} = require('argparse');

const parser = new ArgumentParser({
  addHelp: true,
  description: 'NuTonomy to XVIZ converter'
});

parser.addArgument(['-d', '--data-directory'], {
  required: true,
  help: 'Path to raw nutonomy data (metadata and annotations).'
});

parser.addArgument(['-o', '--output'], {
  required: true,
  help: 'Path to generated data.'
});

parser.addArgument(['--samples-directory'], {
  required: true,
  help: 'Path to nutonomy samples data (Lidar, Radar).'
});

parser.addArgument(['--scenes'], {
  required: true,
  help: 'List of scene number'
});

parser.addArgument(['--disable-streams'], {
  defaultValue: '',
  help: 'Comma separated stream names to disable'
});

parser.addArgument(['--frame-limit'], {
  defaultValue: Number.MAX_SAFE_INTEGER,
  help: 'Limit XVIZ frame generation to this value. Useful for testing conversion quickly'
});

parser.addArgument(['--image-max-width'], {
  defaultValue: 400,
  help: 'Image max width'
});

parser.addArgument(['--image-max-height'], {
  defaultValue: 250,
  help: 'Image max height'
});

parser.addArgument('--fake-streams', {
  action: 'storeTrue',
  help: 'Generate fake streams with random data for testing'
});

parser.addArgument('--list-scenes', {
  defaultValue: false,
  help: 'List available scenes (use with -d or --data-directory).'
});

// extract args from user input
module.exports = function getArgs() {
  const args = parser.parseArgs();
  const inputDir = args.data_directory;
  const samplesDir = args.samples_directory;
  const outputDir = args.output || args.data_directory;
  const scenes = args.scenes
    .split(',')
    .filter(Boolean)
    .map(n => Number(n));
  console.log(inputDir, outputDir); // eslint-disable-line
  const disabledStreams = args.disable_streams.split(',').filter(Boolean);

  return {
    inputDir,
    outputDir,
    samplesDir,
    disabledStreams,
    fakeStreams: Boolean(args.fake_streams),
    imageMaxWidth: Number(args.image_max_width),
    imageMaxHeight: Number(args.image_max_height),
    frameLimit: Number(args.frame_limit),
    listScenes: args.list_scenes,
    scenes
  };
};
