

const {config} = require('../protractor-shared-conf');

config.specs = [
  'app/e2e/**/*.scenario.js'
];

config.capabilities.browserName = 'chrome';

exports.config = config;
