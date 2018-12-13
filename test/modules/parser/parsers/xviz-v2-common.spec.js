import {
  parseVersionString,
  unFlattenVertices,
  ensureUnFlattenedVertices
} from '@xviz/parser/parsers/xviz-v2-common';

import tape from 'tape-catch';

function validateVersion(t, result, major, minor, patch) {
  t.equal(result.major, major, `major is ${major}`);
  t.equal(result.minor, minor, `minor is ${minor}`);
  t.equal(result.patch, patch, `patch is ${patch}`);
}

tape('XVIZ V2 Common#parseVersionString empty string', t => {
  const result = parseVersionString('');
  validateVersion(t, result, null, null, null);
  t.end();
});

tape('XVIZ V2 Common#parseVersionString valid strings', t => {
  let result = parseVersionString('1');
  validateVersion(t, result, 1, null, null);

  result = parseVersionString('1.2');
  validateVersion(t, result, 1, 2, null);

  result = parseVersionString('1.2.3');
  validateVersion(t, result, 1, 2, 3);

  result = parseVersionString('1.2.3-pre');
  validateVersion(t, result, 1, 2, 3);

  result = parseVersionString('.2.3');
  validateVersion(t, result, null, 2, 3);

  t.end();
});

tape(
  'XVIZ V2 Common#parseVersionString strings that should fail with proper semver validation',
  t => {
    let result = parseVersionString('-1');
    validateVersion(t, result, -1, null, null);

    result = parseVersionString('+1');
    validateVersion(t, result, 1, null, null);

    result = parseVersionString('.2.2');
    validateVersion(t, result, null, 2, 2);

    t.end();
  }
);

tape('XVIZ V2 Common#parseVersionString invalid strings', t => {
  let result = parseVersionString('^1');
  t.ok(Number.isNaN(result.major), `major is NaN`);

  result = parseVersionString('1-2-3');
  validateVersion(t, result, 1, null, null);

  t.end();
});

tape('XVIZ V2 Common#unFlattenVertices', t => {
  const input = [1, 2, 3, 4, 5, 6];
  const expected = [[1, 2, 3], [4, 5, 6]];

  t.deepEqual(unFlattenVertices(input), expected, 'vertices inflated');
  t.end();
});

tape('XVIZ V2 Common#ensureUnFlattenedVertices', t => {
  const input = [1, 2, 3, 4, 5, 6];
  const expected = [[1, 2, 3], [4, 5, 6]];

  t.deepEqual(ensureUnFlattenedVertices(input), expected, 'vertices inflated');
  t.deepEqual(ensureUnFlattenedVertices(expected), expected, 'vertices unchanged');
  t.end();
});
