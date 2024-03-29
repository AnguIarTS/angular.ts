

/* globals describe, it, expect */
const tagDef = require('./deprecated');

describe('deprecated tag', () => {
  describe('transforms', () => {
    it('should return the trimmed value if no options', () => {
      const tag = tagDef.transforms({}, {}, 'This is the description');
      expect(tag.description).toEqual('This is the description');
    });

    it('should read options', () => {
      const tag = tagDef.transforms({}, {}, ' sinceVersion="v1.3.4" removeVersion="v1.4.5" what is left is description');
      expect(tag.description).toEqual('what is left is description');
      expect(tag.sinceVersion).toEqual('v1.3.4');
      expect(tag.removeVersion).toEqual('v1.4.5');
    });

    it('should cope with carriage returns', () => {
      const tag = tagDef.transforms({}, {}, '\nsinceVersion="v1.3.4"\nremoveVersion="v1.4.5"\nwhat is left is description');
      expect(tag.description).toEqual('what is left is description');
      expect(tag.sinceVersion).toEqual('v1.3.4');
      expect(tag.removeVersion).toEqual('v1.4.5');
    });

    it('should error if there is an invalid option', () => {
      expect(() => {
        tagDef.transforms({}, {}, ' fromVersion="v1.3.4" toVersion="v1.4.5" what is left is description');
      }).toThrowError('Invalid options: "fromVersion" and "toVersion". Value options are: "sinceVersion" and "removeVersion"');
    });
  });
});
