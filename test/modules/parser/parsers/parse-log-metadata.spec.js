import {parseLogMetadata} from '@xviz/parser';
import metadataMessage from 'test-data/sample-metadata-message';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

tape('parseLogMetadata#streams is empty object', t => {
  const metadata = {...metadataMessage};
  delete metadata.streams;

  // verify if no 'streams' in source data, the empty object is in output
  const result = parseLogMetadata(metadata);

  t.deepEqual(result.streams, {}, '"streams" is empty object');
  t.end();
});
