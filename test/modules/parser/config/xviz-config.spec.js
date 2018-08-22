import {setXvizConfig, getXvizConfig} from '@xviz/parser';
import test from 'tape-catch';

test('setXvizConfig', t => {
  const postProcessFrame = () => {};
  setXvizConfig({postProcessFrame});
  t.is(getXvizConfig().postProcessFrame, postProcessFrame, 'XVIZ config is set');
  t.is(getXvizConfig().version, 2, 'XVIZ default config is used');
  t.notOk(getXvizConfig().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v2');

  setXvizConfig({version: 1});
  t.ok(getXvizConfig().PRIMITIVE_SETTINGS.line2d, 'XVIZ primitive settings is v1');

  t.end();
});
