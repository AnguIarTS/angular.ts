

const path = require('canonical-path');

/**
 * @dgService minErrInfo
 * @description
 * Load the error information that was generated during the AngularJS build.
 */
module.exports = function getMinerrInfo(readFilesProcessor) {
  return function() {
    const minerrInfoPath = path.resolve(readFilesProcessor.basePath, 'build/errors.json');
    return require(minerrInfoPath);
  };
};
