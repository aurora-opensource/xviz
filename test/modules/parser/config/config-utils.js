import {setXVIZConfig, getXVIZConfig} from '@xviz/parser';

const defaultXVIZConfig = Object.assign({}, getXVIZConfig());

export function resetXVIZConfigAndSettings() {
  setXVIZConfig(defaultXVIZConfig);
}
