import {Validator} from 'jsonschema';
import vehiclePoseSchema from '@xviz/schema/vehicle-pose.json';

const validator = new Validator();
validator.addSchema(vehiclePoseSchema);

export default function validate(instance, schemaName, options) {
  const result = validator.validate(instance, {$ref: schemaName}, options);
  return result.valid;
}
