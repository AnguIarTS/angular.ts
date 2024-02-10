

describe('ngController', () => {
  let element;

  beforeEach(module(($controllerProvider) => {
    $controllerProvider.register('PublicModule', function() {
      this.mark = 'works';
    });

    const Greeter = function($scope) {
      // private stuff (not exported to scope)
      this.prefix = 'Hello ';

      // public stuff (exported to scope)
      const ctrl = this;
      $scope.name = 'Misko';
      $scope.greet = function(name) {
        return ctrl.prefix + name + ctrl.suffix;
      };

      $scope.protoGreet = bind(this, this.protoGreet);
    };
    Greeter.prototype = {
      suffix: '!',
      protoGreet(name) {
        return this.prefix + name + this.suffix;
      }
    };
    $controllerProvider.register('Greeter', Greeter);

    $controllerProvider.register('Child', ($scope) => {
      $scope.name = 'Adam';
    });

    $controllerProvider.register('Public', function($scope) {
      this.mark = 'works';
    });

    const Foo = function($scope) {
      $scope.mark = 'foo';
    };
    $controllerProvider.register('BoundFoo', ['$scope', Foo.bind(null)]);
  }));

  afterEach(() => {
    dealoc(element);
  });


  it('should instantiate controller and bind methods', inject(($compile, $rootScope) => {
    element = $compile('<div ng-controller="Greeter">{{greet(name)}}</div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('Hello Misko!');
  }));

  it('should instantiate bound constructor functions', inject(($compile, $rootScope) => {
    element = $compile('<div ng-controller="BoundFoo">{{mark}}</div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('foo');
  }));

  it('should publish controller into scope', inject(($compile, $rootScope) => {
    element = $compile('<div ng-controller="Public as p">{{p.mark}}</div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('works');
  }));


  it('should publish controller into scope from module', inject(($compile, $rootScope) => {
    element = $compile('<div ng-controller="PublicModule as p">{{p.mark}}</div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('works');
  }));


  it('should allow nested controllers', inject(($compile, $rootScope) => {
    element = $compile('<div ng-controller="Greeter"><div ng-controller="Child">{{greet(name)}}</div></div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('Hello Adam!');
    dealoc(element);

    element = $compile('<div ng-controller="Greeter"><div ng-controller="Child">{{protoGreet(name)}}</div></div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('Hello Adam!');
  }));


  it('should instantiate controller defined on scope', inject(($compile, $rootScope) => {
    $rootScope.VojtaGreeter = function($scope) {
      $scope.name = 'Vojta';
    };

    element = $compile('<div ng-controller="VojtaGreeter">{{name}}</div>')($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe('Vojta');
  }));


  it('should work with ngInclude on the same element', inject(($compile, $rootScope, $httpBackend) => {
    $rootScope.GreeterController = function($scope) {
      $scope.name = 'Vojta';
    };

    element = $compile('<div><div ng-controller="GreeterController" ng-include="\'url\'"></div></div>')($rootScope);
    $httpBackend.expect('GET', 'url').respond('{{name}}');
    $rootScope.$digest();
    $httpBackend.flush();
    expect(element.text()).toEqual('Vojta');
  }));


  it('should only instantiate the controller once with ngInclude on the same element',
      inject(($compile, $rootScope, $httpBackend) => {

    let count = 0;

    $rootScope.CountController = function($scope) {
      count += 1;
    };

    element = $compile('<div><div ng-controller="CountController" ng-include="url"></div></div>')($rootScope);

    $httpBackend.expect('GET', 'first').respond('first');
    $rootScope.url = 'first';
    $rootScope.$digest();
    $httpBackend.flush();

    $httpBackend.expect('GET', 'second').respond('second');
    $rootScope.url = 'second';
    $rootScope.$digest();
    $httpBackend.flush();

    expect(count).toBe(1);
  }));


  it('when ngInclude is on the same element, the content included content should get a child scope of the controller',
      inject(($compile, $rootScope, $httpBackend) => {

    let controllerScope;

    $rootScope.ExposeScopeController = function($scope) {
      controllerScope = $scope;
    };

    element = $compile('<div><div ng-controller="ExposeScopeController" ng-include="\'url\'"></div></div>')($rootScope);
    $httpBackend.expect('GET', 'url').respond('<div ng-init="name=\'Vojta\'"></div>');
    $rootScope.$digest();
    $httpBackend.flush();
    expect(controllerScope.name).toBeUndefined();
  }));

});
