

const _ = require('lodash');
const fs = require('fs');
const path = require('canonical-path');

/**
 * @dgProcessor generateKeywordsProcessor
 * @description
 * This processor extracts all the keywords from each document and creates
 * a new document that will be rendered as a JavaScript file containing all
 * this data.
 */
module.exports = function generateKeywordsProcessor(log, readFilesProcessor) {
  return {
    ignoreWordsFile: undefined,
    areasToSearch: ['api', 'guide', 'misc', 'error', 'tutorial'],
    propertiesToIgnore: [],
    docTypesToIgnore: [],
    $validate: {
      ignoreWordsFile: { },
      areasToSearch: { presence: true },
      docTypesToIgnore: { },
      propertiesToIgnore: {  }
    },
    $runAfter: ['memberDocsProcessor'],
    $runBefore: ['rendering-docs'],
    $process(docs) {

      // Keywords to ignore
      let wordsToIgnore = [];
      let propertiesToIgnore;
      let docTypesToIgnore;
      let areasToSearch;

      // Keywords start with "ng:" or one of $, _ or a letter
      const KEYWORD_REGEX = /^((ng:|[$_a-z])[\w\-_]+)/;

      // Load up the keywords to ignore, if specified in the config
      if (this.ignoreWordsFile) {

        const ignoreWordsPath = path.resolve(readFilesProcessor.basePath, this.ignoreWordsFile);
        wordsToIgnore = fs.readFileSync(ignoreWordsPath, 'utf8').toString().split(/[,\s\n\r]+/gm);

        log.debug(`Loaded ignore words from "${  ignoreWordsPath  }"`);
        log.silly(wordsToIgnore);

      }

      areasToSearch = _.keyBy(this.areasToSearch);
      propertiesToIgnore = _.keyBy(this.propertiesToIgnore);
      log.debug('Properties to ignore', propertiesToIgnore);
      docTypesToIgnore = _.keyBy(this.docTypesToIgnore);
      log.debug('Doc types to ignore', docTypesToIgnore);

      const ignoreWordsMap = _.keyBy(wordsToIgnore);

      // If the title contains a name starting with ng, e.g. "ngController", then add the module name
      // without the ng to the title text, e.g. "controller".
      function extractTitleWords(title) {
        const match = /ng([A-Z]\w*)/.exec(title);
        if (match) {
          title = `${title  } ${  match[1].toLowerCase()}`;
        }
        return title;
      }

    function extractWords(text, words, keywordMap) {

      const tokens = text.toLowerCase().split(/[.\s,`'"#]+/mg);
      _.forEach(tokens, (token) => {
        const match = token.match(KEYWORD_REGEX);
        if (match) {
          const key = match[1];
          if (!keywordMap[key]) {
            keywordMap[key] = true;
            words.push(key);
          }
          }
        });
      }


      // We are only interested in docs that live in the right area
      docs = _.filter(docs, (doc) => areasToSearch[doc.area]);
      docs = _.filter(docs, (doc) => !docTypesToIgnore[doc.docType]);

      _.forEach(docs, (doc) => {


        const words = [];
        const keywordMap = _.clone(ignoreWordsMap);
        const members = [];
        const membersMap = {};

        // Search each top level property of the document for search terms
        _.forEach(doc, (value, key) => {

          if (_.isString(value) && !propertiesToIgnore[key]) {
            extractWords(value, words, keywordMap);
          }

          if (key === 'methods' || key === 'properties' || key === 'events') {
            _.forEach(value, (member) => {
              extractWords(member.name, members, membersMap);
            });
          }
        });


        doc.searchTerms = {
          titleWords: extractTitleWords(doc.name),
          keywords: _.sortBy(words).join(' '),
          members: _.sortBy(members).join(' ')
        };

      });

    }
  };
};
