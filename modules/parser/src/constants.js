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

/** @constant TIME_WINDOW
 * Determines the amount of time, in seconds, we will consider
 * before a given time.
 *
 * The system primarily operates at 100hz and 10hz. The 10hz gives
 * a window of 100ms between samples. We double that to ensure we
 * cover a sufficient time window for any available data.
 */
export const LOG_STREAM_MESSAGE = {
  METADATA: 'METADATA',
  TIMESLICE: 'TIMESLICE',
  DONE: 'DONE',
  VIDEO_METADATA: 'VIDEO_METADATA',
  VIDEO_FRAME: 'VIDEO_FRAME',
  ERROR: 'ERROR',
  INCOMPLETE: 'INCOMPLETE'
};
