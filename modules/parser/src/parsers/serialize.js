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
 * Convert stream messages for safe transfer between threads
 */
import {XVIZ_MESSAGE_TYPE} from '../constants';
import {getXVIZConfig} from '../config/xviz-config';
import XVIZObject from '../objects/xviz-object';

/**
 * placeholder
 */
export function preSerialize(message) {
  return message;
}

// Populate global object metadata
// ParseXVIZPrimitive did the same thing on the thread that it's run
function observeObjects(objects, timestamp) {
  if (objects) {
    objects.features.forEach(f => {
      XVIZObject.observe(f.id, timestamp);
    });
  }
}

/**
 * Restore message after deserialization (received via postMessage)
 * @params message {object} - received dehydrated message from other threads
 */
export function postDeserialize(message) {
  if (message.type !== XVIZ_MESSAGE_TYPE.TIMESLICE) {
    return message;
  }

  const {OBJECT_STREAM} = getXVIZConfig();
  const {streams, timestamp} = message;

  // OBJECT_STREAM is deprecated, only keeping for backward compatibility
  if (OBJECT_STREAM) {
    observeObjects(streams[OBJECT_STREAM], timestamp);
    return message;
  }

  for (const streamName in streams) {
    const objects = streams[streamName];
    if (objects && objects.features && objects.features.length && objects.features[0].id) {
      observeObjects(objects, timestamp);
    }
  }
  return message;
}
