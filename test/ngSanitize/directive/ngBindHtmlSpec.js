


describe('ngBindHtml', () => {
  beforeEach(module('ngSanitize'));

  it('should set html', inject(($rootScope, $compile) => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = '<div unknown>hello</div>';
    $rootScope.$digest();
    expect(lowercase(element.html())).toEqual('<div>hello</div>');
  }));


  it('should reset html when value is null or undefined', inject(($compile, $rootScope) => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    angular.forEach([null, undefined, ''], (val) => {
      $rootScope.html = 'some val';
      $rootScope.$digest();
      expect(lowercase(element.html())).toEqual('some val');

      $rootScope.html = val;
      $rootScope.$digest();
      expect(lowercase(element.html())).toEqual('');
    });
  }));
});
