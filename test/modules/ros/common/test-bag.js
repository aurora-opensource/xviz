/* eslint-disable camelcase */
import {ROSBag} from '@xviz/ros';
import {MockRosbag} from './mock-rosbag';

/*
  /tf
  /tf_static

  for frameIdToPoseMap
*/

/* Test class that is a ROSBag but
 * replaces the rosbag.js bag instance
 * with a MockBag instance.
 */
export class TestBag extends ROSBag {
  constructor(path, rosConfig, options) {
    super(path, rosConfig, options);

    this.mockBag = new MockRosbag(options.bagData);
  }

  async _openBag() {
    return this.mockBag;
  }
}
