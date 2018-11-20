import {setXVIZConfig, getXVIZConfig, getXVIZSettings, setXVIZSettings} from '@xviz/parser';

const defaultXVIZConfig = Object.assign({}, getXVIZConfig());
const defaultXVIZSettings = Object.assign({}, getXVIZSettings());

export function resetXVIZConfigAndSettings() {
  setXVIZConfig(defaultXVIZConfig);
  setXVIZSettings(defaultXVIZSettings);
}
