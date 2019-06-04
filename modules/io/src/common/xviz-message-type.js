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
export const XVIZMessageType = Object.freeze({
  START: 'START',
  ERROR: 'ERROR',
  DONE: 'DONE',
  METADATA: 'METADATA',
  STATE_UPDATE: 'STATE_UPDATE',
  TRANSFORM_LOG: 'TRANSFORM_LOG',
  TRANSFORM_LOG_DONE: 'TRANSFORM_LOG_DONE',
  TRANSFORM_POINT_IN_TIME: 'TRANSFORM_POINT_IN_TIME',
  RECONFIGURE: 'RECONFIGURE'
});
