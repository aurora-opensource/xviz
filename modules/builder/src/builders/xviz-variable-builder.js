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
 * XVIZVariableBuilder manages a dictionary of streams -> variables, where
 * variables is an array of objects with values & id.
 *
 * This is the shape returned from getData()
 *
 * {
 *   /plan/time: {
 *     variables: [
 *       {
 *         base: {
 *           object_id: '123'
 *         },
 *         values: [1, 2, 3, 4],
 *       }
 *     ]
 *   }
 * }
 */
export default class XVIZVariableBuilder extends XVIZBaseBuilder {
  constructor(props) {
    super({
      ...props,
      category: CATEGORY.VARIABLE
    });

    // Stores variable data by stream then id
    // They will then be group when constructing final object
    this._data = new Map();

    // inflight builder data
    this._id = null;
    this._values = null;
  }

  id(identifier) {
    this.validatePropSetOnce('_id');
    this._id = identifier;
    return this;
  }

  values(values) {
    this.validatePropSetOnce('_values');

    if (!(values instanceof Array)) {
      this.validateError('Input `values` must be array');
    }

    this._values = values;
    return this;
  }

  getData() {
    this._flush();
    if (this._data.size === 0) {
      return null;
    }

    const variablesData = {};
    for (const [streamId, ids] of this._data) {
      const variables = [];
      ids.forEach(entry => variables.push(entry));
      variablesData[streamId] = {variables};
    }

    return variablesData;
  }

  // Lookup by stream, then id to store [values, id]]
  _addVariableEntry() {
    if (!this._dataPending()) {
      return;
    }

    // Lookup where to put the value
    let fieldName = 'doubles';
    const value = this._values[0];
    if (typeof value === 'string' || value instanceof String) {
      fieldName = 'strings';
    } else if (typeof value === 'boolean') {
      fieldName = 'bools';
    }

    const entry = {values: {[fieldName]: this._values}};
    if (this._id) {
      entry.base = {object_id: this._id}; // eslint-disable-line camelcase
    }

    const streamEntry = this._data.get(this._streamId);
    if (streamEntry) {
      // We have stream, now get id
      const idEntry = streamEntry.get(this._id);
      if (idEntry) {
        // already have values for this objet
        this.validateError(`Input \`values\` already set for id ${this._id}`);
      } else {
        // create new mapping of id -> entry
        streamEntry.set(this._id, entry);
      }
    } else {
      // No stream
      // create new stream -> id
      const idEntry = new Map();
      idEntry.set(this._id, entry);
      // create stream entry
      this._data.set(this._streamId, idEntry);
    }
  }

  _dataPending() {
    return this._values !== null || this._id !== null;
  }

  _validate() {
    if (this._dataPending()) {
      super._validate();

      if (this._values === null) {
        this.validateWarn(`Stream${this._streamId} values are not provided.`);
      }
    }
  }

  _flush() {
    this._validate();

    this._addVariableEntry();
    this._reset();
  }

  // reset the inflight values
  _reset() {
    this._id = null;
    this._values = null;
  }
}
