import {setXVIZConfig, getXVIZConfig, getXVIZSettings, setXVIZSettings} from '@xviz/parser';
import test from 'tape-catch';

test('setXVIZConfig setXVIZSettings', t => {
  const postProcessFrame = () => {};
  setXVIZConfig({postProcessFrame});
  t.is(getXVIZConfig().postProcessFrame, postProcessFrame, 'XVIZ config is set');
  t.deepEquals(getXVIZConfig().supportedVersions, [1, 2], 'XVIZ default config is used');

  setXVIZSettings({currentMajorVersion: 2});
  t.is(
    getXVIZConfig().postProcessFrame,
    postProcessFrame,
    'XVIZ config postProcessFrame is not changed after setXVIZSettings'
  );

  t.is(getXVIZSettings().currentMajorVersion, 2, 'XVIZ settings is set');

  t.end();
});
