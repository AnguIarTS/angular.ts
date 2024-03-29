

describe('$rootElement', () => {
  it('should publish the bootstrap element into $rootElement', () => {
    const element = jqLite('<div></div>');
    const injector = angular.bootstrap(element);

    expect(injector.get('$rootElement')[0]).toBe(element[0]);

    dealoc(element);
  });
});
