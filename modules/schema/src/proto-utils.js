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

export function getProtoEnumTypes(protoTypeObj) {
  const enumTypes = {};

  protoTypeObj.nestedArray.map(function store(e) {
    if (e.values !== undefined) {
      // enumTypes[e.name] = e.values;
      enumTypes[e.fullName] = e.values;
    } else if (e.nestedArray !== undefined) {
      Object.assign(enumTypes, getProtoEnumTypes(e));
    }
  });

  return enumTypes;
}
/* eslint-disable */
export function protoEnumsToInts(protoType, jsonObject, enumTypes) {
  if (enumTypes === undefined) {
    throw 'protoEnumsToInts needs defined enumTypes';
  }

  const fields = protoType.fields;

  // Fix up fields
  for (const fieldName in fields) {
    if (fields.hasOwnProperty(fieldName)) {
      const field = fields[fieldName];
      const fieldValue = jsonObject[fieldName];

      const values = lookUpEnumValues(protoType, field.type, enumTypes);
      // console.log(
      //   `${protoType.fullName} ${field.fullName}: ${field.type} values: ${JSON.stringify(values)}`
      // );

      if (values !== undefined) {
        enumToIntField(values, fieldName, jsonObject);
      } else if (field.map) {
        enumToIntMapField(field, jsonObject[fieldName], enumTypes);
      } else if (field.repeated) {
        enumToIntRepeatedField(field, jsonObject[fieldName], enumTypes);
      } else if (typeof fieldValue === 'object') {
        enumToIntMessageField(field, fieldValue, enumTypes);
      }
    }
  }
}

/**
 * protobuf.js does not use fully qualified type names in it's reflection
 * information for enums.  So we have to replicate it's enum rules.
 */
function lookUpEnumValues(protoType, fieldType, enumTypes) {
  // First tree class scope
  let values = enumTypes[`${protoType.fullName}.${fieldType}`];

  if (values === undefined) {
    // Then package scope
    values = enumTypes[`${protoType.parent.fullName}.${fieldType}`];
  }

  return values;
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

function enumToIntMessageField(field, jsonObject, enumTypes) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);
    protoEnumsToInts(subType, jsonObject, enumTypes);
  }
}

function enumToIntMapField(field, jsonObject, enumTypes) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonObject !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (const propertyName in jsonObject) {
      if (jsonObject.hasOwnProperty(propertyName)) {
        const propertyValue = jsonObject[propertyName];
        protoEnumsToInts(subType, propertyValue, enumTypes);
      }
    }
  }
}

function enumToIntRepeatedField(field, jsonArray, enumTypes) {
  if (!PRIMITIVE_PROTO_TYPES.has(field.type) && jsonArray !== undefined) {
    const subType = field.parent.lookupType(field.type);

    for (let i = 0; i < jsonArray.length; i++) {
      protoEnumsToInts(subType, jsonArray[i], enumTypes);
    }
  }
}
