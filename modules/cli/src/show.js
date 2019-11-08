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

export const ShowMode = Object.freeze({
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
export class ShowXVIZ {
  constructor(options = {}) {
    this.mode = options.mode === undefined ? ShowMode.ALL : options.mode;
    // eslint-disable-next-line no-console
    this.log = options.log || console.log;

    this.streams = null;
    if (options.stream) {
      this.streams = Array.isArray(options.stream) ? options.stream : [options.stream];
    }
  }

  onConnect() {
    this.log('[CONNECTED]');
  }

  onError(msg) {
    const oneline = () => {
      return `msg: ${msg.message}`;
    };

    this._showReceived('error', msg, oneline);
  }

  onMetadata(msg) {
    const oneline = () => {
      const verStr = msg.version || 'Unknown';
      return `version: ${verStr}`;
    };

    this._showReceived('metadata', msg, oneline);
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

    this._showReceived('state_update', msg, oneline);
  }

  onClose() {
    this.log('[CONNECTION CLOSED]');
  }

  _showReceived(type, data, condensed, oneline) {
    this._dump('>', type, data, condensed, oneline);
  }

  _dumpMap(object) {
    const keys = Object.keys(object);
    for (const key of keys) {
      if (this.streams.includes(key)) {
        this.log(`Stream ${key}\n${JSON.stringify(object[key], null, 4)}`);
      }
    }
  }

  _dump(prefix, type, data, condensed, oneline) {
    const header = `[${prefix} ${type.toUpperCase()}]`;

    switch (this.mode) {
      case ShowMode.ALL:
        if (this.streams && type === 'state_update') {
          data.updates.forEach(update => {
            this.log(`${header} @ ${update.timestamp}`);
            this._dumpMap(update.poses);
            this._dumpMap(update.primitives);
          });
        } else {
          this.log(`${header}\n${JSON.stringify(data, null, 4)}`);
        }
        break;

      case ShowMode.CONDENSED:
        this.log(`${header} ${condensed()}`);
        break;

      case ShowMode.ONELINE:
        const output = oneline || condensed;
        this.log(`${header} ${output()}`);
        break;

      default:
        throw new Error(`Unknown show mode ${this.mode}`);
    }
  }
}
