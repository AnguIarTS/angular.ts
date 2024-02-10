

/* eslint-disable no-script-url */

describe('ngProp*', () => {
  it('should bind boolean properties (input disabled)', inject(($rootScope, $compile) => {
    const element = $compile('<button ng-prop-disabled="isDisabled">Button</button>')($rootScope);
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(false);
    $rootScope.isDisabled = true;
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(true);
    $rootScope.isDisabled = false;
    $rootScope.$digest();
    expect(element.prop('disabled')).toBe(false);
  }));

  it('should bind boolean properties (input checked)', inject(($rootScope, $compile) => {
    const element = $compile('<input type="checkbox" ng-prop-checked="isChecked" />')($rootScope);
    expect(element.prop('checked')).toBe(false);
    $rootScope.isChecked = true;
    $rootScope.$digest();
    expect(element.prop('checked')).toBe(true);
    $rootScope.isChecked = false;
    $rootScope.$digest();
    expect(element.prop('checked')).toBe(false);
  }));

  it('should bind string properties (title)', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-title="title" />')($rootScope);
    $rootScope.title = 123;
    $rootScope.$digest();
    expect(element.prop('title')).toBe('123');
    $rootScope.title = 'foobar';
    $rootScope.$digest();
    expect(element.prop('title')).toBe('foobar');
  }));

  it('should bind variable type properties', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" />')($rootScope);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    $rootScope.asdf = 'foobar';
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe('foobar');
    $rootScope.asdf = true;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(true);
  }));

  // https://github.com/angular/angular.js/issues/16797
  it('should support falsy property values', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-text="myText" />')($rootScope);
    // Initialize to truthy value
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(element.prop('text')).toBe('abc');

    // Assert various falsey values get assigned to the property
    $rootScope.myText = '';
    $rootScope.$digest();
    expect(element.prop('text')).toBe('');
    $rootScope.myText = 0;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(0);
    $rootScope.myText = false;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(false);
    $rootScope.myText = undefined;
    $rootScope.$digest();
    expect(element.prop('text')).toBeUndefined();
    $rootScope.myText = null;
    $rootScope.$digest();
    expect(element.prop('text')).toBe(null);
  }));

  it('should directly map special properties (class)', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-class="myText" />')($rootScope);
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(element[0].class).toBe('abc');
    expect(element).not.toHaveClass('abc');
  }));

  it('should not use jQuery .prop() to avoid jQuery propFix/hooks', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-class="myText" />')($rootScope);
    spyOn(jqLite.prototype, 'prop');
    $rootScope.myText = 'abc';
    $rootScope.$digest();
    expect(jqLite.prototype.prop).not.toHaveBeenCalled();
  }));

  it('should support mixed case using underscore-separated names', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-a_bcd_e="value" />')($rootScope);
    $rootScope.value = 123;
    $rootScope.$digest();
    expect(element.prop('aBcdE')).toBe(123);
  }));

  it('should work with different prefixes', inject(($rootScope, $compile) => {
    $rootScope.name = 'Misko';
    const element = $compile('<span ng:prop:test="name" ng-Prop-test2="name" ng_Prop_test3="name"></span>')($rootScope);
    expect(element.prop('test')).toBe('Misko');
    expect(element.prop('test2')).toBe('Misko');
    expect(element.prop('test3')).toBe('Misko');
  }));

  it('should work with the "href" property', inject(($rootScope, $compile) => {
    $rootScope.value = 'test';
    const element = $compile('<a ng-prop-href="\'test/\' + value"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.prop('href')).toMatch(/\/test\/test$/);
  }));

  it('should work if they are prefixed with x- or data- and different prefixes', inject(($rootScope, $compile) => {
    $rootScope.name = 'Misko';
    const element = $compile('<span data-ng-prop-test2="name" x-ng-prop-test3="name" data-ng:prop-test4="name" ' +
      'x_ng-prop-test5="name" data:ng-prop-test6="name"></span>')($rootScope);
    expect(element.prop('test2')).toBe('Misko');
    expect(element.prop('test3')).toBe('Misko');
    expect(element.prop('test4')).toBe('Misko');
    expect(element.prop('test5')).toBe('Misko');
    expect(element.prop('test6')).toBe('Misko');
  }));

  it('should work independently of attributes with the same name', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" asdf="foo" />')($rootScope);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should work independently of (ng-)attributes with the same name', inject(($rootScope, $compile) => {
    const element = $compile('<span ng-prop-asdf="asdf" ng-attr-asdf="foo" />')($rootScope);
    $rootScope.asdf = 123;
    $rootScope.$digest();
    expect(element.prop('asdf')).toBe(123);
    expect(element.attr('asdf')).toBe('foo');
  }));

  it('should use the full ng-prop-* attribute name in $attr mappings', () => {
    let attrs;
    module(($compileProvider) => {
      $compileProvider.directive('attrExposer', valueFn({
        link($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    inject(($compile, $rootScope) => {
      $compile('<div attr-exposer ng-prop-title="12" ng-prop-super-title="34" ng-prop-my-camel_title="56">')($rootScope);

      expect(attrs.title).toBeUndefined();
      expect(attrs.$attr.title).toBeUndefined();
      expect(attrs.ngPropTitle).toBe('12');
      expect(attrs.$attr.ngPropTitle).toBe('ng-prop-title');

      expect(attrs.superTitle).toBeUndefined();
      expect(attrs.$attr.superTitle).toBeUndefined();
      expect(attrs.ngPropSuperTitle).toBe('34');
      expect(attrs.$attr.ngPropSuperTitle).toBe('ng-prop-super-title');

      expect(attrs.myCamelTitle).toBeUndefined();
      expect(attrs.$attr.myCamelTitle).toBeUndefined();
      expect(attrs.ngPropMyCamelTitle).toBe('56');
      expect(attrs.$attr.ngPropMyCamelTitle).toBe('ng-prop-my-camel_title');
    });
  });

  it('should not conflict with (ng-attr-)attribute mappings of the same name', () => {
    let attrs;
    module(($compileProvider) => {
      $compileProvider.directive('attrExposer', valueFn({
        link($scope, $element, $attrs) {
          attrs = $attrs;
        }
      }));
    });
    inject(($compile, $rootScope) => {
      $compile('<div attr-exposer ng-prop-title="42" ng-attr-title="foo" title="bar">')($rootScope);
      expect(attrs.title).toBe('foo');
      expect(attrs.$attr.title).toBe('title');
      expect(attrs.$attr.ngPropTitle).toBe('ng-prop-title');
    });
  });

  it('should disallow property binding to onclick', inject(($compile, $rootScope) => {
    // All event prop bindings are disallowed.
    expect(() => {
        $compile('<button ng-prop-onclick="onClickJs"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Property bindings for HTML DOM event properties are disallowed');
    expect(() => {
        $compile('<button ng-prop-ONCLICK="onClickJs"></button>');
      }).toThrowMinErr(
        '$compile', 'nodomevents', 'Property bindings for HTML DOM event properties are disallowed');
  }));

  it('should process property bindings in pre-linking phase at priority 100', () => {
    module(provideLog);
    module(($compileProvider) => {
      $compileProvider.directive('propLog', (log, $rootScope) => ({
          compile($element, $attrs) {
            log(`compile=${  $element.prop('myName')}`);

            return {
              pre($scope, $element, $attrs) {
                log(`preLinkP0=${  $element.prop('myName')}`);
                $rootScope.name = 'pre0';
              },
              post($scope, $element, $attrs) {
                log(`postLink=${  $element.prop('myName')}`);
                $rootScope.name = 'post0';
              }
            };
          }
        }));
    });
    module(($compileProvider) => {
      $compileProvider.directive('propLogHighPriority', (log, $rootScope) => ({
          priority: 101,
          compile() {
            return {
              pre($scope, $element, $attrs) {
                log(`preLinkP101=${  $element.prop('myName')}`);
                $rootScope.name = 'pre101';
              }
            };
          }
        }));
    });
    inject(($rootScope, $compile, log) => {
      const element = $compile('<div prop-log-high-priority prop-log ng-prop-my_name="name"></div>')($rootScope);
      $rootScope.name = 'angular';
      $rootScope.$apply();
      log(`digest=${  element.prop('myName')}`);
      expect(log).toEqual('compile=undefined; preLinkP101=undefined; preLinkP0=pre101; postLink=pre101; digest=angular');
    });
  });

  
  describe('img[src] sanitization', () => {

    it('should accept trusted values', inject(($rootScope, $compile, $sce) => {
      const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
      // Some browsers complain if you try to write `javascript:` into an `img[src]`
      // So for the test use something different
      $rootScope.testUrl = $sce.trustAsMediaUrl('someuntrustedthing:foo();');
      $rootScope.$digest();
      expect(element.prop('src')).toEqual('someuntrustedthing:foo();');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jasmine.createSpy('$$sanitizeUri').and.returnValue('someSanitizedUrl');
      module(($provide) => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(($compile, $rootScope) => {
        const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
        $rootScope.testUrl = 'someUrl';

        $rootScope.$apply();
        expect(element.prop('src')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
      });
    });

    it('should not use $$sanitizeUri with trusted values', () => {
      const $$sanitizeUri = jasmine.createSpy('$$sanitizeUri').and.throwError('Should not have been called');
      module(($provide) => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(($compile, $rootScope, $sce) => {
        const element = $compile('<img ng-prop-src="testUrl"></img>')($rootScope);
        // Assigning javascript:foo to src makes at least IE9-11 complain, so use another
        // protocol name.
        $rootScope.testUrl = $sce.trustAsMediaUrl('untrusted:foo();');
        $rootScope.$apply();
        expect(element.prop('src')).toBe('untrusted:foo();');
      });
    });
  });

  

  describe('a[href] sanitization', () => {
    it('should NOT require trusted values for trusted URI values', inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'http://example.com/image.png'; // `http` is trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('http://example.com/image.png');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('http://example.com/image.png');
    }));

    it('should accept trusted values for non-trusted URI values', inject(($rootScope, $compile, $sce) => {
      $rootScope.testUrl = $sce.trustAsUrl('javascript:foo()'); // `javascript` is not trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('javascript:foo()');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('javascript:foo()');
    }));

    it('should sanitize non-trusted values', inject(($rootScope, $compile) => {
      $rootScope.testUrl = 'javascript:foo()'; // `javascript` is not trusted
      let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('unsafe:javascript:foo()');

      element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
      $rootScope.$digest();
      expect(element.prop('href')).toEqual('unsafe:javascript:foo()');
    }));

    it('should not sanitize href on elements other than anchor', inject(($compile, $rootScope) => {
      const element = $compile('<div ng-prop-href="testUrl"></div>')($rootScope);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.prop('href')).toBe('javascript:doEvilStuff()');
    }));

    it('should not sanitize properties other then those configured', inject(($compile, $rootScope) => {
      const element = $compile('<a ng-prop-title="testUrl"></a>')($rootScope);
      $rootScope.testUrl = 'javascript:doEvilStuff()';
      $rootScope.$apply();

      expect(element.prop('title')).toBe('javascript:doEvilStuff()');
    }));

    it('should use $$sanitizeUri', () => {
      const $$sanitizeUri = jasmine.createSpy('$$sanitizeUri').and.returnValue('someSanitizedUrl');
      module(($provide) => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(($compile, $rootScope) => {
        let element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
        $rootScope.testUrl = 'someUrl';
        $rootScope.$apply();
        expect(element.prop('href')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);

        $$sanitizeUri.calls.reset();

        element = $compile('<a ng-prop-href="testUrl"></a>')($rootScope);
        $rootScope.$apply();
        expect(element.prop('href')).toMatch(/^http:\/\/.*\/someSanitizedUrl$/);
        expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
      });
    });

    it('should not have endless digests when given arrays in concatenable context', inject(($compile, $rootScope) => {
      const element = $compile('<foo ng-prop-href="testUrl"></foo><foo ng-prop-href="::testUrl"></foo>' +
        '<foo ng-prop-href="\'http://example.com/\' + testUrl"></foo><foo ng-prop-href="::\'http://example.com/\' + testUrl"></foo>')($rootScope);
      $rootScope.testUrl = [1];
      $rootScope.$digest();

      $rootScope.testUrl = [];
      $rootScope.$digest();

      $rootScope.testUrl = {a:'b'};
      $rootScope.$digest();

      $rootScope.testUrl = {};
      $rootScope.$digest();
    }));
  });

  describe('iframe[src]', () => {
    it('should pass through src properties for the same domain', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.prop('src')).toMatch(/\/different_page$/);
    }));

    it('should clear out src properties for a different domain', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: http://a.different.domain.example.com');
    }));

    it('should clear out JS src properties', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: javascript:alert(1);');
    }));

    it('should clear out non-resource_url src properties', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: javascript:doTrustedStuff()');
    }));

    it('should pass through $sce.trustAs() values in src properties', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<iframe ng-prop-src="testUrl"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.prop('src')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('base[href]', () => {
    it('should be a RESOURCE_URL context', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<base ng-prop-href="testUrl"/>')($rootScope);

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://example.com/');
      $rootScope.$apply();
      expect(element.prop('href')).toContain('https://example.com/');

      $rootScope.testUrl = 'https://not.example.com/';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: https://not.example.com/');
    }));
  });

  describe('form[action]', () => {
    it('should pass through action property for the same domain', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      $rootScope.testUrl = 'different_page';
      $rootScope.$apply();
      expect(element.prop('action')).toMatch(/\/different_page$/);
    }));

    it('should clear out action property for a different domain', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      $rootScope.testUrl = 'http://a.different.domain.example.com';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: http://a.different.domain.example.com');
    }));

    it('should clear out JS action property', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      $rootScope.testUrl = 'javascript:alert(1);';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: javascript:alert(1);');
    }));

    it('should clear out non-resource_url action property', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl('javascript:doTrustedStuff()');
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: javascript:doTrustedStuff()');
    }));


    it('should pass through $sce.trustAsResourceUrl() values in action property', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<form ng-prop-action="testUrl"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl('javascript:doTrustedStuff()');
      $rootScope.$apply();

      expect(element.prop('action')).toEqual('javascript:doTrustedStuff()');
    }));
  });

  describe('link[href]', () => {
    it('should reject invalid RESOURCE_URLs', inject(($compile, $rootScope) => {
      const element = $compile('<link ng-prop-href="testUrl" rel="stylesheet" />')($rootScope);
      $rootScope.testUrl = 'https://evil.example.org/css.css';
      expect(() => { $rootScope.$apply(); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.' +
          '  URL: https://evil.example.org/css.css');
    }));

    it('should accept valid RESOURCE_URLs', inject(($compile, $rootScope, $sce) => {
      const element = $compile('<link ng-prop-href="testUrl" rel="stylesheet" />')($rootScope);

      $rootScope.testUrl = './css1.css';
      $rootScope.$apply();
      expect(element.prop('href')).toContain('css1.css');

      $rootScope.testUrl = $sce.trustAsResourceUrl('https://elsewhere.example.org/css2.css');
      $rootScope.$apply();
      expect(element.prop('href')).toContain('https://elsewhere.example.org/css2.css');
    }));
  });

  describe('*[innerHTML]', () => {
    describe('SCE disabled', () => {
      beforeEach(() => {
        module(($sceProvider) => { $sceProvider.enabled(false); });
      });

      it('should set html', inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('<div onclick="">hello</div>');
      }));

      it('should update html', inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = 'hello';
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('hello');
        $rootScope.html = 'goodbye';
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('goodbye');
      }));

      it('should one-time bind if the expression starts with two colons', inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="::html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        expect($rootScope.$$watchers.length).toEqual(1);
        $rootScope.$digest();
        expect(element.text()).toEqual('hello');
        expect($rootScope.$$watchers.length).toEqual(0);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect(element.text()).toEqual('hello');
      }));
    });


    describe('SCE enabled', () => {
      it('should NOT set html for untrusted values', inject(($rootScope, $compile) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      }));

      it('should NOT set html for wrongly typed values', inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = $sce.trustAsCss('<div onclick="">hello</div>');
        expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      }));

      it('should set html for trusted values', inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('<div onclick="">hello</div>');
      }));

      it('should update html', inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
        $rootScope.html = $sce.trustAsHtml('hello');
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('hello');
        $rootScope.html = $sce.trustAsHtml('goodbye');
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('goodbye');
      }));

      it('should not cause infinite recursion for trustAsHtml object watches',
          inject(($rootScope, $compile, $sce) => {
        // Ref: https://github.com/angular/angular.js/issues/3932
        // If the binding is a function that creates a new value on every call via trustAs, we'll
        // trigger an infinite digest if we don't take care of it.
        const element = $compile('<div ng-prop-inner_h_t_m_l="getHtml()"></div>')($rootScope);
        $rootScope.getHtml = function() {
          return $sce.trustAsHtml('<div onclick="">hello</div>');
        };
        $rootScope.$digest();
        expect(lowercase(element.html())).toEqual('<div onclick="">hello</div>');
      }));

      it('should handle custom $sce objects', () => {
        function MySafeHtml(val) { this.val = val; }

        module(($provide) => {
          $provide.decorator('$sce', ($delegate) => {
            $delegate.trustAsHtml = function(html) { return new MySafeHtml(html); };
            $delegate.getTrusted = function(type, mySafeHtml) { return mySafeHtml && mySafeHtml.val; };
            $delegate.valueOf = function(v) { return v instanceof MySafeHtml ? v.val : v; };
            return $delegate;
          });
        });

        inject(($rootScope, $compile, $sce) => {
          // Ref: https://github.com/angular/angular.js/issues/14526
          // Previous code used toString for change detection, which fails for custom objects
          // that don't override toString.
          const element = $compile('<div ng-prop-inner_h_t_m_l="getHtml()"></div>')($rootScope);
          let html = 'hello';
          $rootScope.getHtml = function() { return $sce.trustAsHtml(html); };
          $rootScope.$digest();
          expect(lowercase(element.html())).toEqual('hello');
          html = 'goodbye';
          $rootScope.$digest();
          expect(lowercase(element.html())).toEqual('goodbye');
        });
      });

      describe('when $sanitize is available', () => {
        beforeEach(() => { module('ngSanitize'); });

        it('should sanitize untrusted html', inject(($rootScope, $compile) => {
          const element = $compile('<div ng-prop-inner_h_t_m_l="html"></div>')($rootScope);
          $rootScope.html = '<div onclick="">hello</div>';
          $rootScope.$digest();
          expect(lowercase(element.html())).toEqual('<div>hello</div>');
        }));
      });
    });

  });

  describe('*[style]', () => {
    // Support: IE9
    // Some browsers throw when assignging to HTMLElement.style
    function canAssignStyleProp() {
      try {
        window.document.createElement('div').style = 'margin-left: 10px';
        return true;
      } catch (e) {
        return false;
      }
    }

    it('should NOT set style for untrusted values', inject(($rootScope, $compile) => {
      const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
      $rootScope.style = 'margin-left: 10px';
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT set style for wrongly typed values', inject(($rootScope, $compile, $sce) => {
      const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
      $rootScope.style = $sce.trustAsHtml('margin-left: 10px');
      expect(() => { $rootScope.$digest(); }).toThrowMinErr('$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    if (canAssignStyleProp()) {
      it('should set style for trusted values', inject(($rootScope, $compile, $sce) => {
        const element = $compile('<div ng-prop-style="style"></div>')($rootScope);
        $rootScope.style = $sce.trustAsCss('margin-left: 10px');
        $rootScope.$digest();

        // Support: IE
        // IE allows assignments but does not register the styles
        // Sometimes the value is '0px', sometimes ''
        if (msie) {
          expect(parseInt(element.css('margin-left'), 10) || 0).toBe(0);
        } else {
          expect(element.css('margin-left')).toEqual('10px');
        }
      }));
    }
  });
});
