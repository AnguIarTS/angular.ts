
const path = require('canonical-path');

/**
 * dgService getVersion
 * @description
 * Find the current version of the node module
 */
module.exports = function getVersion(readFilesProcessor) {
  const sourceFolder = path.resolve(readFilesProcessor.basePath, 'node_modules');
  const packageFile = 'package.json';

  return function(component) {
    return require(path.join(sourceFolder, component, packageFile)).version;
  };
};
