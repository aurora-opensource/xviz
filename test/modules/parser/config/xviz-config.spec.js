import {setXvizConfig, getXvizConfig, getXvizSettings, setXvizSettings} from '@xviz/parser';
import test from 'tape-catch';

test('setXvizConfig setXvizSettings', t => {
  const postProcessFrame = () => {};
  setXvizConfig({postProcessFrame});
  t.is(getXvizConfig().postProcessFrame, postProcessFrame, 'XVIZ config is set');
  t.deepEquals(getXvizConfig().supportedVersions, [1, 2], 'XVIZ default config is used');

  setXvizSettings({currentMajorVersion: 2});
  t.is(
    getXvizConfig().postProcessFrame,
    postProcessFrame,
    'XVIZ config postProcessFrame is not changed after setXvizSettings'
  );
  t.notOk(getXvizSettings().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v2');

  setXvizSettings({currentMajorVersion: 1});
  t.ok(getXvizSettings().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v1');

  t.end();
});
