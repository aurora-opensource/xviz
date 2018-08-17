'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./validate.prod.js');
} else {
  module.exports = require('./validate.dev.js');
}
