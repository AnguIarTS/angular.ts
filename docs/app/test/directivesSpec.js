

describe('directives', () => {
  let compile; let scope;


  beforeEach(module('directives'));

  beforeEach(module(($compileProvider) => {
    $compileProvider.debugInfoEnabled(false);
  }));

  beforeEach(inject(($rootScope, $compile) => {
    scope = $rootScope.$new();
    compile = $compile;
  }));

  describe('code', () => {
    let prettyPrintOne; let oldPP;
    const {any} = jasmine;

    beforeEach(() => {
      // Provide stub for pretty print function
      oldPP = window.prettyPrintOne;
      prettyPrintOne = window.prettyPrintOne = jasmine.createSpy();
    });

    afterEach(() => {
      window.prettyPrintOne = oldPP;
    });


    it('should pretty print innerHTML', () => {
      compile('<code>let x;</code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith('let x;', null, false);
    });

    it('should allow language declaration', () => {
      compile('<code class="lang-javascript"></code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith(any(String), 'javascript', false);
    });

    it('supports allow line numbers', () => {
      compile('<code class="linenum"></code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith(any(String), null, true);
    });
  });

});

