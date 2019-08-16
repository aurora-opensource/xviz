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
export const XVIZ_MESSAGE_TYPE = {
  METADATA: 'METADATA',
  TIMESLICE: 'TIMESLICE',
  DONE: 'DONE',
  VIDEO_METADATA: 'VIDEO_METADATA',
  VIDEO_FRAME: 'VIDEO_FRAME',
  ERROR: 'ERROR',
  INCOMPLETE: 'INCOMPLETE'
};

export const STATE_UPDATE_TYPE = {
  COMPLETE_STATE: 'COMPLETE',
  INCREMENTAL: 'INCREMENTAL',
  PERSISTENT: 'PERSISTENT',

  // Deprecated
  SNAPSHOT: 'INCREMENTAL'
};

// Deprecated
export {XVIZ_GLTF_EXTENSION} from '@xviz/io';
