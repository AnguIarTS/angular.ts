

describe('$$forceReflow', () => {
  it('should issue a reflow by touching the `document.body.client` when no param is provided', () => {
    module(($provide) => {
      const doc = jqLite('<div></div>');
      doc[0].body = {};
      doc[0].body.offsetWidth = 10;
      $provide.value('$document', doc);
    });
    inject(($$forceReflow) => {
      const value = $$forceReflow();
      expect(value).toBe(11);
    });
  });

  it('should issue a reflow by touching the `domNode.offsetWidth` when a domNode param is provided',
    inject(($$forceReflow) => {

    const elm = {};
    elm.offsetWidth = 100;
    expect($$forceReflow(elm)).toBe(101);
  }));

  it('should issue a reflow by touching the `jqLiteNode[0].offsetWidth` when a jqLite node param is provided',
    inject(($$forceReflow) => {

    let elm = {};
    elm.offsetWidth = 200;
    elm = jqLite(elm);
    expect($$forceReflow(elm)).toBe(201);
  }));

  describe('$animate with ngAnimateMock', () => {
    beforeEach(module('ngAnimateMock'));

    it('should keep track of how many reflows have been issued',
      inject(($$forceReflow, $animate) => {

      const elm = {};
      elm.offsetWidth = 10;

      expect($animate.reflows).toBe(0);

      $$forceReflow(elm);
      $$forceReflow(elm);
      $$forceReflow(elm);

      expect($animate.reflows).toBe(3);
    }));
  });
});
