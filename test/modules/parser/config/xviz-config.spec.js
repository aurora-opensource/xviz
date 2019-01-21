import {setXVIZConfig, getXVIZConfig} from '@xviz/parser';
import {resetXVIZConfigAndSettings} from './config-utils';
import test from 'tape-catch';

test('setXVIZConfig', t => {
  const preProcessPrimitive = () => {};
  resetXVIZConfigAndSettings();

  setXVIZConfig({preProcessPrimitive});
  t.is(getXVIZConfig().preProcessPrimitive, preProcessPrimitive, 'XVIZ config is set');
  t.deepEquals(getXVIZConfig().supportedVersions, [1, 2], 'XVIZ default config is used');

  setXVIZConfig({supportedVersions: [1]});
  t.is(
    getXVIZConfig().preProcessPrimitive,
    preProcessPrimitive,
    'XVIZ config preProcessPrimitive is not changed'
  );
  t.deepEquals(getXVIZConfig().supportedVersions, [1], 'XVIZ config is set');

  setXVIZConfig({currentMajorVersion: 2});
  t.is(
    getXVIZConfig().preProcessPrimitive,
    preProcessPrimitive,
    'XVIZ config preProcessPrimitive is not changed'
  );

  t.is(getXVIZConfig().currentMajorVersion, 2, 'XVIZ config currentMajorVersion is set');

  t.end();
});
