import {setXvizConfig, parseVehiclePose} from '@xviz/parser';
import {getTransformsFromPose} from '@xviz/parser/parsers/parse-vehicle-pose';

import tape from 'tape-catch';
import vehiclePose from 'test-data/sample-vehicle-pose';

tape('parseVehiclePose#import', t => {
  setXvizConfig({});

  t.ok(parseVehiclePose, 'parseVehiclePose imported ok');

  const result = parseVehiclePose([vehiclePose]);
  t.ok(result);

  t.end();
});

tape('parseVehiclePose#getTransformsFromPose', t => {
  const result = getTransformsFromPose(vehiclePose);
  t.equal(result, null);

  t.end();
});
