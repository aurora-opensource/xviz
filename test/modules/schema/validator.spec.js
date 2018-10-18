import {XVIZValidator} from '@xviz/schema';

import test from 'tape-catch';

test('validateConstruct', t => {
  const validator = new XVIZValidator();

  t.ok(validator.schemaCount() > 0, 'we have schemas');

  t.end();
});

test('validateMetadata', t => {
  const validator = new XVIZValidator();

  validator.validateMetadata({version: '2.0.0'});

  t.throws(
    () => validator.validateMetadata({bob: 'metadata'}),
    /error/,
    'Should throw validation error'
  );

  t.end();
});

test('validateStateUpdate', t => {
  const validator = new XVIZValidator();

  // We use inline JSON here because are members are not camelCase
  // and prettier gets quite angry about that.
  validator.validateStateUpdate(
    JSON.parse(`
{
  "update_type": "incremental",
  "updates": [{
    "timestamp": 1,
    "primitives": {}
  }]
}`)
  );

  t.throws(() => validator.validateStateUpdate({}), /error/, 'Should throw validation error');

  t.end();
});

test('validateStreamSet', t => {
  const validator = new XVIZValidator();

  validator.validateStreamSet({timestamp: 1.2, primitives: {}});

  t.throws(() => validator.validateStreamSet({}), /error/, 'Should throw validation error');

  t.end();
});

test('validatePose', t => {
  const validator = new XVIZValidator();

  validator.validatePose({
    timestamp: 1001.3,
    mapOrigin: {
      longitude: 40.4641969,
      latitude: -79.9733218,
      altitude: 219
    },
    position: [238.4, 1002.5, 5.0],
    orientation: [0.5, 10.0, 84.5]
  });

  t.throws(
    () =>
      validator.validatePose({
        timestamp: 1001.3,
        mapOrigin: [40.4641969, -79.9733218, 219],
        position: [238.4, 1002.5, 5.0],
        orientation: [0.5, 10.0, 84.5]
      }),
    /error/,
    'Should throw validation error'
  );

  t.end();
});

test('validatePrimitive', t => {
  const validator = new XVIZValidator();

  validator.validatePrimitive('point', {
    points: [[1, 2, 3], [1, 2, 3]]
  });

  t.throws(
    () =>
      validator.validatePrimitive('point', {
        points: [[1, 2, 3], [1, 2, 3]],
        bad: 'field'
      }),
    /error/,
    'Should not validate'
  );

  // Ensure we get an error when we try a type that does not exist
  t.throws(
    () => validator.validatePrimitive('doesnotexist', {}),
    /Could not load/,
    'Should not validate'
  );

  t.end();
});

test('validateTimeSeries', t => {
  const validator = new XVIZValidator();

  validator.validateTimeSeries({
    timestamp: 12345.5,
    values: [['/vehicle/torque/commanded', 5], ['/vehicle/torque/actual', 4.8]]
  });

  t.throws(
    () =>
      validator.validateTimeSeries({
        timestamp: 'foo',
        values: [['/vehicle/torque/commanded', 5], ['/vehicle/torque/actual', 4.8]]
      }),
    /error/,
    'Should not validate'
  );

  t.end();
});

test('validateFutureInstances', t => {
  const validator = new XVIZValidator();

  validator.validateFutureInstances(
    JSON.parse(`
{
  "timestamps": [1.0, 1.1],
  "primitives": [
    [{"points": [[1, 2, 3]]}],
    [{"points": [[1.5, 2, 3]]}]
  ]
}`)
  );

  t.throws(() => validator.validateFutureInstances({}), /error/, 'Should not validate');

  t.end();
});

test('validateVariable', t => {
  const validator = new XVIZValidator();

  validator.validateVariable({
    values: [1, 2, 3]
  });

  t.throws(
    () =>
      validator.validateVariable({
        values: 'bob'
      }),
    /error/,
    'Should not validate'
  );

  t.end();
});

test('validateAnnotation', t => {
  const validator = new XVIZValidator();

  validator.validateAnnotation(
    'visual',
    JSON.parse(`
{
  "object_id": "{317d719e-f95a-49a7-91fc-3706b2eeb5c2}",
  "style_classes": [
    "unimportant"
  ]
}`)
  );

  t.throws(
    () =>
      validator.validateAnnotation('visual', {
        points: [[1, 2, 3], [1, 2, 3]],
        bad: 'field'
      }),
    /error/,
    'Should not validate'
  );

  // Ensure we get an error when we try a type that does not exist
  t.throws(
    () => validator.validateAnnotation('doesnotexist', {}),
    /Could not load/,
    'Should not validate'
  );

  t.end();
});

test('validateGeneric', t => {
  const validator = new XVIZValidator();

  // Straight validate
  validator.validate('primitives/point.schema.json', {points: [[1, 2, 3]]});

  // Normal validation
  validator.validate('primitives/point', {points: [[1, 2, 3]]});

  t.throws(
    () => validator.validate('primitives/point.schema.json', {points: {}}),
    /error/,
    'Should throw validation error'
  );

  t.end();
});
