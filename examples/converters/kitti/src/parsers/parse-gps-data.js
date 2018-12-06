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

/**
 * Parse GPS/IMU data (stored in oxts dir),
 * extract vehicle pose, velocity and acceleration information
 */

// Per dataformat.txt
const OxtsPacket = [
  'lat',
  'lon',
  'alt',
  'roll',
  'pitch',
  'yaw',
  'vn',
  've',
  'vf',
  'vl',
  'vu',
  'ax',
  'ay',
  'az',
  'af',
  'al',
  'au',
  'wx',
  'wy',
  'wz',
  'wf',
  'wl',
  'wu',
  'pos_accuracy',
  'vel_accuracy',
  'navstat',
  'numsats',
  'posmode',
  'velmode',
  'orimode'
];

function getOxtsPacket(oxtsLine) {
  const res = OxtsPacket.reduce((resMap, key, i) => {
    resMap[key] = oxtsLine[i];
    return resMap;
  }, {});

  return res;
}

export function loadOxtsPackets(content) {
  // Generator to read OXTS ground truth data.
  // Poses are given in an East-North-Up coordinate system
  // whose origin is the first GPS position.

  const values = content.split(' ').filter(Boolean);
  // TODO: this should validate the # of fields
  return getOxtsPacket(values);
}
