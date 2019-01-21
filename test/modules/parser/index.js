// Set up a configuration (TODO/OSS - this should be a neutral config)
import './config/xviz-config.spec';

import './synchronizers/log-synchronizer.spec';
import './synchronizers/stream-synchronizer.spec';
import './synchronizers/xviz-stream-buffer.spec';

import './parsers/filter-vertices.spec';
import './parsers/parse-log-metadata.spec';
import './parsers/parse-stream-data-message.spec';
import './parsers/parse-stream-message.spec';
import './parsers/parse-vehicle-pose.spec';
import './parsers/parse-xviz-pose.spec';
import './parsers/parse-xviz-stream.spec';
import './parsers/serialize.spec';
import './parsers/xviz-v2-common.spec';

import './styles/xviz-style-property.spec';
import './styles/xviz-style-parser.spec';

import './objects/base-object.spec';
import './objects/sdv.spec';
import './objects/xviz-object.spec';
import './objects/xviz-object-collection.spec';

import './utils/worker-utils.spec';
import './utils/search.spec';
