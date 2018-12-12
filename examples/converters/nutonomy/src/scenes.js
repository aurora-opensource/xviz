const path = require('path');
const fs = require('fs');

module.exports = function getAllScenes({inputDir}) {
  let scenes = JSON.parse(fs.readFileSync(path.join(inputDir, 'scene.json'), 'utf8'));
  scenes = scenes.map(scene => Number(scene.name.split('-')[1])).sort((s1, s2) => s1 - s2);
  /* eslint-disable no-console, no-undef */
  console.log(JSON.stringify(scenes));
  /* eslint-enable */
};
