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

import {XVIZ_MESSAGE_NAMESPACE} from './constants';
import {XVIZ_MESSAGE_TYPE} from './xviz-message-type';

function makeMessage(messageType, data) {
  return {type: `${XVIZ_MESSAGE_NAMESPACE}/${messageType}`, data};
}

// A helper create XVIZ Messages
export const XVIZEnvelope = {
  Metadata: data => makeMessage(XVIZ_MESSAGE_TYPE.METADATA, data),
  StateUpdate: data => makeMessage(XVIZ_MESSAGE_TYPE.STATE_UPDATE, data),
  Error: data => makeMessage(XVIZ_MESSAGE_TYPE.ERROR, data),
  TransformLogDone: data => makeMessage(XVIZ_MESSAGE_TYPE.TRANSFORM_LOG_DONE, data)
};
