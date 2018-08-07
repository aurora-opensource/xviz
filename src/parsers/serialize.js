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
import {LOG_STREAM_MESSAGE} from '../constants';
import {getXvizConfig} from '../config/xviz-config';
import XvizObject from '../objects/xviz-object';

/**
 * placeholder
 */
export function preSerialize(message) {
  return message;
}

/**
 * Restore message after deserialization (received via postMessage)
 * @params message {object} - received dehydrated message from other threads
 */
export function postDeserialize(message) {
  const {OBJECT_STREAM} = getXvizConfig();

  const {type} = message;
  const streams = message.streams || message.channels;
  if (type === LOG_STREAM_MESSAGE.TIMESLICE) {
    // Populate global object metadata
    // ParseXvizV1 did the same thing on the thread that it's run
    const objects = streams[OBJECT_STREAM];
    if (objects) {
      objects.features.forEach(f => {
        XvizObject.observe(f.id, message.timestamp);
      });
    }
  }
  return message;
}
