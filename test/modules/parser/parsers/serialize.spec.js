import tape from 'tape-catch';
import {preSerialize, postDeserialize} from '@xviz/parser/parsers/serialize';
import {LOG_STREAM_MESSAGE} from '@xviz/parser';

const MESSAGE = {
  type: LOG_STREAM_MESSAGE.TIMESLICE,
  // TODO - need to add object stream
  streams: {}
};

tape('preSerialize', t => {
  const result = preSerialize(MESSAGE);
  t.deepEquals(result, MESSAGE, 'preSerialize returned expected result');
  t.end();
});

tape('postDeserialize', t => {
  const result = postDeserialize(MESSAGE);
  t.deepEquals(result, MESSAGE, 'postDeserialize returned expected result');
  t.end();
});
