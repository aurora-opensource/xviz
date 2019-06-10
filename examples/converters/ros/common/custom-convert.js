import {
  ROSBAGProvider,
  ROSXVIZConverter,
  ROS2XVIZFactory
} from '@xviz/ros';

import {setupCustomProvider} from './setup-custom-provider';

export async function CustomConvert(args) {
  // const {bag: bagPath, dir: outputDir, start, end, rosConfig} = args;
  setupCustomProvider(args);

  const cmd = new ROSXVIZConverter();
  await cmd.execute(args);
}
