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

import {getProtoEnumTypes, protoEnumsToInts, enumToIntField} from '@xviz/schema';
import {parse} from 'protobufjs';

import test from 'tape-catch';

test('enumToIntEnumField#Good', t => {
  const values = {zip: 0, zap: 1};

  const goodObj = {
    foo: 'zip'
  };

  const expObj = {
    foo: 0
  };

  enumToIntField(values, 'foo', goodObj);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted correct');

  t.end();
});

test('enumToIntEnumField#Bad', t => {
  const badObj = {
    foo: 'doesnotexist'
  };

  t.throws(() => enumToIntField({a: 0}, 'foo', badObj), /Error/, 'Should throw error');

  t.end();
});

const TEST_PROTO_IDL = `syntax = "proto3";
message Test {
  enum Enum {
    zip   = 0;
    zap   = 1;
    sog   = 2;
  }

  Enum foo = 1;
  uint32 other = 2;
}

message Nested {
  Test sub = 1;

  map<string, Test> mapped = 2;
  map<string, uint32> primMap = 3;
  map<string, Test> emptyMap = 4;

  repeated Test list = 5;
  repeated string primList = 6;
  repeated Test emptyList = 7;
}


enum PackageEnum {
  fail  = 0;
  cpp   = 1;
}

message TestPackage {
  PackageEnum foo = 1;
  uint32 other = 2;
}
`;

const TEST_PROTO_ROOT = parse(TEST_PROTO_IDL).root;

const TEST_PROTO_TYPE = TEST_PROTO_ROOT.lookupType('Test');

const ENUM_TYPES = getProtoEnumTypes(TEST_PROTO_ROOT);

test('getProtoEnumTypes', t => {
  const exp = {};
  exp['.PackageEnum'] = {
    fail: 0,
    cpp: 1
  };
  exp['.Test.Enum'] = {
    zip: 0,
    zap: 1,
    sog: 2
  };

  t.deepEquals(exp, ENUM_TYPES, 'Can lookup enum types');

  t.end();
});

test('protoEnumsToInts#Simple', t => {
  const goodObj = {
    foo: 'zip',
    other: 42
  };

  const expObj = {
    foo: 0,
    other: 42
  };

  protoEnumsToInts(TEST_PROTO_TYPE, goodObj, ENUM_TYPES);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted enum');

  t.end();
});

test('protoEnumsToInts#InvalidEnumType', t => {
  const badObj = {
    foo: 'doesnotexist',
    other: 42
  };

  t.throws(
    () => protoEnumsToInts(TEST_PROTO_TYPE, badObj, ENUM_TYPES),
    /Error/,
    'Should throw error'
  );

  t.end();
});

test('protoEnumsToInts#Nested', t => {
  const nestedType = TEST_PROTO_ROOT.lookupType('Nested');

  const nestedObj = {
    sub: {
      foo: 'sog'
    },
    mapped: {
      foo: {
        foo: 'zap',
        other: 42
      }
    },
    list: [
      {
        foo: 'zip'
      }
    ],
    primMap: {a: 4, b: 2},
    primList: ['a', 'b']
  };

  const expectedObj = {
    sub: {
      foo: 2
    },
    mapped: {
      foo: {
        foo: 1,
        other: 42
      }
    },
    list: [
      {
        foo: 0
      }
    ],
    primMap: {a: 4, b: 2},
    primList: ['a', 'b']
  };

  protoEnumsToInts(nestedType, nestedObj, ENUM_TYPES);
  t.deepEqual(nestedObj, expectedObj, 'Converted nested and mapped enums');

  t.end();
});

test('protoEnumsToInts#PackageScopeEnum', t => {
  const goodObj = {
    foo: 'cpp',
    other: 42
  };

  const expObj = {
    foo: 1,
    other: 42
  };

  const testPackageType = TEST_PROTO_ROOT.lookupType('TestPackage');

  protoEnumsToInts(testPackageType, goodObj, ENUM_TYPES);
  t.ok(JSON.stringify(goodObj) === JSON.stringify(expObj), 'Converted enum');

  t.end();
});
