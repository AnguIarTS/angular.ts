

describe('$rootElement', function() {
  it('should publish the bootstrap element into $rootElement', function() {
    let element = jqLite('<div></div>');
    let injector = angular.bootstrap(element);

    expect(injector.get('$rootElement')[0]).toBe(element[0]);

    dealoc(element);
  });
});
