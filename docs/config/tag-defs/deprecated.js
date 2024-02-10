

const OPTION_MATCHER = /^\s*([\w-]+)="([^"]+)"\s+([\s\S]*)/;
const VALID_OPTIONS = ['sinceVersion', 'removeVersion'];

module.exports = {
  name: 'deprecated',
  transforms(doc, tag, value) {
    const result = {};
    const invalidOptions = [];
    value = value.trim();
    while (OPTION_MATCHER.test(value)) {
      value = value.replace(OPTION_MATCHER, (_, key, value, rest) => {
        if (VALID_OPTIONS.indexOf(key) !== -1) {
          result[key] = value;
        } else {
          invalidOptions.push(key);
        }
        return rest;
      });
    }
    if (invalidOptions.length > 0) {
      throw new Error(`Invalid options: ${  humanList(invalidOptions)  }. Value options are: ${  humanList(VALID_OPTIONS)}`);
    }
    result.description = value;
    return result;
  }
};

function humanList(values, sep, lastSep) {
  if (sep === undefined) sep = ', ';
  if (lastSep === undefined) lastSep = ' and ';

  return values.reduce((output, value, index, list) => {
    output += `"${  value  }"`;
    switch (list.length - index) {
      case 1: return output;
      case 2: return output + lastSep;
      default: return output + sep;
    }
  }, '');
}
