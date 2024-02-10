

const _ = require('lodash');

/**
 * @dgProcessor generateIndexPagesProcessor
 * @description
 * This processor creates docs that will be rendered as the index page for the app
 */
module.exports = function generateIndexPagesProcessor() {
  return {
    deployments: [],
    $validate: {
      deployments: { presence: true }
    },
    $runAfter: ['adding-extra-docs'],
    $runBefore: ['extra-docs-added'],
    $process(docs) {

      // Collect up all the areas in the docs
      let areas = {};
      docs.forEach((doc) => {
        if (doc.area) {
          areas[doc.area] = doc.area;
        }
      });
      areas = _.keys(areas);

      this.deployments.forEach((deployment) => {

        const indexDoc = _.defaults({
          docType: 'indexPage',
          areas
        }, deployment);

        indexDoc.id = `index${  deployment.name === 'default' ? '' : `-${  deployment.name}`}`;

        docs.push(indexDoc);
      });
    }
  };
};
