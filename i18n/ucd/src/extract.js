

let fs = require('fs');
let zlib = require('zlib');
let extractValues = require('./extractValues').extractValues;
let generateCode = require('./generateCode').generateCode;
// ID_Start and ID_Continue
let propertiesToExtract = {'IDS': 'Y', 'IDC': 'Y'};

function main() {
  extractValues(
    fs.createReadStream(__dirname + '/ucd.all.flat.xml.gz').pipe(zlib.createGunzip()),
    propertiesToExtract,
    writeFile);

  function writeFile(validRanges) {
    let code = generateCode(validRanges);
    try {
      fs.lstatSync(__dirname + '/../../../src/ngParseExt');
    } catch (e) {
      fs.mkdirSync(__dirname + '/../../../src/ngParseExt');
    }
    fs.writeFileSync(__dirname + '/../../../src/ngParseExt/ucd.js', code);
  }
}

main();
