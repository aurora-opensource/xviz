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

/* eslint-env node, browser */

export const DumpMode = Object.freeze({
  // Only a single line per message
  ONELINE: 0,
  // A summary view
  CONDENSED: 1,
  // All the data in JSON form
  ALL: 2
});

/**
 * XVIZ middleware that echos all messages, with configurable level of
 * details.
 */
export class DumpXVIZ {
  constructor(options = {}) {
    this.mode = options.mode === undefined ? DumpMode.ALL : options.mode;
    // eslint-disable-next-line no-console
    this.log = options.log || console.log;
  }

  onConnect() {
    this.log('[CONNECTED]');
  }

  onStart(msg) {
    const oneline = () => {
      if (msg) {
        return `log: ${msg.log}`;
      }
      return '';
    };

    this._dumpSent('start', msg, oneline);
  }

  onError(msg) {
    const oneline = () => {
      return `msg: ${msg.message}`;
    };

    this._dumpReceived('error', msg, oneline);
  }

  onMetadata(msg) {
    const oneline = () => {
      const verStr = msg.version || 'Unknown';
      return `version: ${verStr}`;
    };

    this._dumpReceived('metadata', msg, oneline);
  }

  onTransformLog(msg) {
    const oneline = () => {
      const startStr = msg.start_timestamp || 'LOG-START';
      const endStr = msg.end_timestamp || 'LOG-END';

      return `${startStr} - ${endStr} (tid: ${msg.id})`;
    };

    this._dumpSent('transform_log', msg, oneline);
  }

  onStateUpdate(msg) {
    const oneline = () => {
      const updates = msg.updates;
      if (updates && updates.length > 0) {
        const startTime = updates[0].timestamp;
        if (updates.length === 1) {
          return `time: ${startTime}`;
        }
        const endTime = updates[updates.length - 1].timestamp;
        return `time: ${startTime} - ${endTime} (${endTime - startTime})`;
      }
      return 'empty';
    };

    this._dumpReceived('state_update', msg, oneline);
  }

  onTransformLogDone(msg) {
    const oneline = () => {
      return `tid: ${msg.id}`;
    };
    this._dumpReceived('transform_log_done', msg, oneline);
  }

  onClose() {
    this.log('[CONNECTION CLOSED]');
  }

  _dumpSent(type, data, condensed, oneline) {
    this._dump('<', type, data, condensed, oneline);
  }

  _dumpReceived(type, data, condensed, oneline) {
    this._dump('>', type, data, condensed, oneline);
  }

  _dump(prefix, type, data, condensed, oneline) {
    const header = `[${prefix} ${type.toUpperCase()}]`;

    switch (this.mode) {
      case DumpMode.ALL:
        this.log(`${header}\n${JSON.stringify(data, null, 4)}`);
        break;

      case DumpMode.CONDENSED:
        this.log(`${header} ${condensed()}`);
        break;

      case DumpMode.ONELINE:
        const output = oneline || condensed;
        this.log(`${header} ${output()}`);
        break;

      default:
        throw new Error(`Unknown dump mode ${this.mode}`);
    }
  }
}
