

module.exports = {
  name: 'sortOrder',
  transforms(doc, tag, value) {
    return parseInt(value, 10);
  }
};
