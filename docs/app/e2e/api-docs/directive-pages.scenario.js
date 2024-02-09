

describe('directives', function() {

  describe('parameter section', function() {

    it('should show the directive name only if it is a param (attribute) with a value', function() {
      browser.get('build/docs/index.html#!/api/ng/directive/ngInclude');
      expect(getParamNames().getText()).toContain('ngInclude | src');

      browser.get('build/docs/index.html#!/api/ngRoute/directive/ngView');
      expect(getParamNames().getText()).not.toContain('ngView');
    });
  });

  describe('usage section', function() {

    it('should show the directive name if it is a param (attribute) with a value', function() {
      browser.get('build/docs/index.html#!/api/ng/directive/ngInclude');

      expect(getUsageAs('element', 'ng-include').isPresent()).toBe(true);
      expect(getUsageAs('attribute', 'ng-include').isPresent()).toBe(true);
      expect(getUsageAs('CSS class', 'ng-include').isPresent()).toBe(true);
    });

    it('should show the directive name if it is a void param (attribute)', function() {
      browser.get('build/docs/index.html#!/api/ngRoute/directive/ngView');

      expect(getUsageAs('element', 'ng-view').isPresent()).toBe(true);
      expect(getUsageAs('attribute', 'ng-view').isPresent()).toBe(true);
      expect(getUsageAs('CSS class', 'ng-view').isPresent()).toBe(true);
    });
  });
});

function getParamNames() {
  let argsSection = element(by.className('input-arguments'));

  let paramNames = argsSection.all(by.css('tr td:nth-child(1)'));

  return paramNames;
}

// Based on the type of directive usage, the directive name will show up in the code block
// with a specific class
let typeClassMap = {
  element: 'tag',
  attribute: 'atn',
  'CSS class': 'atv'
};

function getUsageAs(type, directiveName) {
  let usage = element(by.className('usage'));

  let as = usage.element(by.cssContainingText('li', 'as ' + type));

  return as.element(by.cssContainingText('span.' + typeClassMap[type], directiveName));
}
