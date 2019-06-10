import {XVIZServerMain} from '@xviz/server';
import {setupCustomProvider} from '../common/setup-custom-provider';

class CustomServer extends XVIZServerMain {
  setupProviders() {
    // Add our custom Provider to the singleton factory
    setupCustomProvider(this.options);
  }
}

const main = new CustomServer();
main.execute();
