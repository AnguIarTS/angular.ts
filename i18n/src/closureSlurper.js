#!/usr/bin/env node


const Q  = require('q');
    const qfs  = require('q-io/fs');
    const closureI18nExtractor = require('./closureI18nExtractor.js');

    const localeInfo = {};


const NG_LOCALE_DIR = `${__dirname  }/../../src/ngLocale/`;


function readSymbols() {
  console.log('Processing currency and number symbols ...');
  const numericStagePromise = qfs.read(`${__dirname  }/../closure/currencySymbols.js`, 'b')
    .then((content) => {
      const currencySymbols = closureI18nExtractor.extractCurrencySymbols(content);
      return qfs.read(`${__dirname  }/../closure/numberSymbols.js`, 'b').then((content) => {
          let numberSymbols = content;
          return qfs.read(`${__dirname  }/../closure/numberSymbolsExt.js`, 'b')
            .then((content) => {
              numberSymbols += content;
              return closureI18nExtractor.extractNumberSymbols(numberSymbols, localeInfo, currencySymbols);
            });
        });
      });

  console.log('Processing datetime symbols ...');
  const datetimeStagePromise = qfs.read(`${__dirname  }/../closure/datetimeSymbols.js`, 'b')
      .then((content) => {
        closureI18nExtractor.extractDateTimeSymbols(content, localeInfo);
        return qfs.read(`${__dirname  }/../closure/datetimeSymbolsExt.js`, 'b').then((content) => {
            closureI18nExtractor.extractDateTimeSymbols(content, localeInfo);
        });
    });

    return Q.all([numericStagePromise, datetimeStagePromise]);
}

function extractPlurals() {
  console.log('Extracting Plurals ...');
  return qfs.read(`${__dirname  }/../closure/pluralRules.js`).then((content) => {
    closureI18nExtractor.pluralExtractor(content, localeInfo);
  });
}

function writeLocaleFiles() {
  console.log('Final stage: Writing AngularJS locale files to directory: %j', NG_LOCALE_DIR);
  const result = Q.defer();
  const localeIds = Object.keys(localeInfo);
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
    const content = closureI18nExtractor.outputLocale(localeInfo, localeID);
    if (!content) return;
    const correctedLocaleId = closureI18nExtractor.correctedLocaleId(localeID);
    const filename = `${NG_LOCALE_DIR  }angular-locale_${  correctedLocaleId  }.js`;
    console.log(`Writing ${  filename}`);
    return qfs.write(filename, content)
        .then(() => {
          console.log(`Wrote ${  filename}`);
          ++num_files;
        });
  }

}

/**
* Make a folder under current directory.
* @param folder {string} name of the folder to be made
*/
function createFolder(folder) {
  return qfs.isDirectory(folder).then((isDir) => {
    if (!isDir) return qfs.makeDirectory(folder).then(() => {
      console.log('Created directory %j', folder);
    });
  });
}

createFolder(NG_LOCALE_DIR)
  .then(readSymbols)
  .then(extractPlurals)
  .then(writeLocaleFiles)
  .done((num_files) => { console.log('Wrote %j files.\nAll Done!', num_files); });
