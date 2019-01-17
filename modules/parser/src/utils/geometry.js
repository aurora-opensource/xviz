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

// returns the centroid position for an array of points
export function getCentroid(polygon) {
  let sx = 0;
  let sy = 0;
  let sz = 0;

  let len = polygon.length;
  if (len === 1) {
    return polygon[0];
  }

  if (polygon[0] === polygon[len - 1]) {
    // the last vertex is the same as the first, ignore
    len -= 1;
  }

  for (let i = 0; i < len; i++) {
    const point = polygon[i];
    sx += point[0];
    sy += point[1];
    sz += point[2] || 0;
  }

  return [sx / len, sy / len, sz / len];
}
