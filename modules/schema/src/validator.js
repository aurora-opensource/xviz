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

// See: https://github.com/epoberezkin/ajv/issues/687
import Ajv from 'ajv';
import {SCHEMA_DATA} from './data';

export class ValidationError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, ValidationError);
  }
}

export class XVIZValidator {
  constructor() {
    this.ajv = newAjv();

    for (const schemaName in SCHEMA_DATA) {
      const schemaData = SCHEMA_DATA[schemaName];

      this.ajv.addSchema(schemaData, schemaName);
    }
  }

  // Highest level objects
  validateMetadata(data) {
    this.validate('session/metadata.schema.json', data);
  }

  validateStateUpdate(data) {
    this.validate('session/state_update.schema.json', data);
  }

  // Core object
  validateStreamSet(data) {
    this.validate('core/stream_set.schema.json', data);
  }

  // Type level validation
  validatePose(data) {
    this.validate(`core/pose.schema.json`, data);
  }

  validatePrimitive(type, data) {
    this.validate(`primitives/${type}.schema.json`, data);
  }

  validateTimeSeries(data) {
    this.validate('core/timeseries_state.schema.json', data);
  }

  validateFutureInstances(data) {
    this.validate('core/future_instances.schema.json', data);
  }

  validateVariable(data) {
    this.validate('core/variable.schema.json', data);
  }

  validateAnnotation(type, data) {
    this.validate(`core/annotation_${type}.schema.json`, data);
  }

  // utility methods
  validate(schemaName, data) {
    const schemaValidator = this._getSchema(schemaName);

    if (schemaValidator === undefined) {
      const error = `Could not load schema: ${schemaName}`;
      throw error;
    }

    const valid = schemaValidator(data);

    if (!valid) {
      const errorDescription = JSON.stringify(schemaValidator.errors, null, '  ');
      throw new ValidationError(`Validation errors: ${errorDescription}`);
    }
  }

  schemaCount() {
    return Object.keys(this.ajv._schemas).length;
  }

  hasSchema(schemaName) {
    return this._getSchema(schemaName) !== undefined;
  }

  _getSchema(schemaName) {
    if (!schemaName.endsWith('.schema.json')) {
      schemaName += '.schema.json';
    }

    return this.ajv.getSchema(schemaName);
  }
}

export function newAjv() {
  const validator = newAjvDraft4();
  return validator;
}

// Draft 4 schema is more widely supported, but requires special
// construction
function newAjvDraft4() {
  const ajv = new Ajv({
    meta: false, // Prevent loading future schemas
    schemaId: 'id', // needed because we use 'id' in draft-04
    extendRefs: 'fail' // Be more strict, don't allow ref extension
  });

  const metaSchema = require('ajv/lib/refs/json-schema-draft-04.json');
  ajv.addMetaSchema(metaSchema);
  ajv._opts.defaultMeta = metaSchema.id;

  // Disable keywords defined in future drafts
  ajv.removeKeyword('propertyNames');
  ajv.removeKeyword('contains');
  ajv.removeKeyword('const');

  return ajv;
}
