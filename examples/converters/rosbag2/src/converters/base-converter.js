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

import rosbags2_nodejs from 'rosbags2_nodejs';

export default class BaseConverter {
  constructor(dbPath) {
    // Ros2 bags consists of a single SQLite3 db file, with blobs of serialized data
    this.dbPath = dbPath;

    this.deserializer = new rosbags2_nodejs.Rosbag2Wrapper();
  }

  async load() {
    // Load all messages from SQLite3
    this.db = new sqlite3.Database(this.dbPath);

    try {
      this.messageMapping = await this.getMessageTypeMapping(this.db);
    } catch (err) {
      console.log(err)
    }

  }

  async getMessageTypeMapping(db) {
    return new Promise((resolve, reject) => {
      db.all("SELECT name, id, type FROM topics", function (error, results) {
        if (error) reject(error);
        resolve(results)
      })

    })
  }


  async getMessage(frameNumber, topicType) {
    const this_ = this;
    console.log("messageMapping", this_.messageMapping);
    // map the topic to the topic id using messageMappinp
    const topicId = 4;
    this_.db.get("SELECT timestamp, data FROM messages WHERE topic_id = $topicId LIMIT 1 OFFSET $frameNumber", {
      $frameNumber: frameNumber,
      $topicId: topicId
    })
  }

  deserializeRosMessage(message, messageType, topic) {
    const uint8Message = new Uint8Array(message['data']);
    let base64_string = this.deserializer.deserializeMessage(uint8Message, messageType, topic);
    let buff = Buffer.from(base64_string, 'base64');
    return JSON.parse(buff.toString('ascii'));
  }

  async loadFrame(frameNumber) {
    // Load the data for this frame
    const this_ = this;
    const data = await new Promise(function (resolve, reject) {
      this_.db.get("SELECT topicid, data FROM messages WHERE id=$frameNumber", {
        $frameNumber: frameNumber,
      }, resolve)
    });

    // Remap topic id to topic
    //data.topic = this.messageMapping[data.topic];

    // Get the time stamp
    // Note: original Rosbag2 timestamps give nanoseconds
    const timestamp = Date.parse(`${data.timestamp} GMT`) / 1000;

    return {data, timestamp};
  }
}
