import {setXVIZConfig, parseStreamMessage} from '@xviz/parser';

import tape from 'tape-catch';

// xviz data uses snake_case
/* eslint-disable camelcase */

// Metadata is the first message
// const TestMetadataMessage = xvizStreamMessages[0];

// TOOD: blacklisted streams in xviz common
//
tape('parseStreamMessage#import', t => {
  setXVIZConfig({});

  // TODO - issues under Node.js
  // const metaMessage = parseStreamMessage(TestMetadataMessage);

  t.ok(parseStreamMessage, 'parseStreamMessage imported ok');
  t.end();
});
