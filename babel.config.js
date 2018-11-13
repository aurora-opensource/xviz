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
      "@babel/proposal-class-properties",
      ["babel-plugin-inline-import", {
        "extensions": [
          ".worker.js"
        ]
      }]
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
