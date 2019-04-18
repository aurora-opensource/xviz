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
/* global Buffer, console */
/* eslint-disable no-console, camelcase */
import {open, TimeUtil} from 'rosbag';
import {quaternionToEuler} from '../common/quaternion';
import {topicMapper} from '../messages';

import {XVIZMetadataBuilder, XVIZBuilder} from '@xviz/builder';

export const CURRENT_POSE = '/current_pose';
export const PLANNER_PATH = '/planner/path';
export const CONFIGURATION = '/commander/configuration';
export const FOREGROUND_POINTS = '/commander/points_fore';
export const BACKGROUND_POINTS = '/commander/points_back';
export const TRACKS_LIST = '/commander/perception_dct/track_list';
export const TRACKS_MARKERS = '/commander/perception_dct/marker_array';
export const TRAJECTORY_CIRCLE_MARKER = '/closest_waypoint_marker';
export const ROUTE = '/commander/route_viz/route';
export const MP_PLAN = '/commander/dm/motion_planning/plan_viz';
export const CENTER_FRONT = '/vehicle/camera/center_front'; // example
export const FORWARD_CENTER = '/vehicle/camera/forward_center/image_raw/compressed'; // dc golf
export const MA1 = '/commander/dm/behavior_planning/behavior_state_viz';
export const MA3 = '/commander/route_viz/astar_closed';
export const MA4 = '/commander/route_viz/route';
export const MA5 = '/debug/gps_cov_marker';
export const MA6 = '/commander/map_annotations/markers';
export const MA7 = '/commander/next_target_mark visualization_msgs/Marker';
export const MA8 = '/commander/trajectory_circle_mark visualization_msgs/Marker';
export const MA9 = '/behavior_planning visualization_msgs/MarkerArray';

export const ALL = [
  CURRENT_POSE,
  PLANNER_PATH,
  CONFIGURATION,
  FOREGROUND_POINTS,
  BACKGROUND_POINTS,
  TRACKS_LIST,
  TRACKS_MARKERS,
  TRAJECTORY_CIRCLE_MARKER,
  ROUTE,
  MP_PLAN,
  CENTER_FRONT,
  FORWARD_CENTER,
  MA1,
  MA3,
  MA4,
  MA5,
  MA6,
  MA7,
  MA8,
  MA9
];

/* subclass Bag?
 *
 * keyTopic, topic filter
 *
 * init underlying data source
 * manage "configuration"
 *
 * reconfigure
 * critical topics and building frames
 * - frame by topic
 * - frame by time
 *
 * // tool to create this automagically
 *
 * -- rosbag xviz mapping
 * keyTopic: '',
 * // identity, unless frame_id
 * // confused by frame_id & child_frame_id
 * topicToXVIZ: /topic: {
 *  stream: '/foo',
 *  frame:
 *    frame_id: velodyne
 *    xviz_coordinate: VEHICLE_RELATIVE
 *
 *  streamStyle:
 *  styleClasses:
 *    name
 *    style
 *
 *  marker
 *    polyline
 *    polygon
 *    circle
 *    text
 *
 * @xviz topic to converter
 *
 */
export class Bag {
  // TODO i changed from objecdt to 3 separate parameters
  constructor(bagPath, keyTopic, topics) {
    this.bagPath = bagPath;
    this.keyTopic = keyTopic;
    this.topics = topics || ALL;
  }

  async open() {
    if (!this.bag) {
      this.bag = await open(this.bagPath);
    }

    return this.bag;
  }

  async init() {
    await this.open();

    this.metadata = await this.calculateMetadata();

    const topicType = {};
    for (const conn in this.bag.connections) {
      const {topic, type} = this.bag.connections[conn];
      if (this.topics.includes(topic)) {
        if (topicType[topic] && topicType[topic].type !== type) {
          throw new Error(
            `Unexpected change in topic type ${topic} has ${
              topicType[topic].type
            } with new type ${type}`
          );
        } else {
          topicType[topic] = {type};
        }
      }
    }

    this.topicType = topicType;

    const {origin, frameIdToPoseMap} = this.metadata.data;
    // console.log('~!~ frameIdToPoseMap', JSON.stringify(frameIdToPoseMap, null, 2));
    topicMapper(this.topicType, {keyTopic: this.keyTopic}, origin);

    const xvizMetadataBuilder = new XVIZMetadataBuilder();
    for (const topicName in this.topicType) {
      if (this.topicType[topicName].converter) {
        this.topicType[topicName].converter.getMetadata(xvizMetadataBuilder, frameIdToPoseMap);
      }
    }
    this.metadata2 = xvizMetadataBuilder.getMetadata();
    // console.log(JSON.stringify(this.metadata2, null, 2));

    const {start_time, end_time} = this.metadata.data;
    this.metadata2.start_time = start_time;
    this.metadata2.end_time = end_time;
    this.metadata2.log_info = {
      start_time,
      end_time
    };

    this.metadata2.ui_config = {
      Camera: {
        type: 'panel',
        children: [
          {
            type: 'video',
            cameras: [FORWARD_CENTER, CENTER_FRONT]
          }
        ],
        name: 'Camera'
      }
    };

    return {
      type: 'xviz/metadata',
      data: this.metadata2
    };
  }

  /**
   * Calculate all metadata needed by converters. Currently lumped into a single function
   * call to ensure we only need to make a single bag read.
   *
   * Extracts:
   *   origin: map origin
   *   frameIdToPoseMap: ROS /tf transform tree
   */
  async calculateMetadata() {
    const TF = '/tf';

    let origin = {latitude: 0, longitude: 0, altitude: 0};
    const frameIdToPoseMap = {};

    const start = Date.now();
    await this.open();

    const start_time = TimeUtil.toDate(this.bag.startTime).getTime() / 1e3;
    const end_time = TimeUtil.toDate(this.bag.endTime).getTime() / 1e3;

    await this.bag.readMessages({topics: [CONFIGURATION, TF]}, ({topic, message}) => {
      if (topic === CONFIGURATION) {
        const config = message.keyvalues.reduce((memo, kv) => {
          memo[kv.key] = kv.value;
          return memo;
        }, {});

        if (config.map_lat) {
          origin = {
            latitude: parseFloat(config.map_lat),
            longitude: parseFloat(config.map_lng),
            altitude: parseFloat(config.map_alt)
          };
        }
      } else if (topic === TF) {
        message.transforms.forEach(t => {
          frameIdToPoseMap[t.child_frame_id] = {
            ...t.transform.translation,
            ...quaternionToEuler(t.transform.rotation)
          };
        });
      }
    });

    // console.log('Calc metadata', (Date.now() - start) / 1000);

    return {
      type: 'xviz/metadata',
      data: {
        version: '2.0',
        start_time,
        end_time,
        log_info: {
          start_time,
          end_time
        },
        origin,
        frameIdToPoseMap
      }
    };
  }

  // We synchronize frames along messages in the `keyTopic`.
  async readFrameByTime(start, end) {
    const bag = await open(this.bagPath);
    const frame = {};

    const options = {};

    if (start) {
      options.startTime = TimeUtil.fromDate(new Date(start * 1e3));
    }

    if (end) {
      options.endTime = TimeUtil.fromDate(new Date(end * 1e3));
    }

    if (this.topics) {
      options.topics = this.topics;
    }

    await bag.readMessages(options, async result => {
      // rosbag.js reuses the data buffer for subsequent messages, so we need to make a copy
      if (result.message.data) {
        result.message.data = Buffer.from(result.message.data);
      }

      if (result.topic === this.keyTopic) {
        frame.keyTopic = result;
      }

      frame[result.topic] = frame[result.topic] || [];
      frame[result.topic].push(result);
    });

    return await this.buildFrame(frame);
  }

  async buildFrame(frame) {
    const xvizBuilder = new XVIZBuilder(this.metadata.data, this.disableStreams, {});

    for (const topicName in this.topicType) {
      if (this.topicType[topicName].converter) {
        await this.topicType[topicName].converter.convertFrame(frame, xvizBuilder);
      }
    }

    const frm = xvizBuilder.getFrame();
    return frm;
  }

  // We synchronize frames along messages in the `keyTopic`.
  async readFrameByKeyTopic(start, end) {
    const bag = await open(this.bagPath);
    let frame = {};

    async function flushFrame() {
      if (frame.keyTopic) {
        // This needs to be address, was used to flush on keyTopic message to sync
        // await onFrame(frame);
        frame = {};
      }
    }

    const options = {
      startTime: TimeUtil.fromDate(new Date(start * 1e3)),
      endTime: TimeUtil.fromDate(new Date(end * 1e3))
    };

    if (this.topics) {
      options.topics = this.topics;
    }

    await bag.readMessages(options, async result => {
      // rosbag.js reuses the data buffer for subsequent messages, so we need to make a copy
      if (result.message.data) {
        result.message.data = Buffer.from(result.message.data);
      }
      if (result.topic === this.keyTopic) {
        await flushFrame();
        frame.keyTopic = result;
      }
      frame[result.topic] = frame[result.topic] || [];
      frame[result.topic].push(result);
    });

    // Flush the final frame
    await flushFrame();
  }
}
