

describe('ngKeyup and ngKeydown directives', () => {
  let element;

  afterEach(() => {
    dealoc(element);
  });

  it('should get called on a keyup', inject(($rootScope, $compile) => {
    element = $compile('<input ng-keyup="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keyup');
    expect($rootScope.touched).toEqual(true);
  }));

  it('should get called on a keydown', inject(($rootScope, $compile) => {
    element = $compile('<input ng-keydown="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keydown');
    expect($rootScope.touched).toEqual(true);
  }));

  it('should get called on a keypress', inject(($rootScope, $compile) => {
    element = $compile('<input ng-keypress="touched = true">')($rootScope);
    $rootScope.$digest();
    expect($rootScope.touched).toBeFalsy();

    browserTrigger(element, 'keypress');
    expect($rootScope.touched).toEqual(true);
  }));

});

