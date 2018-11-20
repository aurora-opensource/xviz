import {setXVIZConfig, getXVIZConfig, getXVIZSettings, setXVIZSettings} from '@xviz/parser';
import {resetXVIZConfigAndSettings} from './config-utils';
import test from 'tape-catch';

test('setXVIZConfig setXVIZSettings', t => {
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

  setXVIZSettings({currentMajorVersion: 2});
  t.is(
    getXVIZConfig().preProcessPrimitive,
    preProcessPrimitive,
    'XVIZ config preProcessPrimitive is not changed after setXVIZSettings'
  );

  t.is(getXVIZSettings().currentMajorVersion, 2, 'XVIZ settings is set');

  t.end();
});
