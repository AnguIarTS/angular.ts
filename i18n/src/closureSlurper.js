#!/usr/bin/env node


let Q  = require('q'),
    qfs  = require('q-io/fs'),
    closureI18nExtractor = require('./closureI18nExtractor.js'),
    localeInfo = {};


let NG_LOCALE_DIR = __dirname + '/../../src/ngLocale/';


function readSymbols() {
  console.log('Processing currency and number symbols ...');
  let numericStagePromise = qfs.read(__dirname + '/../closure/currencySymbols.js', 'b')
    .then(function(content) {
      let currencySymbols = closureI18nExtractor.extractCurrencySymbols(content);
      return qfs.read(__dirname + '/../closure/numberSymbols.js', 'b').then(function(content) {
          let numberSymbols = content;
          return qfs.read(__dirname + '/../closure/numberSymbolsExt.js', 'b')
            .then(function(content) {
              numberSymbols += content;
              return closureI18nExtractor.extractNumberSymbols(numberSymbols, localeInfo, currencySymbols);
            });
        });
      });

  console.log('Processing datetime symbols ...');
  let datetimeStagePromise = qfs.read(__dirname + '/../closure/datetimeSymbols.js', 'b')
      .then(function(content) {
        closureI18nExtractor.extractDateTimeSymbols(content, localeInfo);
        return qfs.read(__dirname + '/../closure/datetimeSymbolsExt.js', 'b').then(function(content) {
            closureI18nExtractor.extractDateTimeSymbols(content, localeInfo);
        });
    });

    return Q.all([numericStagePromise, datetimeStagePromise]);
}

function extractPlurals() {
  console.log('Extracting Plurals ...');
  return qfs.read(__dirname + '/../closure/pluralRules.js').then(function(content) {
    closureI18nExtractor.pluralExtractor(content, localeInfo);
  });
}

function writeLocaleFiles() {
  console.log('Final stage: Writing AngularJS locale files to directory: %j', NG_LOCALE_DIR);
  let result = Q.defer();
  let localeIds = Object.keys(localeInfo);
  let num_files = 0;

  console.log('Generated %j locale files.', localeIds.length);
  loop();
  return result.promise;

  // Need to use a loop and not write the files in parallel,
  // as otherwise we will get the error EMFILE, which means
  // we have too many open files.
  function loop() {
    let nextPromise;
    if (localeIds.length) {
      nextPromise = process(localeIds.pop()) || Q.when();
      nextPromise.then(loop, result.reject);
    } else {
      result.resolve(num_files);
    }
  }

  function process(localeID) {
    let content = closureI18nExtractor.outputLocale(localeInfo, localeID);
    if (!content) return;
    let correctedLocaleId = closureI18nExtractor.correctedLocaleId(localeID);
    let filename = NG_LOCALE_DIR + 'angular-locale_' + correctedLocaleId + '.js';
    console.log('Writing ' + filename);
    return qfs.write(filename, content)
        .then(function() {
          console.log('Wrote ' + filename);
          ++num_files;
        });
  }

}

/**
* Make a folder under current directory.
* @param folder {string} name of the folder to be made
*/
function createFolder(folder) {
  return qfs.isDirectory(folder).then(function(isDir) {
    if (!isDir) return qfs.makeDirectory(folder).then(function() {
      console.log('Created directory %j', folder);
    });
  });
}

createFolder(NG_LOCALE_DIR)
  .then(readSymbols)
  .then(extractPlurals)
  .then(writeLocaleFiles)
  .done(function(num_files) { console.log('Wrote %j files.\nAll Done!', num_files); });
