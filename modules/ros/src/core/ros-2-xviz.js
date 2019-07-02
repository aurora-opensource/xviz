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
// Given a mapping, this will initialize the converter classes and manage delegating
// the building of metadata and messsages to the converters
/* eslint-disable no-continue, max-depth */

import {XVIZBuilder} from '@xviz/builder';

export class ROS2XVIZConverter {
  constructor(converters, rosConfig, options = {}) {
    // options: {logger}
    this.options = options;

    // Converters: [
    //  converterClass { name, messageType }
    // ]
    this.converters = converters;

    // Would represent all available topics handled
    // or null if just mapping by converters.messageType
    // rosConfig: {
    //  topicConfig: [
    //    { topic, type, converter, config: {xvizStream}
    //  ]
    // }
    this.rosConfig = rosConfig;

    this.instances = [];
  }

  verbose(msg) {
    const {logger} = this.options;
    if (logger && logger.verbose) {
      logger.verbose(msg);
    }
  }

  // Make a converter for each topic.
  // If we have a rosConfig, that will be used to find a converter
  //
  // if we don't have a rosConfig, we will just find one based on
  // the message type
  _makeConvertersForTopic(entry, topicMessageTypes, aux) {
    const {topic, type, converter, config} = entry;
    const {converters} = this;

    let ConverterClass = null;

    // Specific converter by name
    if (converter) {
      this.verbose(`ROS2XVIZConverter setting up converter by name for '${topic}'`);
      ConverterClass = converters.find(conv => conv.name === converter);
      if (!ConverterClass) {
        this.verbose(
          `ROS2XVIZConverter cannot find the converter with name '${converter}' for topic '${topic}'`
        );
      }
    } else {
      // converter by message type
      const msgType = type || topicMessageTypes[topic];
      if (!msgType) {
        this.verbose(`ROS2XVIZConverter does not have a type for the '${topic}', skipping`);
      } else {
        this.verbose(`ROS2XVIZConverter setting up converter by type '${msgType}' for '${topic}'`);
        ConverterClass = converters.find(conv => conv.messageType === msgType);
        if (!ConverterClass) {
          this.verbose(
            `ROS2XVIZConverter cannot find the converter for message type '${msgType}' for topic '${topic}'`
          );
        }
      }
    }

    if (ConverterClass) {
      // aux could have origin, frameIdToPoseMap
      const converterConfig = {...this.options, ...aux, ...config, topic};
      this.instances.push(new ConverterClass(converterConfig));
    }
  }

  // Using the rosConfig, we have to initialize a converter for each entry.
  // Note this must support 1-1 and 1-m topic to Converter mappings.
  //
  // topicMessageTypes is used if the entries in the rosConfig
  // to not have a type or converter named.
  initializeConverters(topicMessageTypes, aux) {
    const {rosConfig} = this;
    // topicMessageTypes {topic: type, ...}
    // aux { origin, frameIdToPoseMap }

    const count = rosConfig.entryCount;

    if (count > 0) {
      // Construct by rosConfig
      for (const entry of rosConfig.topicConfig) {
        this._makeConvertersForTopic(entry, topicMessageTypes, aux);
      }
    } else {
      // Construct by topic type
      for (const key in topicMessageTypes) {
        this._makeConvertersForTopic(
          {topic: key, type: topicMessageTypes[key]},
          topicMessageTypes,
          aux
        );
      }
    }

    if (this.instances.length === 0) {
      throw new Error(
        'No converters where created. Check that the configuration is correct and the Converter classes are properly registered.'
      );
    }
  }

  buildMetadata(metadataBuilder, aux) {
    // aux = { frameIdToPoseMap }

    for (const instance of this.instances) {
      instance.getMetadata(metadataBuilder, aux);
    }

    this.metadata = metadataBuilder.getMetadata();
  }

  async buildMessage(frame) {
    const xvizBuilder = new XVIZBuilder(this.metadata, this.disableStreams, {});

    for (const instance of this.instances) {
      await instance.convertMessage(frame, xvizBuilder);
    }

    try {
      const frm = xvizBuilder.getMessage();
      return frm;
    } catch (err) {
      return null;
    }
  }
}
