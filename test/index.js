// Set up a configuration (TODO/OSS - this should be a neutral config)
import '../src/loaders/test';

import './src/synchronizers/log-synchronizer.spec';
import './src/synchronizers/stream-synchronizer.spec';
import './src/synchronizers/xviz-stream-buffer.spec';

import './src/parsers/filter-vertices.spec';
import './src/parsers/parse-stream-data-message.spec';

import './src/styles/xviz-style-property.spec';
import './src/styles/xviz-style-parser.spec';

import './src/objects/xviz-object.spec';
import './src/objects/xviz-object-collection.spec';

import './src/utils/worker-utils.spec';
