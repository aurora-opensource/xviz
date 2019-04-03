// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import Promise from 'bluebird';
// import {GeometryPoseStamped, NavPath, LidarConverter} from '../messages';

import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';

export class FrameBuilder {
  constructor({origin, frameIdToPoseMap, disableStreams}) {
    this.disableStreams = disableStreams;
    /*
    this.converters = [
      new GeometryPoseStamped('/current_pose', origin),
      new NavPath('/planner/path'),
      new LidarConverter('/commander/points_fore', '/lidar/points')

      new TrackletsConverter('/tracklets/objects'),
      new PerceptionMarkersConverter('/perception/markers'),
      new TrajectoryCircleConverter('/trajectory-circle/markers'),
      new RouteConverter('/map/route'),
      new MotionPlanningConverter('/motion-planning')
    ];

    this.xvizMetadataBuilder = this._initMetadataBuilder(frameIdToPoseMap);
    this.metadata = this.xvizMetadataBuilder.getMetadata();
    */
  }

  /*
  getXVIZMetadataBuilder() {
    return this.xvizMetadataBuilder;
  }
  */

  async buildFrame(frame) {
    const xvizBuilder = new XVIZBuilder(this.metadata, this.disableStreams, {});
    await Promise.map(this.converters, c => c.convertFrame(frame, xvizBuilder), {
      concurrency: 1 // xvizBuilder cannot build multiple streams "concurrently"
    });

    const frm = xvizBuilder.getFrame();
    return frm;
  }

  _initMetadataBuilder(frameIdToPoseMap) {
    const xvizMetadataBuilder = new XVIZMetadataBuilder();
    this.converters.forEach(c => c.getMetadata(xvizMetadataBuilder, frameIdToPoseMap));

    return xvizMetadataBuilder;
  }
}
