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

import {CATEGORY} from './constant';
import XVIZBaseBuilder from './xviz-base-builder';

/**
 * XVIZTimeSeriesBuilder manages time_series data by `time` and `id` and stores
 * the the array of single stream value entries.
 *
 * This is the shape returned from getData()
 *
 * [
 *   {
 *     timestamp: x,
 *     streams: ['a', 'b'],
 *     values: {doubles: [1, 2]},
 *     object_id: '123'
 *   },
 *   {
 *     timestamp: y,
 *     streams: ['a', 'b'],
 *     values: {doubles: [1, 2]},
 *   }
 * ]
 */
export default class XVIZTimeSeriesBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.TIME_SERIES
    });

    // Stores time_series data by timestamp then id
    // They will then be group when constructing final object
    this._data = new Map();

    // inflight builder data
    this._id = null;
    this._value = null;
    this._timestamp = null;
  }

  id(identifier) {
    this.validatePropSetOnce('_id');
    this._id = identifier;
    return this;
  }

  value(value) {
    this.validatePropSetOnce('_value');

    if (value instanceof Array) {
      this.validateError('Input `value` must be single value');
    }

    this._value = value;
    return this;
  }

  timestamp(timestamp) {
    this.validatePropSetOnce('_timestamp');

    if (timestamp instanceof Array) {
      this.validateError('Input `timestamp` must be a single value');
    }

    this._timestamp = timestamp;
    return this;
  }

  getData() {
    this._flush();
    if (this._data.size === 0) {
      return null;
    }

    const timeSeriesData = [];
    for (const [timestamp, ids] of this._data) {
      for (const [id, fields] of ids) {
        for (const tsdata of fields.values()) {
          const entry = {
            timestamp,
            streams: tsdata.streams,
            values: tsdata.values
          };

          /* eslint-disable camelcase, max-depth */
          if (id !== null) {
            entry.object_id = id;
          }
          /* eslint-enable camelcase, max-depth */

          timeSeriesData.push(entry);
        }
      }
    }

    return timeSeriesData;
  }

  // Lookup by timestamp, then id to store [streamId, value]
  _addTimestampEntry() {
    // this._data structure
    // timestamp: {
    //   id: {
    //     fieldName: {
    //       streams: []
    //       values: []
    //     }
    //   }
    // }
    if (!this._dataPending()) {
      return;
    }

    // Lookup where to put the value
    let fieldName = 'doubles';
    if (typeof this._value === 'string' || this._value instanceof String) {
      fieldName = 'strings';
    } else if (typeof this._value === 'boolean') {
      fieldName = 'bools';
    }

    // Building up the [(stream, value)] list
    let tsEntry = this._data.get(this._timestamp);
    if (tsEntry) {
      // We have timestamp, now get id
      const idEntry = tsEntry.get(this._id);
      if (idEntry) {
        const fieldEntry = idEntry.get(fieldName);
        if (fieldEntry) {
          // append entry to existing array
          fieldEntry.streams.push(this._streamId);
          fieldEntry.values[fieldName].push(this._value);
        } else {
          idEntry.set(fieldName, this._getFieldEntry(fieldName));
        }
      } else {
        // create new mapping of id -> array of entries
        tsEntry.set(this._id, this._getIdEntry(fieldName));
      }
    } else {
      // No timestamp entry
      // create new id -> array of entries
      // for same id different with fieldNames, we store as different ts entries
      tsEntry = new Map();
      tsEntry.set(this._id, this._getIdEntry(fieldName));
      this._data.set(this._timestamp, tsEntry);
    }
  }

  _getIdEntry(fieldName) {
    const idEntry = new Map();
    idEntry.set(fieldName, this._getFieldEntry(fieldName));
    return idEntry;
  }

  _getFieldEntry(fieldName) {
    return {
      streams: [this._streamId],
      values: {[fieldName]: [this._value]}
    };
  }

  _dataPending() {
    return this._value !== null || this._timestamp !== null || this._id !== null;
  }

  _validate() {
    if (this._dataPending()) {
      super._validate();

      if (this._value === null) {
        this.validateWarn(`Stream ${this._streamId} value is not provided.`);
      }
      if (this._timestamp === null) {
        this.validateWarn(`Stream ${this._streamId} timestamp is not provided.`);
      }
    }
  }

  _flush() {
    this._validate();

    this._addTimestampEntry();
    this._reset();
  }

  // reset the inflight values
  _reset() {
    this._id = null;
    this._value = null;
    this._timestamp = null;
  }
}
