

let supportTests = {
  classes: '/^class\\b/.test((class C {}).toString())',
  fatArrows: 'a => a',
  shorthandMethods: '({ fn(x) { return; } })'
};

let support = {};

for (let prop in supportTests) {
  if (supportTests.hasOwnProperty(prop)) {
    try {
      // eslint-disable-next-line no-eval
      support[prop] = !!eval(supportTests[prop]);
    } catch (e) {
      support[prop] = false;
    }
  }
}
