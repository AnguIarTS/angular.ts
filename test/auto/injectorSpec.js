

describe('injector.modules', () => {
    it('should expose the loaded module info on the instance injector', () => {
      const test1 = angular.module('test1', ['test2']).info({ version: '1.1' });
      const test2 = angular.module('test2', []).info({ version: '1.2' });
      module('test1');
      inject(['$injector', function($injector) {
        expect(Object.keys($injector.modules)).toEqual(['ng', 'ngLocale', 'ngMock', 'test1', 'test2']);
        expect($injector.modules.test1.info()).toEqual({ version: '1.1' });
        expect($injector.modules.test2.info()).toEqual({ version: '1.2' });
      }]);
    });

    it('should expose the loaded module info on the provider injector', () => {
      let providerInjector;
      const test1 = angular.module('test1', ['test2']).info({ version: '1.1' });
      const test2 = angular.module('test2', [])
        .info({ version: '1.2' })
        .provider('test', ['$injector', function($injector) {
          providerInjector = $injector;
          return {$get() {}};
        }]);
      module('test1');
      // needed to ensure that the provider blocks are executed
      inject();

      expect(Object.keys(providerInjector.modules)).toEqual(['ng', 'ngLocale', 'ngMock', 'test1', 'test2']);
      expect(providerInjector.modules.test1.info()).toEqual({ version: '1.1' });
      expect(providerInjector.modules.test2.info()).toEqual({ version: '1.2' });
    });
});

describe('injector', () => {
  let providers;
  let injector;
  let providerInjector;
  let controllerProvider;

  beforeEach(module(($provide, $injector, $controllerProvider) => {
    providers = function(name, factory, annotations) {
      $provide.factory(name, extend(factory, annotations || {}));
    };
    providerInjector = $injector;
    controllerProvider = $controllerProvider;
  }));
  beforeEach(inject(($injector) => {
    injector = $injector;
  }));


  it('should return same instance from calling provider', () => {
    let instance = {};
        const original = instance;
    providers('instance', () => instance);
    expect(injector.get('instance')).toEqual(instance);
    instance = 'deleted';
    expect(injector.get('instance')).toEqual(original);
  });


  it('should inject providers', () => {
    providers('a', () => 'Mi');
    providers('b', (mi) => `${mi  }sko`, {$inject:['a']});
    expect(injector.get('b')).toEqual('Misko');
  });


  it('should check its modulesToLoad argument', () => {
    expect(() => { angular.injector('test'); })
        .toThrowMinErr('ng', 'areq');
  });


  it('should resolve dependency graph and instantiate all services just once', () => {
    const log = [];

    //          s1
    //        /  | \
    //       /  s2  \
    //      /  / | \ \
    //     /s3 < s4 > s5
    //    //
    //   s6

    providers('s1', () => { log.push('s1'); return {}; }, {$inject: ['s2', 's5', 's6']});
    providers('s2', () => { log.push('s2'); return {}; }, {$inject: ['s3', 's4', 's5']});
    providers('s3', () => { log.push('s3'); return {}; }, {$inject: ['s6']});
    providers('s4', () => { log.push('s4'); return {}; }, {$inject: ['s3', 's5']});
    providers('s5', () => { log.push('s5'); return {}; });
    providers('s6', () => { log.push('s6'); return {}; });

    injector.get('s1');

    expect(log).toEqual(['s6', 's3', 's5', 's4', 's2', 's1']);
  });


  it('should allow query names', () => {
    providers('abc', () => '');

    expect(injector.has('abc')).toBe(true);
    expect(injector.has('xyz')).toBe(false);
    expect(injector.has('$injector')).toBe(true);
  });


  it('should provide useful message if no provider', () => {
    expect(() => {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  it('should provide the caller name if given', () => {
    expect(() => {
      injector.get('idontexist', 'callerName');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- callerName');
  });


  it('should provide the caller name for controllers', () => {
    controllerProvider.register('myCtrl', (idontexist) => {});
    const $controller = injector.get('$controller');
    expect(() => {
      $controller('myCtrl', {$scope: {}});
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- myCtrl');
  });


  it('should not corrupt the cache when an object fails to get instantiated', () => {
    expect(() => {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');

    expect(() => {
      injector.get('idontexist');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist');
  });


  it('should provide path to the missing provider', () => {
    providers('a', (idontexist) => 1);
    providers('b', (a) => 2);
    expect(() => {
      injector.get('b');
    }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: idontexistProvider <- idontexist <- a <- b');
  });


  it('should create a new $injector for the run phase', inject(($injector) => {
    expect($injector).not.toBe(providerInjector);
  }));


  describe('loadNewModules', () => {
    it('should be defined on $injector', () => {
      const injector = createInjector([]);
      expect(injector.loadNewModules).toEqual(jasmine.any(Function));
    });

    it('should allow new modules to be added after injector creation', () => {
      angular.module('initial', []);
      const injector = createInjector(['initial']);
      expect(injector.modules.initial).toBeDefined();
      expect(injector.modules.lazy).toBeUndefined();
      angular.module('lazy', []);
      injector.loadNewModules(['lazy']);
      expect(injector.modules.lazy).toBeDefined();
    });

    it('should execute runBlocks of new modules', () => {
      const log = [];
      angular.module('initial', []).run(() => { log.push('initial'); });
      const injector = createInjector(['initial']);
      log.push('created');

      angular.module('a', []).run(() => { log.push('a'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'a']);
    });

    it('should execute configBlocks of new modules', () => {
      const log = [];
      angular.module('initial', []).config(() => { log.push('initial'); });
      const injector = createInjector(['initial']);
      log.push('created');

      angular.module('a', [], () => { log.push('config1'); }).config(() => { log.push('config2'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'created', 'config1', 'config2']);
    });

    it('should execute runBlocks and configBlocks in the correct order', () => {
      const log = [];
      angular.module('initial', [], () => { log.push(1); })
        .config(() => { log.push(2); })
        .run(() => { log.push(3); });
      const injector = createInjector(['initial']);
      log.push('created');

      angular.module('a', [], () => { log.push(4); })
        .config(() => { log.push(5); })
        .run(() => { log.push(6); });
      injector.loadNewModules(['a']);
      expect(log).toEqual([1, 2, 3, 'created', 4, 5, 6]);
    });

    it('should load dependent modules', () => {
      angular.module('initial', []);
      const injector = createInjector(['initial']);
      expect(injector.modules.initial).toBeDefined();
      expect(injector.modules.lazy1).toBeUndefined();
      expect(injector.modules.lazy2).toBeUndefined();
      angular.module('lazy1', ['lazy2']);
      angular.module('lazy2', []);
      injector.loadNewModules(['lazy1']);
      expect(injector.modules.lazy1).toBeDefined();
      expect(injector.modules.lazy2).toBeDefined();
    });

    it('should execute blocks of new modules in the correct order', () => {
      const log = [];
      angular.module('initial', []);
      const injector = createInjector(['initial']);

      angular.module('lazy1', ['lazy2'], () => { log.push('lazy1-1'); })
        .config(() => { log.push('lazy1-2'); })
        .run(() => { log.push('lazy1-3'); });
      angular.module('lazy2', [], () => { log.push('lazy2-1'); })
        .config(() => { log.push('lazy2-2'); })
        .run(() => { log.push('lazy2-3'); });

      injector.loadNewModules(['lazy1']);
      expect(log).toEqual(['lazy2-1', 'lazy2-2', 'lazy1-1', 'lazy1-2', 'lazy2-3', 'lazy1-3']);
    });

    it('should not reload a module that is already loaded', () => {
      const log = [];
      angular.module('initial', []).run(() => { log.push('initial'); });
      const injector = createInjector(['initial']);
      expect(log).toEqual(['initial']);

      injector.loadNewModules(['initial']);
      expect(log).toEqual(['initial']);

      angular.module('a', []).run(() => { log.push('a'); });
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'a']);
      injector.loadNewModules(['a']);
      expect(log).toEqual(['initial', 'a']);

      angular.module('b', ['a']).run(() => { log.push('b'); });
      angular.module('c', []).run(() => { log.push('c'); });
      angular.module('d', ['b', 'c']).run(() => { log.push('d'); });
      injector.loadNewModules(['d']);
      expect(log).toEqual(['initial', 'a', 'b', 'c', 'd']);
    });

    it('should be able to register a service from a new module', () => {
      const injector = createInjector([]);
      angular.module('a', []).factory('aService', () => ({sayHello() { return 'Hello'; }}));
      injector.loadNewModules(['a']);
      injector.invoke((aService) => {
        expect(aService.sayHello()).toEqual('Hello');
      });
    });


    it('should be able to register a controller from a new module', () => {
      const injector = createInjector(['ng']);
      angular.module('a', []).controller('aController', ($scope) => {
        $scope.test = 'b';
      });
      injector.loadNewModules(['a']);
      injector.invoke(($controller) => {
        const scope = {};
        $controller('aController', {$scope: scope});
        expect(scope.test).toEqual('b');
      });
    });


    it('should be able to register a filter from a new module', () => {
      const injector = createInjector(['ng']);
      angular.module('a', []).filter('aFilter', () => function(input) { return `${input  } filtered`; });
      injector.loadNewModules(['a']);
      injector.invoke((aFilterFilter) => {
        expect(aFilterFilter('test')).toEqual('test filtered');
      });
    });


    it('should be able to register a directive from a new module', () => {
      const injector = createInjector(['ng']);
      angular.module('a', []).directive('aDirective', () => ({template: 'test directive'}));
      injector.loadNewModules(['a']);
      injector.invoke(($compile, $rootScope) => {
        const elem = $compile('<div a-directive></div>')($rootScope);  // compile and link
        $rootScope.$digest();
        expect(elem.text()).toEqual('test directive');
        elem.remove();
      });
    });
  });

  it('should have a false strictDi property', inject(($injector) => {
    expect($injector.strictDi).toBe(false);
  }));


  describe('invoke', () => {
    let args;

    beforeEach(() => {
      args = null;
      providers('a', () => 1);
      providers('b', () => 2);
    });


    function Fn(a, b, c, d) {
      args = [this, a, b, c, d];
      return a + b + c + d;
    }


    it('should call function', () => {
      Fn.$inject = ['a', 'b', 'c', 'd'];
      injector.invoke(Fn, {name:'this'},  {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    it('should treat array as annotations', () => {
      injector.invoke(['a', 'b', 'c', 'd', Fn], {name:'this'}, {c:3, d:4});
      expect(args).toEqual([{name:'this'}, 1, 2, 3, 4]);
    });


    it('should invoke the passed-in fn with all of the dependencies as arguments', () => {
      providers('c', () => 3);
      providers('d', () => 4);
      expect(injector.invoke(['a', 'b', 'c', 'd', Fn])).toEqual(10);
    });


    it('should fail with errors if not function or array', () => {
      expect(() => {
        injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
      expect(() => {
        injector.invoke(['a', 123], {});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got number');
    });
  });


  describe('annotation', () => {
    /* global annotate: false */
    it('should return $inject', () => {
      function fn() {}
      fn.$inject = ['a'];
      expect(annotate(fn)).toBe(fn.$inject);
      expect(annotate(() => {})).toEqual([]);
      expect(annotate(() => {})).toEqual([]);
      /* eslint-disable space-before-function-paren, no-multi-spaces */
      expect(annotate(() => {})).toEqual([]);
      expect(annotate( /* */ () => {})).toEqual([]);
      /* eslint-enable */
    });


    it('should create $inject', () => {
      const extraParams = angular.noop;
      /* eslint-disable space-before-function-paren */
      // keep the multi-line to make sure we can handle it
      function $f_n0 /*
          */(
          $a, // x, <-- looks like an arg but it is a comment
          b_, /* z, <-- looks like an arg but it is a
                 multi-line comment
                 function(a, b) {}
                 */
          _c,
          /* {some type} */ d) { extraParams(); }
      /* eslint-enable */
      expect(annotate($f_n0)).toEqual(['$a', 'b_', '_c',  'd']);
      expect($f_n0.$inject).toEqual(['$a', 'b_', '_c',  'd']);
    });


    it('should strip leading and trailing underscores from arg name during inference', () => {
      function beforeEachFn(_foo_) { /* foo = _foo_ */ }
      expect(annotate(beforeEachFn)).toEqual(['foo']);
    });

    it('should not strip service names with a single underscore', () => {
      function beforeEachFn(_) { /* _ = _ */ }
      expect(annotate(beforeEachFn)).toEqual(['_']);
    });

    it('should handle no arg functions', () => {
      function $f_n0() {}
      expect(annotate($f_n0)).toEqual([]);
      expect($f_n0.$inject).toEqual([]);
    });


    it('should handle no arg functions with spaces in the arguments list', () => {
      function fn() {}
      expect(annotate(fn)).toEqual([]);
      expect(fn.$inject).toEqual([]);
    });


    it('should handle args with both $ and _', () => {
      function $f_n0($a_) {}
      expect(annotate($f_n0)).toEqual(['$a_']);
      expect($f_n0.$inject).toEqual(['$a_']);
    });

    it('should handle functions with overridden toString', () => {
      function fn(a) {}
      fn.toString = function() { return 'fn'; };
      expect(annotate(fn)).toEqual(['a']);
      expect(fn.$inject).toEqual(['a']);
    });

    it('should throw on non function arg', () => {
      expect(() => {
        annotate({});
      }).toThrow();
    });


    describe('es6', () => {
      if (support.shorthandMethods) {
        // The functions are generated using `eval` as just having the ES6 syntax can break some browsers.
        it('should be possible to annotate shorthand methods', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('({ fn(x) { return; } })').fn)).toEqual(['x']);
        });
      }


      if (support.fatArrows) {
        it('should create $inject for arrow functions', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('(a, b) => a'))).toEqual(['a', 'b']);
        });
      }


      if (support.fatArrows) {
        it('should create $inject for arrow functions with no parenthesis', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('a => a'))).toEqual(['a']);
        });
      }


      if (support.fatArrows) {
        it('should take args before first arrow', () => {
          // eslint-disable-next-line no-eval
          expect(annotate(eval('a => b => b'))).toEqual(['a']);
        });
      }

      if (support.classes) {
        it('should be possible to instantiate ES6 classes', () => {
          providers('a', () => 'a-value');
          // eslint-disable-next-line no-eval
          const Clazz = eval('(class { constructor(a) { this.a = a; } aVal() { return this.a; } })');
          const instance = injector.instantiate(Clazz);
          expect(instance).toEqual(new Clazz('a-value'));
          expect(instance.aVal()).toEqual('a-value');
        });

        they('should detect ES6 classes regardless of whitespace/comments ($prop)', [
          'class Test {}',
          'class Test{}',
          'class //<--ES6 stuff\nTest {}',
          'class//<--ES6 stuff\nTest {}',
          'class {}',
          'class{}',
          'class //<--ES6 stuff\n {}',
          'class//<--ES6 stuff\n {}',
          'class/* Test */{}',
          'class /* Test */ {}'
        ], (classDefinition) => {
          // eslint-disable-next-line no-eval
          const Clazz = eval(`(${  classDefinition  })`);
          const instance = injector.invoke(Clazz);

          expect(instance).toEqual(jasmine.any(Clazz));
        });
      }
    });


    it('should publish annotate API', () => {
      expect(angular.mock.$$annotate).toBe(annotate);
      spyOn(angular.mock, '$$annotate').and.callThrough();
      function fn() {}
      injector.annotate(fn);
      expect(angular.mock.$$annotate).toHaveBeenCalledWith(fn);
    });
  });


  it('should have $injector', () => {
    const $injector = createInjector();
    expect($injector.get('$injector')).toBe($injector);
  });


  it('should define module', () => {
    let log = '';
    const injector = createInjector([function($provide) {
      $provide.value('value', 'value;');
      $provide.factory('fn', valueFn('function;'));
      $provide.provider('service', function Provider() {
        this.$get = valueFn('service;');
      });
    }, function(valueProvider, fnProvider, serviceProvider) {
      log += valueProvider.$get() + fnProvider.$get() + serviceProvider.$get();
    }]).invoke((value, fn, service) => {
      log += `->${  value  }${fn  }${service}`;
    });
    expect(log).toEqual('value;function;service;->value;function;service;');
  });


  describe('module', () => {
    it('should provide $injector even when no module is requested', () => {
      let $provide;
        const $injector = createInjector([
          angular.extend((p) => { $provide = p; }, {$inject: ['$provide']})
        ]);
      expect($injector.get('$injector')).toBe($injector);
    });


    it('should load multiple function modules and infer inject them', () => {
      let a = 'junk';
      const $injector = createInjector([
        function() {
          a = 'A'; // reset to prove we ran
        },
        function($provide) {
          $provide.value('a', a);
        },
        angular.extend((p, serviceA) => {
          p.value('b', `${serviceA.$get()  }B`);
        }, {$inject:['$provide', 'aProvider']}),
        ['$provide', 'bProvider', function(p, serviceB) {
          p.value('c', `${serviceB.$get()  }C`);
        }]
      ]);
      expect($injector.get('a')).toEqual('A');
      expect($injector.get('b')).toEqual('AB');
      expect($injector.get('c')).toEqual('ABC');
    });


    it('should run symbolic modules', () => {
      angularModule('myModule', []).value('a', 'abc');
      const $injector = createInjector(['myModule']);
      expect($injector.get('a')).toEqual('abc');
    });


    it('should error on invalid module name', () => {
      expect(() => {
        createInjector(['IDontExist'], {});
      }).toThrowMinErr('$injector', 'modulerr',
        /\[\$injector:nomod] Module 'IDontExist' is not available! You either misspelled the module name or forgot to load it/);
    });


    it('should load dependant modules only once', () => {
      let log = '';
      angular.module('a', [], () => { log += 'a'; });
      angular.module('b', ['a'], () => { log += 'b'; });
      angular.module('c', ['a', 'b'], () => { log += 'c'; });
      createInjector(['c', 'c']);
      expect(log).toEqual('abc');
    });

    it('should load different instances of dependent functions', () => {
      function  generateValueModule(name, value) {
        return function($provide) {
          $provide.value(name, value);
        };
      }
      const injector = createInjector([generateValueModule('name1', 'value1'),
                                     generateValueModule('name2', 'value2')]);
      expect(injector.get('name2')).toBe('value2');
    });

    it('should load same instance of dependent function only once', () => {
      let count = 0;
      function valueModule($provide) {
        count++;
        $provide.value('name', 'value');
      }

      const injector = createInjector([valueModule, valueModule]);
      expect(injector.get('name')).toBe('value');
      expect(count).toBe(1);
    });

    it('should execute runBlocks after injector creation', () => {
      let log = '';
      angular.module('a', [], () => { log += 'a'; }).run(() => { log += 'A'; });
      angular.module('b', ['a'], () => { log += 'b'; }).run(() => { log += 'B'; });
      createInjector([
        'b',
        valueFn(() => { log += 'C'; }),
        [valueFn(() => { log += 'D'; })]
      ]);
      expect(log).toEqual('abABCD');
    });

    it('should execute own config blocks after all own providers are invoked', () => {
      let log = '';
      angular.module('a', ['b'])
      .config(($aProvider) => {
        log += 'aConfig;';
      })
      .provider('$a', function Provider$a() {
        log += '$aProvider;';
        this.$get = function() {};
      });
      angular.module('b', [])
      .config(($bProvider) => {
        log += 'bConfig;';
      })
      .provider('$b', function Provider$b() {
        log += '$bProvider;';
        this.$get = function() {};
      });

      createInjector(['a']);
      expect(log).toBe('$bProvider;bConfig;$aProvider;aConfig;');
    });

    describe('$provide', () => {

      it('should throw an exception if we try to register a service called "hasOwnProperty"', () => {
        createInjector([function($provide) {
          expect(() => {
            $provide.provider('hasOwnProperty', () => {  });
          }).toThrowMinErr('ng', 'badname');
        }]);
      });

      it('should throw an exception if we try to register a constant called "hasOwnProperty"', () => {
        createInjector([function($provide) {
          expect(() => {
            $provide.constant('hasOwnProperty', {});
          }).toThrowMinErr('ng', 'badname');
        }]);
      });


      describe('constant', () => {
        it('should create configuration injectable constants', () => {
          const log = [];
          createInjector([
            function($provide) {
              $provide.constant('abc', 123);
              $provide.constant({a: 'A', b:'B'});
              return function(a) {
                log.push(a);
              };
            },
            function(abc) {
              log.push(abc);
              return function(b) {
                log.push(b);
              };
            }
          ]).get('abc');
          expect(log).toEqual([123, 'A', 'B']);
        });
      });


      describe('value', () => {
        it('should configure $provide values', () => {
          expect(createInjector([function($provide) {
            $provide.value('value', 'abc');
          }]).get('value')).toEqual('abc');
        });


        it('should configure a set of values', () => {
          expect(createInjector([function($provide) {
            $provide.value({value: Array});
          }]).get('value')).toEqual(Array);
        });
      });


      describe('factory', () => {
        it('should configure $provide factory function', () => {
          expect(createInjector([function($provide) {
            $provide.factory('value', valueFn('abc'));
          }]).get('value')).toEqual('abc');
        });


        it('should configure a set of factories', () => {
          expect(createInjector([function($provide) {
            $provide.factory({value: Array});
          }]).get('value')).toEqual([]);
        });
      });


      describe('service', () => {
        it('should register a class', () => {
          function Type(value) {
            this.value = value;
          }

          const instance = createInjector([function($provide) {
            $provide.value('value', 123);
            $provide.service('foo', Type);
          }]).get('foo');

          expect(instance instanceof Type).toBe(true);
          expect(instance.value).toBe(123);
        });


        it('should register a set of classes', () => {
          const Type = function() {};

          const injector = createInjector([function($provide) {
            $provide.service({
              foo: Type,
              bar: Type
            });
          }]);

          expect(injector.get('foo') instanceof Type).toBe(true);
          expect(injector.get('bar') instanceof Type).toBe(true);
        });
      });


      describe('provider', () => {
        it('should configure $provide provider object', () => {
          expect(createInjector([function($provide) {
            $provide.provider('value', {
              $get: valueFn('abc')
            });
          }]).get('value')).toEqual('abc');
        });


        it('should configure $provide provider type', () => {
          function Type() {}
          Type.prototype.$get = function() {
            expect(this instanceof Type).toBe(true);
            return 'abc';
          };
          expect(createInjector([function($provide) {
            $provide.provider('value', Type);
          }]).get('value')).toEqual('abc');
        });


        it('should configure $provide using an array', () => {
          function Type(PREFIX) {
            this.prefix = PREFIX;
          }
          Type.prototype.$get = function() {
            return `${this.prefix  }def`;
          };
          expect(createInjector([function($provide) {
            $provide.constant('PREFIX', 'abc');
            $provide.provider('value', ['PREFIX', Type]);
          }]).get('value')).toEqual('abcdef');
        });


        it('should configure a set of providers', () => {
          expect(createInjector([function($provide) {
            $provide.provider({value: valueFn({$get:Array})});
          }]).get('value')).toEqual([]);
        });
      });


      describe('decorator', () => {
        let log; let injector;

        beforeEach(() => {
          log = [];
        });


        it('should be called with the original instance', () => {
          injector = createInjector([function($provide) {
            $provide.value('myService', (val) => {
              log.push(`myService:${  val}`);
              return 'origReturn';
            });

            $provide.decorator('myService', ($delegate) => function(val) {
                log.push(`myDecoratedService:${  val}`);
                const origVal = $delegate('decInput');
                return `dec+${  origVal}`;
              });
          }]);

          const out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input; myService:decInput; dec+origReturn');
        });


        it('should allow multiple decorators to be applied to a service', () => {
          injector = createInjector([function($provide) {
            $provide.value('myService', (val) => {
              log.push(`myService:${  val}`);
              return 'origReturn';
            });

            $provide.decorator('myService', ($delegate) => function(val) {
                log.push(`myDecoratedService1:${  val}`);
                const origVal = $delegate('decInput1');
                return `dec1+${  origVal}`;
              });

            $provide.decorator('myService', ($delegate) => function(val) {
                log.push(`myDecoratedService2:${  val}`);
                const origVal = $delegate('decInput2');
                return `dec2+${  origVal}`;
              });
          }]);

          const out = injector.get('myService')('input');
          log.push(out);
          expect(log).toEqual(['myDecoratedService2:input',
                               'myDecoratedService1:decInput2',
                               'myService:decInput1',
                               'dec2+dec1+origReturn']);
        });


        it('should decorate services with dependencies', () => {
          injector = createInjector([function($provide) {
            $provide.value('dep1', 'dependency1');

            $provide.factory('myService', ['dep1', function(dep1) {
              return function(val) {
                log.push(`myService:${  val  },${  dep1}`);
                return 'origReturn';
              };
            }]);

            $provide.decorator('myService', ($delegate) => function(val) {
                log.push(`myDecoratedService:${  val}`);
                const origVal = $delegate('decInput');
                return `dec+${  origVal}`;
              });
          }]);

          const out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input; myService:decInput,dependency1; dec+origReturn');
        });


        it('should allow for decorators to be injectable', () => {
          injector = createInjector([function($provide) {
            $provide.value('dep1', 'dependency1');

            $provide.factory('myService', () => function(val) {
                log.push(`myService:${  val}`);
                return 'origReturn';
              });

            $provide.decorator('myService', ($delegate, dep1) => function(val) {
                log.push(`myDecoratedService:${  val  },${  dep1}`);
                const origVal = $delegate('decInput');
                return `dec+${  origVal}`;
              });
          }]);

          const out = injector.get('myService')('input');
          log.push(out);
          expect(log.join('; ')).
            toBe('myDecoratedService:input,dependency1; myService:decInput; dec+origReturn');
        });


        it('should allow for decorators to $injector', () => {
          injector = createInjector(['ng', function($provide) {
            $provide.decorator('$injector', ($delegate) => extend({}, $delegate, {get(val) {
                if (val === 'key') {
                  return 'value';
                }
                return $delegate.get(val);
              }}));
          }]);

          expect(injector.get('key')).toBe('value');
          expect(injector.get('$http')).not.toBeUndefined();
        });
      });
    });


    describe('error handling', () => {
      it('should handle wrong argument type', () => {
        expect(() => {
          createInjector([
            {}
          ], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module \{\} due to:\n.*\[ng:areq] Argument 'module' is not a function, got Object/);
      });


      it('should handle exceptions', () => {
        expect(() => {
          createInjector([function() {
            throw new Error('MyError');
          }], {});
        }).toThrowMinErr('$injector', 'modulerr', /Failed to instantiate module .+ due to:\n.*MyError/);
      });


      it('should decorate the missing service error with module name', () => {
        angular.module('TestModule', [], (xyzzy) => {});
        expect(() => {
          createInjector(['TestModule']);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module TestModule due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should decorate the missing service error with module function', () => {
        function myModule(xyzzy) {}
        expect(() => {
          createInjector([myModule]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should decorate the missing service error with module array function', () => {
        function myModule(xyzzy) {}
        expect(() => {
          createInjector([['xyzzy', myModule]]);
        }).toThrowMinErr(
          '$injector', 'modulerr', /Failed to instantiate module function myModule\(xyzzy\) due to:\n.*\[\$injector:unpr] Unknown provider: xyzzy/
        );
      });


      it('should throw error when trying to inject oneself', () => {
        expect(() => {
          createInjector([function($provide) {
            $provide.factory('service', (service) => {});
            return function(service) {};
          }]);
        }).toThrowMinErr('$injector', 'cdep', 'Circular dependency found: service <- service');
      });


      it('should throw error when trying to inject circular dependency', () => {
        expect(() => {
          createInjector([function($provide) {
            $provide.factory('a', (b) => {});
            $provide.factory('b', (a) => {});
            return function(a) {};
          }]);
        }).toThrowMinErr('$injector', 'cdep', 'Circular dependency found: a <- b <- a');
      });

    });
  });


  describe('retrieval', () => {
    const instance = {name:'angular'};
    function Instance() { this.name = 'angular'; }

    function createInjectorWithValue(instanceName, instance) {
      return createInjector([['$provide', function(provide) {
        provide.value(instanceName, instance);
      }]]);
    }
    function createInjectorWithFactory(serviceName, serviceDef) {
      return createInjector([['$provide', function(provide) {
        provide.factory(serviceName, serviceDef);
      }]]);
    }


    it('should retrieve by name', () => {
      const $injector = createInjectorWithValue('instance', instance);
      const retrievedInstance = $injector.get('instance');
      expect(retrievedInstance).toBe(instance);
    });


    it('should cache instance', () => {
      const $injector = createInjectorWithFactory('instance', () => new Instance());
      const instance = $injector.get('instance');
      expect($injector.get('instance')).toBe(instance);
      expect($injector.get('instance')).toBe(instance);
    });


    it('should call functions and infer arguments', () => {
      const $injector = createInjectorWithValue('instance', instance);
      expect($injector.invoke((instance) => instance)).toBe(instance);
    });

  });


  describe('method invoking', () => {
    let $injector;

    beforeEach(() => {
      $injector = createInjector([function($provide) {
        $provide.value('book', 'moby');
        $provide.value('author', 'melville');
      }]);
    });


    it('should invoke method', () => {
      expect($injector.invoke((book, author) => `${author  }:${  book}`)).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return `${author  }:${  book}`;
      }, $injector)).toEqual('melville:moby');
    });


    it('should invoke method with locals', () => {
      expect($injector.invoke((book, author) => `${author  }:${  book}`)).toEqual('melville:moby');
      expect($injector.invoke(
        function(book, author, chapter) {
          expect(this).toEqual($injector);
          return `${author  }:${  book  }-${  chapter}`;
        }, $injector, {author:'m', chapter:'ch1'})).toEqual('m:moby-ch1');
    });


    it('should invoke method which is annotated', () => {
      expect($injector.invoke(extend((b, a) => `${a  }:${  b}`, {$inject:['book', 'author']}))).toEqual('melville:moby');
      expect($injector.invoke(extend(function(b, a) {
        expect(this).toEqual($injector);
        return `${a  }:${  b}`;
      }, {$inject:['book', 'author']}), $injector)).toEqual('melville:moby');
    });


    it('should invoke method which is an array of annotation', () => {
      expect($injector.invoke((book, author) => `${author  }:${  book}`)).toEqual('melville:moby');
      expect($injector.invoke(function(book, author) {
        expect(this).toEqual($injector);
        return `${author  }:${  book}`;
      }, $injector)).toEqual('melville:moby');
    });


    it('should throw useful error on wrong argument type]', () => {
      expect(() => {
        $injector.invoke({});
      }).toThrowMinErr('ng', 'areq', 'Argument \'fn\' is not a function, got Object');
    });
  });


  describe('service instantiation', () => {
    let $injector;

    beforeEach(() => {
      $injector = createInjector([function($provide) {
        $provide.value('book', 'moby');
        $provide.value('author', 'melville');
      }]);
    });


    function Type(book, author) {
      this.book = book;
      this.author = author;
    }
    Type.prototype.title = function() {
      return `${this.author  }: ${  this.book}`;
    };


    it('should instantiate object and preserve constructor property and be instanceof', () => {
      const t = $injector.instantiate(Type);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    it('should instantiate object and preserve constructor property and be instanceof ' +
        'with the array annotated type', () => {
      const t = $injector.instantiate(['book', 'author', Type]);
      expect(t.book).toEqual('moby');
      expect(t.author).toEqual('melville');
      expect(t.title()).toEqual('melville: moby');
      expect(t instanceof Type).toBe(true);
    });


    it('should allow constructor to return different object', () => {
      const obj = {};
      const Class = function() {
        return obj;
      };

      expect($injector.instantiate(Class)).toBe(obj);
    });


    it('should allow constructor to return a function', () => {
      const fn = function() {};
      const Class = function() {
        return fn;
      };

      expect($injector.instantiate(Class)).toBe(fn);
    });


    it('should handle constructor exception', () => {
      expect(() => {
        $injector.instantiate(() => { throw 'MyError'; });
      }).toThrow('MyError');
    });


    it('should return instance if constructor returns non-object value', () => {
      const A = function() {
        return 10;
      };

      const B = function() {
        return 'some-string';
      };

      const C = function() {
        return undefined;
      };

      expect($injector.instantiate(A) instanceof A).toBe(true);
      expect($injector.instantiate(B) instanceof B).toBe(true);
      expect($injector.instantiate(C) instanceof C).toBe(true);
    });
  });

  describe('protection modes', () => {
    it('should prevent provider lookup in app', () => {
      const  $injector = createInjector([function($provide) {
        $provide.value('name', 'angular');
      }]);
      expect(() => {
        $injector.get('nameProvider');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: nameProviderProvider <- nameProvider');
    });


    it('should prevent provider configuration in app', () => {
      const  $injector = createInjector([]);
      expect(() => {
        $injector.get('$provide').value('a', 'b');
      }).toThrowMinErr('$injector', 'unpr', 'Unknown provider: $provideProvider <- $provide');
    });


    it('should prevent instance lookup in module', () => {
      function instanceLookupInModule(name) { throw new Error('FAIL'); }
      expect(() => {
        createInjector([function($provide) {
          $provide.value('name', 'angular');
        }, instanceLookupInModule]);
      }).toThrowMinErr('$injector', 'modulerr', '[$injector:unpr] Unknown provider: name');
    });
  });
});

describe('strict-di injector', () => {
  beforeEach(inject.strictDi(true));

  describe('with ngMock', () => {
    it('should not throw when calling mock.module() with "magic" annotations', () => {
      expect(() => {
        module(($provide, $httpProvider, $compileProvider) => {
          // Don't throw!
        });
      }).not.toThrow();
    });


    it('should not throw when calling mock.inject() with "magic" annotations', () => {
      expect(() => {
        inject(($rootScope, $compile, $http) => {
          // Don't throw!
        });
      }).not.toThrow();
    });
  });


  it('should throw if magic annotation is used by service', () => {
    module(($provide) => {
      $provide.service({
        '$test': function() { return this; },
        '$test2': function($test) { return this; }
      });
    });
    inject(($injector) => {
      expect(() => {
        $injector.invoke(($test2) => {});
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  it('should throw if magic annotation is used by provider', () => {
    module(($provide) => {
      $provide.provider({
        '$test': function() { this.$get = function($rootScope) { return $rootScope; }; }
      });
    });
    inject(($injector) => {
      expect(() => {
        $injector.invoke(['$test', function($test) {}]);
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  it('should throw if magic annotation is used by factory', () => {
    module(($provide) => {
      $provide.factory({
        '$test': function($rootScope) { return function() {}; }
      });
    });
    inject(($injector) => {
      expect(() => {
        $injector.invoke(['$test', function(test) {}]);
      }).toThrowMinErr('$injector', 'strictdi');
    });
  });


  it('should throw if factory does not return a value', () => {
    module(($provide) => {
      $provide.factory('$test', () => {});
    });
    expect(() => {
      inject(($test) => {});
    }).toThrowMinErr('$injector', 'undef');
  });


  it('should always use provider as `this` when invoking a factory', () => {
    let called = false;

    function factoryFn() {
      called = true;
      expect(typeof this.$get).toBe('function');
      return this;
    }
    module(($provide) => {
      $provide.factory('$test', factoryFn);
    });
    inject(($test) => {});
    expect(called).toBe(true);
  });

  it('should set strictDi property to true on the injector instance', inject(($injector) => {
    expect($injector.strictDi).toBe(true);
  }));
});
