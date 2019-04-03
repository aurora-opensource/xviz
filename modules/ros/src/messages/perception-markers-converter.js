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
import {TRACKS_MARKERS} from '../topics';
import MarkerArrayConverter from './base/marker-array-converter';

export default class PerceptionMarkersConverter extends MarkerArrayConverter {
  constructor(xvizNamespace) {
    super({
      topic: TRACKS_MARKERS,
      xvizNamespace,
      acceptMarker: marker => ['velocity_arrow'].includes(marker.ns)
    });
  }
}
