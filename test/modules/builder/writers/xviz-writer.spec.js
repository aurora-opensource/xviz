/* eslint-disable camelcase */
import test from 'tape-catch';
import {XVIZWriter} from '@xviz/builder';

const SAMPLE_METADATA = {
  log_info: {
    start_time: 1,
    end_time: 2
  }
};

const SAMPLE_STATE_UPDATE = {
  updates: [
    {
      timestamp: 100
    }
  ]
};

class MemorySink {
  constructor() {
    this.data = new Map();
  }

  _key(scope, name) {
    return `${scope}/${name}`;
  }

  writeSync(scope, name, data) {
    const key = this._key(scope, name);
    this.data.set(key, data);
  }

  has(scope, name) {
    return this.data.has(this._key(scope, name));
  }

  get(scope, name) {
    return this.data.get(this._key(scope, name));
  }
}

test('XVIZWriter#default-ctor', t => {
  /* eslint-disable no-unused-vars */
  // Ensure no parameter ctor
  const builder = new XVIZWriter();
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZWriter#default-ctor sink', t => {
  /* eslint-disable no-unused-vars */
  const builder = new XVIZWriter({dataSink: new MemorySink()});
  t.end();
  /* eslint-enable no-unused-vars */
});

test('XVIZWriter#writeMetadata empty', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false, binary: true, json: true});

  const data = {};
  builder.writeMetadata('test', data);

  t.ok(sink.has('test', '1-frame.json'), 'wrote json metadata frame');
  t.ok(sink.has('test', '1-frame.glb'), 'wrote binary metadata frame');
  t.deepEquals(JSON.parse(sink.get('test', '1-frame.json')), data, 'json metadata fetched matches');
  t.end();
});

test('XVIZWriter#writeMetadata empty, write options off', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false, binary: false, json: false});

  const data = {};
  builder.writeMetadata('test', data);

  t.not(sink.has('test', '1-frame.json'), 'did not write json metadata frame');
  t.not(sink.has('test', '1-frame.glb'), 'did not write binary metadata frame');
  t.end();
});

test('XVIZWriter#writeMetadata', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false, binary: true, json: true});

  const data = SAMPLE_METADATA;

  builder.writeMetadata('test', data);

  t.ok(sink.has('test', '1-frame.json'), 'wrote json metadata frame');
  t.ok(sink.has('test', '1-frame.glb'), 'wrote binary metadata frame');
  t.deepEquals(JSON.parse(sink.get('test', '1-frame.json')), data, 'json metadata fetched matches');
  t.end();
});

test('XVIZWriter#writeMetadataEnvelope', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: true, binary: false, json: true});

  const data = SAMPLE_METADATA;

  const expected = {
    type: 'xviz/metadata',
    data
  };

  builder.writeMetadata('test', data);

  t.ok(sink.has('test', '1-frame.json'), 'wrote json metadata frame');
  t.deepEquals(
    JSON.parse(sink.get('test', '1-frame.json')),
    expected,
    'json metadata fetched matches'
  );
  t.end();
});

test('XVIZWriter#writeFrame missing updates', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false});

  const data = {};

  t.throws(
    () => builder.writeFrame('test', 0, data),
    /Cannot find timestamp/,
    'Throws if missing updates'
  );
  t.end();
});

test('XVIZWriter#writeFrame updates missing timestamp', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false});

  const data = {
    updates: []
  };

  t.throws(
    () => builder.writeFrame('test', 0, data),
    /XVIZ updates did not contain/,
    'Throws if updates missing timestamp'
  );
  t.end();
});

test('XVIZWriter#writeFrame', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false, binary: false, json: true});

  const data = SAMPLE_STATE_UPDATE;

  builder.writeFrame('test', 0, data);

  t.ok(sink.has('test', '2-frame.json'), 'wrote json frame');
  t.deepEquals(JSON.parse(sink.get('test', '2-frame.json')), data, 'json frame fetched matches');
  t.end();
});

test('XVIZWriter#writeFrameEnveloped', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: true, binary: false, json: true});

  const data = SAMPLE_STATE_UPDATE;
  const expected = {
    type: 'xviz/state_update',
    data
  };

  builder.writeFrame('test', 0, data);

  t.ok(sink.has('test', '2-frame.json'), 'wrote json frame');
  t.deepEquals(
    JSON.parse(sink.get('test', '2-frame.json')),
    expected,
    'json frame fetched matches'
  );
  t.end();
});

test('XVIZWriter#default-ctor frames writeFrameIndex', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false});

  const data = SAMPLE_STATE_UPDATE;

  builder.writeFrame('test', 0, data);
  builder.writeFrameIndex('test');

  t.ok(sink.has('test', '0-frame.json'), 'wrote index for frames');

  const expected = {
    timing: [[100, 100, 0, '2-frame']]
  };

  t.deepEquals(
    JSON.parse(sink.get('test', '0-frame.json')),
    expected,
    'json index matches expected'
  );
  t.end();
});

test('XVIZWriter#default-ctor frames writeFrame after writeFrameIndex', t => {
  const sink = new MemorySink();
  const builder = new XVIZWriter({dataSink: sink, envelope: false});

  const data = SAMPLE_STATE_UPDATE;

  builder.writeFrame('test', 0, data);
  builder.writeFrameIndex('test');
  t.throws(
    () => builder.writeFrame('test', 1, data),
    /was called after.*last frame of 2-frame/,
    'throws if writeFrame() called after writeFrameIndex()'
  );

  t.end();
});
