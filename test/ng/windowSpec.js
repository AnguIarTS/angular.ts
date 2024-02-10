

describe('$window', () => {
  it('should inject $window', inject(($window) => {
    expect($window).toBe(window);
  }));

  it('should be able to mock $window without errors', () => {
    module({$window: {}});
    inject(['$sce', angular.noop]);
  });
});
