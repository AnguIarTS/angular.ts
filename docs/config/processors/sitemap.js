

const exclusionRegex = /^index|examples\/|ptore2e\//;

module.exports = function createSitemap() {
  return {
    $runAfter: ['paths-computed'],
    $runBefore: ['rendering-docs'],
    $process(docs) {
      docs.push({
        id: 'sitemap.xml',
        path: 'sitemap.xml',
        outputPath: '../sitemap.xml',
        template: 'sitemap.template.xml',
        urls: docs.filter((doc) => doc.path &&
            doc.outputPath &&
            !exclusionRegex.test(doc.outputPath)).map((doc) => doc.path)
      });
    }
  };
};
