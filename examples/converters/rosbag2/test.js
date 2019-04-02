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
require('@babel/register');
require('babel-polyfill');

//const rosbag2_nodejs = require('bindings')('rosbag2_nodejs');
let sqlite3 = require('sqlite3');

let RosbagDeserializer = require('./node_modules/rosbags2_nodejs/build/Release/rosbags2_nodejs.node');

const deserializer = new RosbagDeserializer.Rosbag2Wrapper();

let dataDir = '/Users/andreasklintberg/personal/rosbag2_nodejs/examples/sample.db3';

db = new sqlite3.Database(dataDir);

/* Text */
const textId = 1;
db.serialize(function() {
  db.get(
    'SELECT data FROM messages WHERE id=$textId',
    {
      $textId: textId
    },
    function(err, res) {
      const uint8Message = new Uint8Array(res['data']);
      /* deserializeMessage functions takes arguments: binary message data, ros message type, topic */
      let base64_string = deserializer.deserializeMessage(uint8Message, 'std_msgs/String', '/text');
      let buff = Buffer.from(base64_string, 'base64');
      console.log('deserialized text message', buff.toString('ascii'));
    }
  );
});
