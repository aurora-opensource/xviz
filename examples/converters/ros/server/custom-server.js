import {XVIZServerMain} from '@xviz/server';
import {setupCustomProvider} from '../common/setup-custom-provider';

class CustomServer extends XVIZServerMain {
  setupArguments() {
    const args = super.setupArguments();
    args.options('rosConfig', {
      describe: 'Path to ROS Bag configuration',
      type: 'string'
    });

    return args;
  }

  setupProviders() {
    // Add our custom Provider to the singleton factory
    setupCustomProvider(this.options);
  }
}

const main = new CustomServer();
main.execute();
