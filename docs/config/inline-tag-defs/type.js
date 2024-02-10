

// eslint-disable-next-line new-cap
const encoder = new require('node-html-encoder').Encoder();

/**
 * @dgService typeInlineTagDef
 * @description
 * Replace with markup that displays a nice type
 */
module.exports = function typeInlineTagDef(getTypeClass) {
  return {
    name: 'type',
    handler(doc, tagName, tagDescription) {
      return `<a href="" class="${  getTypeClass(tagDescription)  }">${  encoder.htmlEncode(tagDescription)  }</a>`;
    }
  };
};
