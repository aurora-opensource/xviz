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

const path = require('path');
const fs = require('fs');

/**
 * XVIZ middleware that saves all messages to disk.
 */
export class LogXVIZ {
  constructor(outputDir, options = {}) {
    this.outputDir = outputDir;
    this.frame = 2;

    // Make sure output directory does not exist
    if (fs.existsSync(this.outputDir)) {
      throw `Cannot use directory, already exists: "${this.outputDir}"`;
    }
  }

  onConnect() {
    // Make sure output directory exists
    fs.mkdirSync(this.outputDir);
  }

  // TODO(jlisee): we should have a hook that gets all the messages
  onError(msg) {
    this._writeMessage('error', msg, 1);
  }

  onMetadata(msg) {
    this._writeMessage('metadata', msg);
  }

  onStateUpdate(msg) {
    this._writeMessage('state_update', msg);
  }

  onTransformLogDone(msg) {
    this._writeMessage('transform_log_done', msg);
  }

  _writeMessage(msgType, msg, frame) {
    if (frame === undefined) {
      frame = this.frame;
      this.frame += 1;
    }
    // TODO(jlisee): don't assume JSON
    const filepath = path.join(this.outputDir, `${frame}-frame.json`);

    // Re-envelope data (TODO: make function call)
    const data = JSON.stringify({type: `xviz/${msgType}`, data: msg});

    fs.writeFile(filepath, data, err => {
      if (err) throw err;
      console.log(`File saved ${filepath}!`);
      // TODO(jlisee): for testing put a callback here
      // in the main function, so the test can make sure the
      // exists after the write, or the last write...
    });
  }
}
