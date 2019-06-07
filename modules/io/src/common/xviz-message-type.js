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
export const XVIZ_MESSAGE_TYPE = Object.freeze({
  START: 'start',
  ERROR: 'error',
  DONE: 'done',
  METADATA: 'metadata',
  STATE_UPDATE: 'state_update',
  TRANSFORM_LOG: 'transform_log',
  TRANSFORM_LOG_DONE: 'transform_log_done',
  TRANSFORM_POINT_IN_TIME: 'transform_point_in_time',
  RECONFIGURE: 'reconfigure'
});
