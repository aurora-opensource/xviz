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

// TODO: how to "initialize" a new stream
//
// cases
//  - no mapping, we create converts for all supported messages
//    - do not support non-primitive fields of messages
//    - could be an option later
//  - mapping, only those listed
import {XVIZBuilder} from '@xviz/builder';

export class ROS2XVIZ {
  constructor(converters, mapping, options) {
    // options: {logger}
    this.options = options;

    // Converters: [
    //  converterClass { name, messageType } to map to mapping
    // ]
    this.converters = converters;

    // Would represent all available topics handled
    // or null if just mapping by converters.messageType
    // Mapping: [
    //   { topic, name, config: {xvizStream, field} }
    // ]
    this.mapping = mapping;

    // topicMessageTypes [ {topic, type, message }, ...]
    this.topicMessageTypes = null;
  }

  log(msg) {
    const {logger} = this.options;
    if (logger && logger.info) {
      logger.log(msg);
    }
  }

  // Make a converter for each topic.
  // If we have a mapping, that will be used to find a converter
  // for a topic, and supports 1-> many mappings.
  //
  // if we don't have a mapping, we will just find one based on
  // the message type
  /* eslint-disable max-statements */
  _makeConvertersForTopic(instances, topicMessage, mappedState, aux) {
    // TODO: support message parsing for conversion mapping
    const {topic, type} = topicMessage;

    const {converters, mapping} = this;

    this.log(`ROS2XVIZ setting up converter for ${topic}`);
    let topicMapped = false;
    if (mapping) {
      // We can map 1 ROS message to many converters if we are mapping individual fields
      // so we need to track which mapping has been used
      for (const [index, entry] of mapping.entries()) {
        // Already mapped this one
        if (mappedState[index] === true) {
          continue;
        }

        let Converter = null;
        if (entry.topic === topic) {
          this.log(`ROS2XVIZ Mapping for ${topic}`);
          // Specific converter by name
          if (entry.name) {
            Converter = converters.find(converter => converter.name === entry.name);
            if (!Converter) {
              this.log(
                `ROS2XVIZ cannot find the converter with name ${entry.name} for topic ${topic}`
              );
            }
          } else {
            // converter by message type
            Converter = converters.find(converter => converter.messageType === type);
            if (!Converter) {
              this.log(
                `ROS2XVIZ cannot find the converter for message type ${type} for topic ${topic}`
              );
            }
          }

          if (Converter) {
            // aux could have origin, frameIdToPoseMap
            const config = {...aux, topic, ...entry.config};
            instances.push(new Converter(config));
            mappedState[index] = true;
            topicMapped = true;
          }
        }
      }
    }

    if (!topicMapped) {
      // converter by message type
      const Converter = converters.find(converter => converter.messageType === type);
      if (!Converter) {
        this.log(`ROS2XVIZ cannot find the converter for message type ${type} for topic ${topic}`);
      } else {
        // aux could have field, xvizStream, origin, etc
        const config = {...aux, topic};
        instances.push(new Converter(config));
      }
    }
  }
  /* eslint-enable max-statements */

  initializeConverters(topicMessageTypes, aux) {
    this.topicMessageTypes = topicMessageTypes;
    // topicMessageTypes [ {topic, type, message }, ...]
    // aux { origin, frameIdToPoseMap }

    const instances = [];
    const mapped = new Array(this.mapping.length).fill(false);
    // const hrstart = process.hrtime();
    for (const entry of topicMessageTypes) {
      this._makeConvertersForTopic(instances, entry, mapped, aux);
    }
    // const hrend = process.hrtime(hrstart);
    // this.log(`Make Converters time (hr): ${hrend[0]}s ${hrend[1] / 1e6}ms`);

    this.instances = instances;
  }

  async buildMetadata(metadataBuilder, aux) {
    this.log(`ROS2XVIZ buildMetadata`);
    // aux = { frameIdToPoseMap }

    for (const instance of this.instances) {
      await instance.getMetadata(metadataBuilder, aux);
    }

    // TODO: This could be overwritten/augmented by caller, so not really perfect
    this.metadata = metadataBuilder.getMetadata();
  }

  async buildMessage(frame) {
    const xvizBuilder = new XVIZBuilder(this.metadata, this.disableStreams, {});

    // const hrstart = process.hrtime();
    for (const instance of this.instances) {
      instance.convertMessage(frame, xvizBuilder);
    }
    // const hrend = process.hrtime(hrstart);
    // this.log(`Building message time (hr): ${hrend[0]}s ${hrend[1] / 1e6}ms`);

    try {
      const frm = xvizBuilder.getMessage();
      return frm;
    } catch (err) {
      return null;
    }
  }
}
