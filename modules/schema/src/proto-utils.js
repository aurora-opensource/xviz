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

const PRIMITIVE_PROTO_TYPES = new Set([
  'double',
  'float',
  'int32',
  'int64',
  'uint32',
  'uint64',
  'sint32',
  'sint64',
  'fixed32',
  'fixed64',
  'sfixed32',
  'sfixed64',
  'bool',
  'string',
  'bytes'
]);

export function protoEnumsToInts(protoType, jsonObject) {
  const enumTypes = {};

  protoType.nestedArray.map(function store(e) {
    enumTypes[e.name] = e.values;
    return e;
  });

  const fields = protoType.fields;

  // Fix up fields
  for (const fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const fieldValue = jsonObject[fieldName];

      const values = enumTypes[field.type];

      if (values !== undefined) {
        enumToIntField(values, fieldName, jsonObject);
      } else if (field.map) {
        enumToIntMapField(field, jsonObject[fieldName]);
      } else if (field.repeated) {
        enumToIntRepeatedField(field, jsonObject[fieldName]);
      } else if (typeof fieldValue === 'object') {
        enumToIntMessageField(field, fieldValue);
      }
    }
  }
}

export function enumToIntField(values, fieldName, jsonObject) {
  const originalValue = jsonObject[fieldName];

  if (originalValue !== undefined) {
    const newValue = values[originalValue];

    if (newValue === undefined) {
      const msg = `Error: field "${fieldName}" has unknown enum value "${originalValue}"`;
      throw new Error(msg);
    }

    jsonObject[fieldName] = newValue;
  }
}

function enumToIntMessageField(field, jsonObject) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);
    protoEnumsToInts(subType, jsonObject);
  }
}

function enumToIntMapField(field, jsonObject) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (const propertyName in jsonObject) {
      if (jsonObject.hasOwnProperty(propertyName)) {
        const propertyValue = jsonObject[propertyName];
        protoEnumsToInts(subType, propertyValue);
      }
    }
  }
}

function enumToIntRepeatedField(field, jsonArray) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonArray !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (let i = 0; i < jsonArray.length; i++) {
      protoEnumsToInts(subType, jsonArray[i]);
    }
  }
}
