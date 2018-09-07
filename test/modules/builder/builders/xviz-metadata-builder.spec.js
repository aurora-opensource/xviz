/* eslint-disable */
import test from 'tape-catch';
import {XVIZMetadataBuilder} from '@xviz/builder';

function almostEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a - b) < tolerance;
}

test('XVIZMetadataBuilder#default-ctor', t => {
  const xb = new XVIZMetadataBuilder();
  t.ok(xb, 'Created new XVIZMetadataBuilder');
  t.end();
});

test('XVIZMetadataBuilder#build', t => {
  const xb = new XVIZMetadataBuilder();
  xb.startTime(0).endTime(1);

  const metadata = xb.getMetadata();

  t.comment(JSON.stringify(metadata));

  const expected = {
    type: 'metadata',
    streams: {},
    styles: {},
    start_time: 0,
    end_time: 1
  };

  t.deepEqual(metadata, expected, 'XVIZMetadataBuilder build matches expected output');
  t.end();
});
