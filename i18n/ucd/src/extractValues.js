
/**
 * Extract values from a stream.
 */

exports.extractValues = extractValues;

let sax = require('sax/lib/sax');
let saxStrict = true;
let saxOptions = {};
let validXMLTagNames = { char: 'Y', reserved: 'Y', surrogate: 'Y', noncharacter: 'Y'};

function extractValues(stream, propertiesToExtract, callback) {
  let saxStream = sax.createStream(saxStrict, saxOptions);
  let firstValid = {};
  let lastValid = {};
  let keys = Object.keys(propertiesToExtract);
  let keyValues = keys.map(function(k) { return propertiesToExtract[k]; });
  let validRanges = {};

  for (let i in keys) {
    validRanges[keys[i] + '_' + keyValues[i]] = [];
  }
  saxStream.onopentag = onOpenTag;
  stream
    .pipe(saxStream)
    .on('end', doCallback);

  function onOpenTag(node) {
    let property;
    if (validXMLTagNames[node.name]) {
      for (let i in keys) {
        property = keyValues[i];
        if (node.attributes[keys[i]] === property) validProperty(keys[i] + '_' + property, node);
        else invalidProperty(keys[i] + '_' + property);
      }
    }
  }

  function validProperty(property, node) {
    if (!firstValid[property]) firstValid[property] =
        node.attributes.cp || node.attributes['first-cp'];
    lastValid[property] = node.attributes.cp || node.attributes['last-cp'];
  }

  function invalidProperty(property) {
    if (!firstValid[property]) return;
    validRanges[property].push([firstValid[property], lastValid[property]]);
    firstValid[property] = null;
  }

  function doCallback() {
    for (let i in keys) {
      let property = keys[i] + '_' + keyValues[i];
      invalidProperty(property);
    }
    callback(validRanges);
  }
}
