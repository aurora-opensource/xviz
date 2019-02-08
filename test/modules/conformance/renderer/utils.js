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

import {parseStreamMessage} from '@xviz/parser';

export function parseFrame(frame) {
  let result;

  const onError = error => {
    throw error;
  };

  parseStreamMessage({
    message: frame,
    onResult: message => {
      result = message;
    },
    onError
  });

  return result;
}

export function getTransform({vehiclePose, streamMetadata, viewport}) {
  // TODO - handle coordinate systems
  return p => [p[0] + viewport.width / 2, p[1] + viewport.height / 2, p[2]];
}

export function getStyles(stylesheet, propertyNames, feature) {
  const styles = {};

  for (const propertyName of propertyNames) {
    let value = stylesheet.getProperty(propertyName, feature);
    if (value === null) {
      value = stylesheet.getPropertyDefault(propertyName);
    }
    styles[propertyName] = value;
  }
  return styles;
}

export function getCSSColor(color, opacity) {
  const rgb = color.slice(0, 3);
  let alpha = opacity;
  if (color.length === 4) {
    alpha *= color[3] / 255;
  }
  return `rgba(${rgb.join(',')},${alpha})`;
}
