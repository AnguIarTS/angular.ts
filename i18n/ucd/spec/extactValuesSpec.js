

const stream = require('stream');
const {extractValues} = require('../src/extractValues.js');

function stringStream(str) {
  return new stream.Readable({
    read(n) {
      this.push(str);
      str = null;
    }
  });
}

describe('extractValues', () => {
  it('should extract the values from the xml', (done) => {
    const str = '<ucd><repertoire><char cp="0000" IDS="N"></char><char cp="0001" IDS="Y"></char>' +
      '<char cp="0002" IDS="Y"></char><char cp="0003" IDS="N"></char></repertoire></ucd>';
    extractValues(stringStream(str), {'IDS': 'Y'}, (values) => {
      expect(values).toEqual({ IDS_Y : [['0001', '0002']] });
      done();
    });
  });

  it('should extract the values from the xml if the last element matches', (done) => {
    const str = '<ucd><repertoire><char cp="0000" IDS="N"></char><char cp="0001" IDS="Y"></char>' +
      '<char cp="0002" IDS="Y"></char><char cp="0003" IDS="Y"></char></repertoire></ucd>';
    extractValues(stringStream(str), {'IDS': 'Y'}, (values) => {
      expect(values).toEqual({ IDS_Y : [['0001', '0003']] });
      done();
    });
  });

  it('should support `reserved`', (done) => {
    const str = '<ucd><repertoire><char cp="0000" IDS="N"></char><char cp="0001" IDS="Y"></char>' +
      '<reserved first-cp="0002" last-cp="0005" IDS="N"></reserved><char cp="0006" IDS="Y"></char></repertoire></ucd>';
    extractValues(stringStream(str), {'IDS': 'Y'}, (values) => {
      expect(values).toEqual({ IDS_Y : [['0001', '0001'], ['0006', '0006']] });
      done();
    });
  });

  it('should support `surrogate`', (done) => {
    const str = '<ucd><repertoire><char cp="0000" IDS="N"></char><char cp="0001" IDS="Y"></char>' +
      '<surrogate first-cp="0002" last-cp="0005" IDS="N"></surrogate><char cp="0006" IDS="Y"></char></repertoire></ucd>';
    extractValues(stringStream(str), {'IDS': 'Y'}, (values) => {
      expect(values).toEqual({ IDS_Y : [['0001', '0001'], ['0006', '0006']] });
      done();
    });
  });

  it('should support `noncharactere`', (done) => {
    const str = '<ucd><repertoire><char cp="0000" IDS="N"></char><char cp="0001" IDS="Y"></char>' +
      '<noncharacter first-cp="0002" last-cp="0005" IDS="N"></noncharacter><char cp="0006" IDS="Y"></char></repertoire></ucd>';
    extractValues(stringStream(str), {'IDS': 'Y'}, (values) => {
      expect(values).toEqual({ IDS_Y : [['0001', '0001'], ['0006', '0006']] });
      done();
    });
  });
});
