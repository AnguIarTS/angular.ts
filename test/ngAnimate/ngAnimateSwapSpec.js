

describe('ngAnimateSwap', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  let element;
  afterEach(() => {
    dealoc(element);
  });

  let $rootScope; let $compile; let $animate;
  beforeEach(inject((_$rootScope_, _$animate_, _$compile_) => {
    $rootScope = _$rootScope_;
    $animate = _$animate_;
    $compile = _$compile_;

    $animate.enabled(false);
  }));


  it('should render a new container when the expression changes', () => {
    element = $compile('<div><div ng-animate-swap="exp">{{ exp }}</div></div>')($rootScope);
    $rootScope.$digest();

    const first = element.find('div')[0];
    expect(first).toBeFalsy();

    $rootScope.exp = 'yes';
    $rootScope.$digest();

    const second = element.find('div')[0];
    expect(second.textContent).toBe('yes');

    $rootScope.exp = 'super';
    $rootScope.$digest();

    const third = element.find('div')[0];
    expect(third.textContent).toBe('super');
    expect(third).not.toEqual(second);
    expect(second.parentNode).toBeFalsy();
  });

  it('should render a new container only when the expression property changes', () => {
    element = $compile('<div><div ng-animate-swap="exp.prop">{{ exp.value }}</div></div>')($rootScope);
    $rootScope.exp = {
      prop: 'hello',
      value: 'world'
    };
    $rootScope.$digest();

    const one = element.find('div')[0];
    expect(one.textContent).toBe('world');

    $rootScope.exp.value = 'planet';
    $rootScope.$digest();

    const two = element.find('div')[0];
    expect(two.textContent).toBe('planet');
    expect(two).toBe(one);

    $rootScope.exp.prop = 'goodbye';
    $rootScope.$digest();

    const three = element.find('div')[0];
    expect(three.textContent).toBe('planet');
    expect(three).not.toBe(two);
  });

  it('should watch the expression as a collection', () => {
    element = $compile('<div><div ng-animate-swap="exp">{{ exp.a }} {{ exp.b }} {{ exp.c }}</div></div>')($rootScope);
    $rootScope.exp = {
      a: 1,
      b: 2
    };
    $rootScope.$digest();

    const one = element.find('div')[0];
    expect(one.textContent.trim()).toBe('1 2');

    $rootScope.exp.a++;
    $rootScope.$digest();

    const two = element.find('div')[0];
    expect(two.textContent.trim()).toBe('2 2');
    expect(two).not.toEqual(one);

    $rootScope.exp.c = 3;
    $rootScope.$digest();

    const three = element.find('div')[0];
    expect(three.textContent.trim()).toBe('2 2 3');
    expect(three).not.toEqual(two);

    $rootScope.exp = { c: 4 };
    $rootScope.$digest();

    const four = element.find('div')[0];
    expect(four.textContent.trim()).toBe('4');
    expect(four).not.toEqual(three);
  });

  they('should consider $prop as a falsy value', [false, undefined, null], (value) => {
    element = $compile('<div><div ng-animate-swap="value">{{ value }}</div></div>')($rootScope);
    $rootScope.value = true;
    $rootScope.$digest();

    const one = element.find('div')[0];
    expect(one).toBeTruthy();

    $rootScope.value = value;
    $rootScope.$digest();

    const two = element.find('div')[0];
    expect(two).toBeFalsy();
  });

  it('should consider "0" as a truthy value', () => {
    element = $compile('<div><div ng-animate-swap="value">{{ value }}</div></div>')($rootScope);
    $rootScope.$digest();

    const one = element.find('div')[0];
    expect(one).toBeFalsy();

    $rootScope.value = 0;
    $rootScope.$digest();

    const two = element.find('div')[0];
    expect(two).toBeTruthy();
  });

  it('should create a new (non-isolate) scope for each inserted clone', () => {
    const parentScope = $rootScope.$new();
    parentScope.foo = 'bar';

    element = $compile('<div><div ng-animate-swap="value">{{ value }}</div></div>')(parentScope);

    $rootScope.$apply('value = 1');
    const scopeOne = element.find('div').eq(0).scope();
    expect(scopeOne.foo).toBe('bar');

    $rootScope.$apply('value = 2');
    const scopeTwo = element.find('div').eq(0).scope();
    expect(scopeTwo.foo).toBe('bar');

    expect(scopeOne).not.toBe(scopeTwo);
  });

  it('should destroy the previous scope when removing the element', () => {
    element = $compile('<div><div ng-animate-swap="value">{{ value }}</div></div>')($rootScope);

    $rootScope.$apply('value = 1');
    const scopeOne = element.find('div').eq(0).scope();
    expect(scopeOne.$$destroyed).toBe(false);

    // Swapping the old element with a new one.
    $rootScope.$apply('value = 2');
    expect(scopeOne.$$destroyed).toBe(true);

    const scopeTwo = element.find('div').eq(0).scope();
    expect(scopeTwo.$$destroyed).toBe(false);

    // Removing the old element (without inserting a new one).
    $rootScope.$apply('value = null');
    expect(scopeTwo.$$destroyed).toBe(true);
  });

  it('should destroy the previous scope when swapping elements', () => {
    element = $compile('<div><div ng-animate-swap="value">{{ value }}</div></div>')($rootScope);

    $rootScope.$apply('value = 1');
    const scopeOne = element.find('div').eq(0).scope();
    expect(scopeOne.$$destroyed).toBe(false);

    $rootScope.$apply('value = 2');
    expect(scopeOne.$$destroyed).toBe(true);
  });

  it('should work with `ngIf` on the same element', () => {
    const tmpl = '<div><div ng-animate-swap="exp" ng-if="true">{{ exp }}</div></div>';
    element = $compile(tmpl)($rootScope);
    $rootScope.$digest();

    const first = element.find('div')[0];
    expect(first).toBeFalsy();

    $rootScope.exp = 'yes';
    $rootScope.$digest();

    const second = element.find('div')[0];
    expect(second.textContent).toBe('yes');

    $rootScope.exp = 'super';
    $rootScope.$digest();

    const third = element.find('div')[0];
    expect(third.textContent).toBe('super');
    expect(third).not.toEqual(second);
    expect(second.parentNode).toBeFalsy();
  });


  describe('animations', () => {
    it('should trigger a leave animation followed by an enter animation upon swap',() => {
      element = $compile('<div><div ng-animate-swap="exp">{{ exp }}</div></div>')($rootScope);
      $rootScope.exp = 1;
      $rootScope.$digest();

      const first = $animate.queue.shift();
      expect(first.event).toBe('enter');
      expect($animate.queue.length).toBe(0);

      $rootScope.exp = 2;
      $rootScope.$digest();

      const second = $animate.queue.shift();
      expect(second.event).toBe('leave');

      const third = $animate.queue.shift();
      expect(third.event).toBe('enter');
      expect($animate.queue.length).toBe(0);

      $rootScope.exp = false;
      $rootScope.$digest();

      const forth = $animate.queue.shift();
      expect(forth.event).toBe('leave');
      expect($animate.queue.length).toBe(0);
    });
  });
});
