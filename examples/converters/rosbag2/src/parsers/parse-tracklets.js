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

/* eslint-disable camelcase */
/**
 * Parse tracklets objects (stored in tracklet_labels.xml),
 */
import parser from 'xml2json';
import uuid from 'uuid/v4';

export function loadTracklets(tracklets_contents) {
  const raw_data = JSON.parse(parser.toJson(tracklets_contents));
  const tracklets = raw_data.boost_serialization.tracklets;

  const objects = parseObjectMetadata(tracklets);

  return {objects, tracklets};
}

function parseObjectMetadata(tracklets) {
  return tracklets.item.map(item => {
    const properties = {
      id: uuid(),
      objectType: item.objectType,
      width: Number(item.w),
      height: Number(item.h),
      length: Number(item.l)
    };

    const bounds = [
      [-item.l / 2, -item.w / 2, 0],
      [-item.l / 2, item.w / 2, 0],
      [item.l / 2, item.w / 2, 0],
      [item.l / 2, -item.w / 2, 0],
      [-item.l / 2, -item.w / 2, 0]
    ];

    const firstFrame = Number(item.first_frame);
    const count = Number(item.poses.count);
    const lastFrame = firstFrame + count;

    return {
      data: item,
      firstFrame,
      lastFrame,
      count,
      ...properties,
      bounds
    };
  });
}
