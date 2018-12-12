import {quaternionToEulerAngle} from '../common';
import {_getRelativeCoordinates as getRelativeCoordinates} from '@xviz/builder';

/**
 * Parse object data and decorate with static metadata from instances.json
 * @param objects, each object is a moving instance with its dynamic data of current frame
 * @param instances, map of all the instances static metadata
 * @returns {object} An object map organized by sample_token and instance_token
 *        {[sample_token]: {[instance_token]: {}} }
 */
export function loadObjects(objects, instances) {
  return objects.reduce((resMap, object) => {
    if (!resMap[object.sample_token]) {
      resMap[object.sample_token] = {};
    }

    // sample_token is unique id for a log sample
    // instance_token is unique id for an object across different frames of the sample
    resMap[object.sample_token][object.instance_token] = parseObjectMetadata(object, instances);
    return resMap;
  }, {});
}

function parseObjectMetadata(object, instances) {
  const {translation, rotation, size} = object;
  const {roll, pitch, yaw} = quaternionToEulerAngle(...rotation);
  const instance = instances[object.instance_token];

  const category = instance.category;
  const bounds = [
    [-size[1] / 2, -size[0] / 2, 0],
    [-size[1] / 2, size[0] / 2, 0],
    [size[1] / 2, size[0] / 2, 0],
    [size[1] / 2, -size[0] / 2, 0],
    [-size[1] / 2, -size[0] / 2, 0]
  ];

  const poseProps = {
    x: translation[0],
    y: translation[1],
    z: translation[2],
    roll,
    pitch,
    yaw
  };

  return {
    ...object,
    ...poseProps,
    category,
    bounds,
    vertices: getRelativeCoordinates(bounds, poseProps)
  };
}
