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
import {getXVIZConfig} from '../config/xviz-config';

/* eslint-disable camelcase */
export function parseXVIZPose(pose) {
  // TODO(twojtasz): remove deprecated mapOrigin
  //                 https://github.com/uber/xviz/issues/394
  const {mapOrigin, map_origin, position, orientation, timestamp} = pose;
  const origin = map_origin || mapOrigin;

  const result = {
    timestamp
  };

  if (origin) {
    const {longitude, latitude, altitude} = origin;
    Object.assign(result, {
      longitude,
      latitude,
      altitude
    });
  }

  if (position) {
    const [x, y, z] = position;
    Object.assign(result, {
      x,
      y,
      z
    });
  }

  if (orientation) {
    const [roll, pitch, yaw] = orientation;
    Object.assign(result, {
      roll,
      pitch,
      yaw
    });
  }

  if (getXVIZConfig().DYNAMIC_STREAM_METADATA) {
    result.__metadata = {
      category: 'POSE'
    };
  }

  return {...pose, ...result};
}
