// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const TARGETS = {
  "chrome": "60",
  "edge": "15",
  "firefox": "53",
  "ios": "10.3",
  "safari": "10.1",
  "node": "8"
};

const CONFIG = {
  default: {
    "presets": [
      [ "@babel/env", {
        "targets": TARGETS
      }]
    ],
    "plugins": [
      "version-inline",
      "@babel/proposal-class-properties"
    ],
  }
};

CONFIG.es6 = Object.assign({}, CONFIG.default, {
  "presets": [
    [ "@babel/env", {
      "targets": TARGETS,
      "modules": false
    }]
  ]
});

CONFIG.esm = Object.assign({}, CONFIG.default, {
  "presets": [
    [ "@babel/env", {
      "modules": false
    }]
  ]
});

CONFIG.es5 = Object.assign({}, CONFIG.default, {
  "presets": [
    [ "@babel/env", {
      "modules": "commonjs"
    }]
  ],
});

CONFIG.cover = Object.assign({}, CONFIG.default);
CONFIG.cover.plugins = CONFIG.cover.plugins.concat(['istanbul']);

module.exports = function getConfig(api) {

  // eslint-disable-next-line
  var env = api.cache(() => process.env.BABEL_ENV || process.env.NODE_ENV);

  const config = CONFIG[env] || CONFIG.default;
  // Uncomment to debug
  console.error(env, config.plugins);
  return config;
};

module.exports.config = CONFIG.es6;
