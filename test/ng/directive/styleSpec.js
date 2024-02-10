

describe('style', () => {
  let element;


  afterEach(() => {
    dealoc(element);
  });


  it('should compile style element without binding', inject(($compile, $rootScope) => {
    element = jqLite('<style type="text/css">.header{font-size:1.5em; h3{font-size:1.5em}}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{font-size:1.5em; h3{font-size:1.5em}}');
  }));


  it('should compile style element with one simple bind', inject(($compile, $rootScope) => {
    element = jqLite('<style type="text/css">.some-container{ width: {{elementWidth}}px; }</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.some-container{ width: px; }');

    $rootScope.$apply(() => {
      $rootScope.elementWidth = 200;
    });

    expect(element[0].innerHTML).toBe('.some-container{ width: 200px; }');
  }));


  it('should compile style element with one bind', inject(($compile, $rootScope) => {
    element = jqLite('<style type="text/css">.header{ h3 { font-size: {{fontSize}}em }}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: em }}');

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
    });

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: 1.5em }}');
  }));


  it('should compile style element with two binds', inject(($compile, $rootScope) => {
    element = jqLite('<style type="text/css">.header{ h3 { font-size: {{fontSize}}{{unit}} }}</style>');
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size:  }}');

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
      $rootScope.unit = 'em';
    });

    expect(element[0].innerHTML).toBe('.header{ h3 { font-size: 1.5em }}');
  }));


  it('should compile content of element with style attr', inject(($compile, $rootScope) => {
    element = jqLite('<div style="some">{{bind}}</div>');
    $compile(element)($rootScope);
    $rootScope.$apply(() => {
      $rootScope.bind = 'value';
    });

    expect(element.text()).toBe('value');
  }));
});
