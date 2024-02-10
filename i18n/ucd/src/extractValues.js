
/**
 * Extract values from a stream.
 */

exports.extractValues = extractValues;

const sax = require('sax/lib/sax');

const saxStrict = true;
const saxOptions = {};
const validXMLTagNames = { char: 'Y', reserved: 'Y', surrogate: 'Y', noncharacter: 'Y'};

function extractValues(stream, propertiesToExtract, callback) {
  const saxStream = sax.createStream(saxStrict, saxOptions);
  const firstValid = {};
  const lastValid = {};
  const keys = Object.keys(propertiesToExtract);
  const keyValues = keys.map((k) => propertiesToExtract[k]);
  const validRanges = {};

  for (const i in keys) {
    validRanges[`${keys[i]  }_${  keyValues[i]}`] = [];
  }
  saxStream.onopentag = onOpenTag;
  stream
    .pipe(saxStream)
    .on('end', doCallback);

  function onOpenTag(node) {
    let property;
    if (validXMLTagNames[node.name]) {
      for (const i in keys) {
        property = keyValues[i];
        if (node.attributes[keys[i]] === property) validProperty(`${keys[i]  }_${  property}`, node);
        else invalidProperty(`${keys[i]  }_${  property}`);
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
    for (const i in keys) {
      const property = `${keys[i]  }_${  keyValues[i]}`;
      invalidProperty(property);
    }
    callback(validRanges);
  }
}
