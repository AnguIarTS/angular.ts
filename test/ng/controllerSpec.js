

describe('$controller', () => {
  let $controllerProvider; let $controller;

  beforeEach(module((_$controllerProvider_) => {
    $controllerProvider = _$controllerProvider_;
  }));


  beforeEach(inject((_$controller_) => {
    $controller = _$controller_;
  }));


  describe('provider', () => {

    it('should allow registration of controllers', () => {
      const FooCtrl = function($scope) { $scope.foo = 'bar'; };
        const scope = {};
        let ctrl;

      $controllerProvider.register('FooCtrl', FooCtrl);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });

    it('should allow registration of bound controller functions', () => {
      const FooCtrl = function($scope) { $scope.foo = 'bar'; };
        const scope = {};
        let ctrl;

      const BoundFooCtrl = FooCtrl.bind(null);

      $controllerProvider.register('FooCtrl', ['$scope', BoundFooCtrl]);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
    });

    it('should allow registration of map of controllers', () => {
      const FooCtrl = function($scope) { $scope.foo = 'foo'; };
          const BarCtrl = function($scope) { $scope.bar = 'bar'; };
          const scope = {};
          let ctrl;

      $controllerProvider.register({FooCtrl, BarCtrl});

      ctrl = $controller('FooCtrl', {$scope: scope});
      expect(scope.foo).toBe('foo');
      expect(ctrl instanceof FooCtrl).toBe(true);

      ctrl = $controller('BarCtrl', {$scope: scope});
      expect(scope.bar).toBe('bar');
      expect(ctrl instanceof BarCtrl).toBe(true);
    });


    it('should allow registration of controllers annotated with arrays', () => {
      const FooCtrl = function($scope) { $scope.foo = 'bar'; };
          const scope = {};
          let ctrl;

      $controllerProvider.register('FooCtrl', ['$scope', FooCtrl]);
      ctrl = $controller('FooCtrl', {$scope: scope});

      expect(scope.foo).toBe('bar');
      expect(ctrl instanceof FooCtrl).toBe(true);
    });


    it('should throw an exception if a controller is called "hasOwnProperty"', () => {
      expect(() => {
        $controllerProvider.register('hasOwnProperty', ($scope) => {});
      }).toThrowMinErr('ng', 'badname', 'hasOwnProperty is not a valid controller name');
    });


    it('should allow checking the availability of a controller', () => {
      $controllerProvider.register('FooCtrl', noop);
      $controllerProvider.register('BarCtrl', ['dep1', 'dep2', noop]);
      $controllerProvider.register({
        'BazCtrl': noop,
        'QuxCtrl': ['dep1', 'dep2', noop]
      });

      expect($controllerProvider.has('FooCtrl')).toBe(true);
      expect($controllerProvider.has('BarCtrl')).toBe(true);
      expect($controllerProvider.has('BazCtrl')).toBe(true);
      expect($controllerProvider.has('QuxCtrl')).toBe(true);

      expect($controllerProvider.has('UnknownCtrl')).toBe(false);
    });


    it('should throw ctrlfmt if name contains spaces', () => {
      expect(() => {
        $controller('ctrl doom');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl doom\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });
  });


  it('should return instance of given controller class', () => {
    const MyClass = function() {};
        const ctrl = $controller(MyClass);

    expect(ctrl).toBeDefined();
    expect(ctrl instanceof MyClass).toBe(true);
  });

  it('should inject arguments', inject(($http) => {
    const MyClass = function($http) {
      this.$http = $http;
    };

    const ctrl = $controller(MyClass);
    expect(ctrl.$http).toBe($http);
  }));


  it('should inject given scope', () => {
    const MyClass = function($scope) {
      this.$scope = $scope;
    };

    const scope = {};
        const ctrl = $controller(MyClass, {$scope: scope});

    expect(ctrl.$scope).toBe(scope);
  });


  it('should not instantiate a controller defined on window', inject(($window) => {
    const scope = {};
    const Foo = function() {};

    $window.a = {Foo};

    expect(() => {
      $controller('a.Foo', {$scope: scope});
    }).toThrow();
  }));

  it('should throw ctrlreg when the controller name does not match a registered controller', () => {
    expect(() => {
      $controller('IDoNotExist', {$scope: {}});
    }).toThrowMinErr('$controller', 'ctrlreg', 'The controller with the name \'IDoNotExist\' is not registered.');
  });


  describe('ctrl as syntax', () => {

    it('should publish controller instance into scope', () => {
      const scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      const foo = $controller('FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    it('should allow controllers with dots', () => {
      const scope = {};

      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      const foo = $controller('a.b.FooCtrl as foo', {$scope: scope});
      expect(scope.foo).toBe(foo);
      expect(scope.foo.mark).toBe('foo');
    });


    it('should throw an error if $scope is not provided', () => {
      $controllerProvider.register('a.b.FooCtrl', function() { this.mark = 'foo'; });

      expect(() => {
        $controller('a.b.FooCtrl as foo');
      }).toThrowMinErr('$controller', 'noscp', 'Cannot export controller \'a.b.FooCtrl\' as \'foo\'! No $scope object provided via `locals`.');

    });


    it('should throw ctrlfmt if identifier contains non-ident characters', () => {
      expect(() => {
        $controller('ctrl as foo<bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo<bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    it('should throw ctrlfmt if identifier contains spaces', () => {
      expect(() => {
        $controller('ctrl as foo bar');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as foo bar\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });


    it('should throw ctrlfmt if identifier missing after " as "', () => {
      expect(() => {
        $controller('ctrl as ');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as \'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
      expect(() => {
        $controller('ctrl as');
      }).toThrowMinErr('$controller', 'ctrlfmt',
                       'Badly formed controller string \'ctrl as\'. ' +
                       'Must match `__name__ as __id__` or `__name__`.');
    });

    it('should allow identifiers containing `$`', () => {
      const scope = {};

      $controllerProvider.register('FooCtrl', function() { this.mark = 'foo'; });

      const foo = $controller('FooCtrl as $foo', {$scope: scope});
      expect(scope.$foo).toBe(foo);
      expect(scope.$foo.mark).toBe('foo');
    });
  });
});
