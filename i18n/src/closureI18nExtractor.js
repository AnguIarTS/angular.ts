

const converter = require('./converter.js');

exports.extractNumberSymbols = extractNumberSymbols;
exports.extractCurrencySymbols = extractCurrencySymbols;
exports.extractDateTimeSymbols = extractDateTimeSymbols;
exports.pluralExtractor = pluralExtractor;
exports.outputLocale = outputLocale;
exports.correctedLocaleId = correctedLocaleId;
exports.findLocaleId = findLocaleId;
exports.serializeContent = serializeContent;

const goog = { provide() {},
  require() {},
  i18n: {currency: {}, pluralRules: {}} };

function findLocaleId(str, type) {
  if (type === 'num') {
    return (str.match(/^NumberFormatSymbols_(.+)$/) || [])[1];
  }

  if (type !== 'datetime') { throw new Error(`unknown type in findLocaleId: ${  type}`); }

  return (str.match(/^DateTimeSymbols_(.+)$/) || [])[1];
}


function getInfoForLocale(localeInfo, localeID) {
  if (!localeInfo[localeID]) {
    localeInfo[localeID] = {};
    // localeIds.push(localeID);
  }
  return localeInfo[localeID];
}

function extractNumberSymbols(content, localeInfo, currencySymbols) {
  // eval script in the current context so that we get access to all the symbols
  // eslint-disable-next-line no-eval
  eval(content.toString());
  for (const propName in goog.i18n) {
    const localeID = findLocaleId(propName, 'num');
    if (localeID) {
      const info = getInfoForLocale(localeInfo, localeID);
      info.NUMBER_FORMATS =
          converter.convertNumberData(goog.i18n[propName], currencySymbols);
    }
  }
}

function extractCurrencySymbols(content) {
  // eval script in the current context so that we get access to all the symbols
  // eslint-disable-next-line no-eval
  eval(content.toString());
  // let currencySymbols = goog.i18n.currency.CurrencyInfo;
  // currencySymbols.__proto__ = goog.i18n.currency.CurrencyInfoTier2;

  return { ...goog.i18n.currency.CurrencyInfoTier2, ...goog.i18n.currency.CurrencyInfo};
}

function extractDateTimeSymbols(content, localeInfo) {
  // eval script in the current context so that we get access to all the symbols
  // eslint-disable-next-line no-eval
  eval(content.toString());
  for (const propName in goog.i18n) {
    const localeID = findLocaleId(propName, 'datetime');
    if (localeID) {
      const info = getInfoForLocale(localeInfo, localeID);
      info.DATETIME_FORMATS =
          converter.convertDatetimeData(goog.i18n[propName]);
    }
  }
}

function pluralExtractor(content, localeInfo) {
  const contentText = content.toString();
  const localeIds = Object.keys(localeInfo);
  for (let i = 0; i < localeIds.length; i++) {
    // We don't need to care about country ID because the plural rules in more specific id are
    // always the same as those in its language ID.
    // e.g. plural rules for en_SG is the same as those for en.
    goog.LOCALE = localeIds[i].match(/[^_]+/)[0];
    try {
      // eslint-disable-next-line no-eval
      eval(contentText);
    } catch (e) {
      console.log(`Error in eval(contentText): ${  e.stack}`);
    }
    if (!goog.i18n.pluralRules.select) {
      console.log(`No select for lang [${  goog.LOCALE  }]`);
      continue;
    }
    const temp = goog.i18n.pluralRules.select.toString().
        replace(/function\s+\(/g, 'function(').
        replace(/goog\.i18n\.pluralRules\.Keyword/g, 'PLURAL_CATEGORY').
        replace(/goog\.i18n\.pluralRules\.get_vf_/g, 'getVF').
        replace(/goog\.i18n\.pluralRules\.get_wt_/g, 'getWT').
        replace(/goog\.i18n\.pluralRules\.decimals_/g, 'getDecimals').
        replace(/\n/g, '');

    /// @@ is a crazy place holder to be replaced before writing to file
    localeInfo[localeIds[i]].pluralCat = `@@${  temp  }@@`;
  }
}

function correctedLocaleId(localeID) {
// e.g. from zh_CN to zh-CN, from en_US to en-US
  return localeID.replace(/_/g, '-').toLowerCase();
}

function canonicalizeForJsonStringify(unused_key, object) {
  // This function is intended to be called as the 2nd argument to
  // JSON.stringify.  The goal here is to ensure that the generated JSON has
  // objects with their keys in ascending order.  Without this, it's much
  // harder to diff the generated files in src/ngLocale as the order isn't
  // exactly consistent.  We've gotten lucky in the past.
  //
  // Iteration order, for string keys, ends up being the same as insertion
  // order.  Refer :-
  //    1. http://ejohn.org/blog/javascript-in-chrome/
  //       (search for "for loop order").
  //       Currently all major browsers loop over the properties of an object
  //       in the order in which they were defined.
  //         - John Resig
  //    2. https://code.google.com/p/v8/issues/detail?id=164
  //       ECMA-262 does not specify enumeration order. The de facto standard
  //       is to match insertion order, which V8 also does ...
  if (typeof object !== 'object' || Object.prototype.toString.apply(object) === '[object Array]') {
    return object;
  }
  const result = {};
  Object.keys(object).sort().forEach((key) => {
    result[key] = object[key];
  });
  return result;
}

function serializeContent(localeObj) {
  return JSON.stringify(localeObj, canonicalizeForJsonStringify, '  ')
    .replace(new RegExp('[\\u007f-\\uffff]', 'g'), (c) => `\\u${  (`0000${  c.charCodeAt(0).toString(16)}`).slice(-4)}`)
    .replace(/"@@|@@"/g, '');
}

function outputLocale(localeInfo, localeID) {
  const fallBackID = localeID.match(/[A-Za-z]+/)[0];
      let localeObj = localeInfo[localeID];
      const fallBackObj = localeInfo[fallBackID];

  // fallBack to language formats when country format is missing
  // e.g. if NUMBER_FORMATS of en_xyz is not present, use the NUMBER_FORMATS of en instead
  if (!localeObj.NUMBER_FORMATS) {
    localeObj.NUMBER_FORMATS = fallBackObj.NUMBER_FORMATS;
  }

  // datetimesymbolsext.js provides more top level locales than the other
  // files.  We process datetimesymbolsext.js because we want the country
  // specific formats that are missing from datetimesymbols.js.  However, we
  // don't want to write locale files that only have dateformat (i.e. missing
  // number formats.)  So we skip them.
  if (!localeObj.NUMBER_FORMATS) {
    console.log('Skipping locale %j: Don\'t have any number formats', localeID);
    return null;
  }

  if (!localeObj.DATETIME_FORMATS) {
    localeObj.DATETIME_FORMATS = fallBackObj.DATETIME_FORMATS;
  }
  localeObj.localeID = localeID;
  localeObj.id = correctedLocaleId(localeID);

  let getDecimals = [
    'function getDecimals(n) {',
    '  n = n + \'\';',
    '  let i = n.indexOf(\'.\');',
    '  return (i == -1) ? 0 : n.length - i - 1;',
    '}', '', ''
  ].join('\n');

  let getVF = [
    'function getVF(n, opt_precision) {',
    '  let v = opt_precision;', '',
    '  if (undefined === v) {',
    '    v = Math.min(getDecimals(n), 3);',
    '  }', '',
    '  let base = Math.pow(10, v);',
    '  let f = ((n * base) | 0) % base;',
    '  return {v: v, f: f};',
    '}', '', ''
  ].join('\n');

  let getWT =
  [
    'function getWT(v, f) {',
    '  if (f === 0) {',
    '    return {w: 0, t: 0};',
    '  }', '',
    '  while ((f % 10) === 0) {',
    '    f /= 10;',
    '    v--;',
    '  }', '',
    '  return {w: v, t: f};',
    '}', '', ''
  ].join('\n');

  localeObj = {
    DATETIME_FORMATS: localeObj.DATETIME_FORMATS,
    NUMBER_FORMATS: localeObj.NUMBER_FORMATS,
    pluralCat: localeObj.pluralCat,
    id: localeObj.id,
    localeID
  };

  const content = serializeContent(localeObj);
  if (content.indexOf('getVF(') < 0) {
    getVF = '';
  }
  if (content.indexOf('getWT(') < 0) {
    getWT = '';
  }
  if (!getVF && content.indexOf('getDecimals(') < 0) {
    getDecimals = '';
  }

  const prefix =
      `'use strict';\n` +
      `angular.module("ngLocale", [], ["$provide", function($provide) {\n` +
          `let PLURAL_CATEGORY = {` +
          `ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"` +
          `};\n${ 
          getDecimals  }${getVF  }${getWT 
          }$provide.value("$locale", `;

  const suffix = ');\n}]);\n';

  return prefix + content + suffix;
}
