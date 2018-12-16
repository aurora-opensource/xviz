import {parseXVIZPose} from '@xviz/parser/parsers/parse-xviz-pose';

import tape from 'tape-catch';

const testXVIZPose = {
  mapOrigin: {
    longitude: 8.422885,
    latitude: 49.0112128,
    altitude: 112.8349227
  },
  orientation: [0.0210803, -0.009091, -2.1248735],
  position: [20.6404841, -3317.4369679, 518.4297592],
  timestamp: 1172686281.40241
};

function parsedPoseCheck(t, parsedPose, xvizPose) {
  t.equal(parsedPose.x, xvizPose.position[0]);
  t.equal(parsedPose.y, xvizPose.position[1]);
  t.equal(parsedPose.z, xvizPose.position[2]);

  t.equal(parsedPose.roll, xvizPose.orientation[0]);
  t.equal(parsedPose.pitch, xvizPose.orientation[1]);
  t.equal(parsedPose.yaw, xvizPose.orientation[2]);

  t.equal(parsedPose.latitude, xvizPose.mapOrigin.latitude);
  t.equal(parsedPose.longitude, xvizPose.mapOrigin.longitude);
  t.equal(parsedPose.altitude, xvizPose.mapOrigin.altitude);
}

tape('parseXVIZPose#simple', t => {
  const result = parseXVIZPose(testXVIZPose);
  parsedPoseCheck(t, result, testXVIZPose);
  t.end();
});

tape('parseXVIZPose#additionalProperties preserved', t => {
  const additionalPropPose = {
    ...testXVIZPose,
    extraProp: true
  };

  const result = parseXVIZPose(additionalPropPose);
  parsedPoseCheck(t, result, additionalPropPose);
  t.equal(result.extraProp, true);
  t.end();
});
