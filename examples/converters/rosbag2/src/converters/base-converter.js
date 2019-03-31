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

import fs from 'fs';
import path from 'path';

import sqlite3 from 'sqlite3';

//import rosbags2_nodejs from 'rosbags2_nodejs';
//let RosbagDeserializer = require('../../node_modules/rosbags2_nodejs/build/Release/rosbags2_nodejs.node');

let RosbagDeserializer = require('../../node_modules/rosbags2_nodejs/build/Release/rosbags2_nodejs.node');

export default class BaseConverter {
  constructor(dbPath, topicName) {
    // Ros2 bags consists of a single SQLite3 db file, with blobs of serialized data
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(this.dbPath);

    this.topicName = topicName;

    this.deserializer = new RosbagDeserializer.Rosbag2Wrapper();
    this.messageMapping = {};
  }

  async load() {
    // Load all messages from SQLite3
    try {
      this.topicId = await this.getTopicId(this.db, this.topicName);
    } catch (err) {
      console.log('Message mapping failed error', err);
    }
  }

  async getTopicId(db, topicName) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM topics WHERE name=$topicName',
        {$topicName: topicName},
        (error, results) => {
          if (error) reject(error);
          resolve(results.id);
        }
      );
    });
  }

  async getMessageType(db, topicName) {
    return new Promise((resolve, reject) => {
      db.get('SELECT type FROM topics WHERE name=$topicName', {$topicName: topicName}, function(
        error,
        results
      ) {
        if (error) reject(error);
        resolve(results.type);
      });
    });
  }

  async getMessage(frameNumber, topicId) {
    const this_ = this;
    // map the topic to the topic id using messageMapping
    return new Promise((resolve, reject) => {
      this_.db.get(
        'SELECT timestamp, data FROM messages WHERE topic_id = $topicId LIMIT 1 OFFSET $frameNumber',
        {
          $frameNumber: frameNumber,
          $topicId: this.topicId || 4
        },
        function(error, results) {
          if (error) reject(error);
          resolve(results);
        }
      );
    });
  }

  deserializeRosMessage(message, messageType, topic) {
    const uint8Message = new Uint8Array(message);
    let base64_string = this.deserializer.deserializeMessage(uint8Message, messageType, topic);
    return base64_string;
  }

  async loadFrame(frameNumber) {
    // Load the data for this frame
    const this_ = this;
    const data = await new Promise((resolve, reject) => {
      this_.db.get(
        'SELECT topicid, data FROM messages WHERE id=$frameNumber',
        {
          $frameNumber: frameNumber
        },
        function(error, results) {
          if (error) reject(error);
          resolve(results);
        }
      );
    });

    // Remap topic id to topic
    //data.topic = this.messageMapping[data.topic];

    // Get the time stamp
    // Note: original Rosbag2 timestamps give nanoseconds
    const timestamp = Date.parse(`${data.timestamp} GMT`) / 1000;

    return {data, timestamp};
  }
}
