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

import {XVIZMessageNamespace} from './constants';
import {XVIZMessageType} from './xviz-message-type';

function makeMessage(messageType, data) {
  return {type: `${XVIZMessageNamespace}/${messageType}`, data};
}

export const XVIZEnvelope = {
  Metadata: data => makeMessage(XVIZMessageType.METADATA, data),
  StateUpdate: data => makeMessage(XVIZMessageType.STATE_UPDATE, data),
  Error: data => makeMessage(XVIZMessageType.ERROR, data),
  TransformLogDone: data => makeMessage(XVIZMessageType.TRANSFORM_LOG_DONE, data)
};
