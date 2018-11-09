import xvizStreamMessages from 'test-data/xviz-stream';
import xvizStylesheet from 'test-data/xviz-style-sheet.json';
// Metadata is the first message
const TestMetadataMessage = xvizStreamMessages[0];
const TestMessage = xvizStreamMessages[1];

import {XVIZStyleParser, parseStreamLogData, XVIZObject} from 'xviz';

const xvizObject = new XVIZObject({id: 1, index: 0});

export default function xvizBench(bench) {
  return bench
    .group('PARSE XVIZ')
    .add('xviz#parseMetadata', () => parseStreamLogData(TestMetadataMessage))

    .add('xviz#parseFrame', () => parseStreamLogData(TestMessage))

    .add('xviz#parse1second', () =>
      xvizStreamMessages.forEach(message => parseStreamLogData(message))
    )

    .add('xviz#parseStylesheet', () => new XVIZStyleParser(xvizStylesheet))

    .add(
      'XVIZObject#_getSemanticColor',
      // setLabel triggers a call to _getSemanticColor
      () => {
        xvizObject._setLabel('OBJECT_LABEL_VEHICLE');
        xvizObject._setLabel('OBJECT_LABEL_BICYCLE');
        xvizObject._setLabel('OBJECT_LABEL_PEDESTRIAN');
      }
    );
}
