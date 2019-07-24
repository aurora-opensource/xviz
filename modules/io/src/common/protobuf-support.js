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
import {loadProtos} from '@xviz/schema';

// All XVIZ messages
export const XVIZ_PROTOBUF_MESSAGE_NAME = {
  ENVELOPE: 'xviz.v2.Envelope',
  START: 'xviz.v2.Start',
  TRANSFORM_LOG: 'xviz.v2.TransformLog',
  TRANSFORM_LOG_POINT_IN_TIME: 'xviz.v2.TransformPointInTime',
  TRANSFORM_LOG_DONE: 'xviz.v2.TransformLogDone',
  STATE_UPDATE: 'xviz.v2.StateUpdate',
  RECONFIGURE: 'xviz.v2.Reconfigure',
  METADATA: 'xviz.v2.Metadata',
  ERROR: 'xviz.v2.Error'
};

export const XVIZ_PROTOBUF_TYPE_NAME = {
  UI_PANEL_INFO: 'xviz.v2.UIPanelInfo'
};

// PBE1
export const MAGIC_PBE1 = 0x50424531;
export const XVIZ_PROTOBUF_MAGIC = Uint8Array.from([0x50, 0x42, 0x45, 0x31]);

export const XVIZ_PROTOBUF_ROOT = loadProtos();

export const XVIZ_PROTOBUF_MESSAGE = {
  Envelope: XVIZ_PROTOBUF_ROOT.lookupType(XVIZ_PROTOBUF_MESSAGE_NAME.ENVELOPE),
  Metadata: XVIZ_PROTOBUF_ROOT.lookupType(XVIZ_PROTOBUF_MESSAGE_NAME.METADATA),
  StateUpdate: XVIZ_PROTOBUF_ROOT.lookupType(XVIZ_PROTOBUF_MESSAGE_NAME.STATE_UPDATE)
};

export const XVIZ_PROTOBUF_TYPE = {
  UIPanelInfo: XVIZ_PROTOBUF_ROOT.lookupType(XVIZ_PROTOBUF_TYPE_NAME.UI_PANEL_INFO)
};
