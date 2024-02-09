

describe('directives', function() {
  let compile, scope;


  beforeEach(module('directives'));

  beforeEach(module(function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }));

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();
    compile = $compile;
  }));

  describe('code', function() {
    let prettyPrintOne, oldPP;
    let any = jasmine.any;

    beforeEach(function() {
      // Provide stub for pretty print function
      oldPP = window.prettyPrintOne;
      prettyPrintOne = window.prettyPrintOne = jasmine.createSpy();
    });

    afterEach(function() {
      window.prettyPrintOne = oldPP;
    });


    it('should pretty print innerHTML', function() {
      compile('<code>let x;</code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith('let x;', null, false);
    });

    it('should allow language declaration', function() {
      compile('<code class="lang-javascript"></code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith(any(String), 'javascript', false);
    });

    it('supports allow line numbers', function() {
      compile('<code class="linenum"></code>')(scope);
      expect(prettyPrintOne).toHaveBeenCalledWith(any(String), null, true);
    });
  });

});

