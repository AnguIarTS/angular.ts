

const fs = require('fs');
const zlib = require('zlib');
const {extractValues} = require('./extractValues');
const {generateCode} = require('./generateCode');
// ID_Start and ID_Continue
const propertiesToExtract = {'IDS': 'Y', 'IDC': 'Y'};

function main() {
  extractValues(
    fs.createReadStream(`${__dirname  }/ucd.all.flat.xml.gz`).pipe(zlib.createGunzip()),
    propertiesToExtract,
    writeFile);

  function writeFile(validRanges) {
    const code = generateCode(validRanges);
    try {
      fs.lstatSync(`${__dirname  }/../../../src/ngParseExt`);
    } catch (e) {
      fs.mkdirSync(`${__dirname  }/../../../src/ngParseExt`);
    }
    fs.writeFileSync(`${__dirname  }/../../../src/ngParseExt/ucd.js`, code);
  }
}

main();
