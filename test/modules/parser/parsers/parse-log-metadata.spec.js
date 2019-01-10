import {parseLogMetadata} from '@xviz/parser';
import metadataMessageV1 from 'test-data/sample-metadata-message-v1';
import metadataMessageV2 from 'test-data/sample-metadata-message';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

tape('parseLogMetadata', t => {
  let result;

  t.comment('parse v1 metadata');
  result = parseLogMetadata(metadataMessageV1);
  t.ok(result.eventStartTime && result.eventEndTime, 'polulated timestamps');
  t.is(result.map, metadataMessageV1.map, 'kept custom fields');

  t.comment('parse v2 metadata');
  result = parseLogMetadata(metadataMessageV2);
  t.ok(result.eventStartTime && result.eventEndTime, 'polulated timestamps');
  t.is(result.map_info, metadataMessageV2.map_info, 'kept custom fields');

  result = parseLogMetadata({
    version: '2.0.0',
    log_info: {
      start_time: 0,
      end_time: 10
    }
  });
  t.is(result.start_time, 0, 'handles start_time 0')

  const metadata = {...metadataMessageV2};
  delete metadata.streams;

  // verify if no 'streams' in source data, the empty object is in output
  result = parseLogMetadata(metadata);

  t.deepEqual(result.streams, {}, 'handles missing streams');
  t.end();
});
