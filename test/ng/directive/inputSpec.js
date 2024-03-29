

/* globals generateInputCompilerHelper: false */

describe('input', () => {
  const helper = {}; let $compile; let $rootScope; let $browser; let $sniffer;

  // UA sniffing to exclude Edge from some date input tests
  const isEdge = /\bEdge\//.test(window.navigator.userAgent);

  generateInputCompilerHelper(helper);

  beforeEach(inject((_$compile_, _$rootScope_, _$browser_, _$sniffer_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $browser = _$browser_;
    $sniffer = _$sniffer_;
  }));


  it('should bind to a model', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

    $rootScope.$apply('name = \'misko\'');

    expect(inputElm.val()).toBe('misko');
  });


  it('should not set readonly or disabled property on ie7', () => {
    jasmine.addMatchers({
      toBeOff() {
        return {
          compare(actual, attributeName) {
            const actualValue = actual.attr(attributeName);
            const message = function() {
              return `Attribute '${  attributeName  }' expected to be off but was '${  actualValue 
                }' in: ${  angular.mock.dump(actual)}`;
            };

            return {
              pass: !actualValue || actualValue === 'false',
              message
            };
          }
        };
      }
    });

    const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias"/>');
    expect(inputElm.prop('readOnly')).toBe(false);
    expect(inputElm.prop('disabled')).toBe(false);

    expect(inputElm).toBeOff('readOnly');
    expect(inputElm).toBeOff('readonly');
    expect(inputElm).toBeOff('disabled');
  });


  it('should update the model on "blur" event', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

    helper.changeInputValueTo('adam');
    expect($rootScope.name).toEqual('adam');
  });


  it('should not add the property to the scope if name is unspecified', () => {
    helper.compileInput('<input type="text" ng-model="name">');

    expect($rootScope.form.undefined).toBeUndefined();
    expect($rootScope.form.$addControl).not.toHaveBeenCalled();
    expect($rootScope.form.$$renameControl).not.toHaveBeenCalled();
  });


  it('should not set the `val` property when the value is equal to the current value', inject(($rootScope, $compile) => {
    // This is a workaround for Firefox validation. Look at #12102.
    const input = jqLite('<input type="text" ng-model="foo" required/>');
    let setterCalls = 0;
    $rootScope.foo = '';
    Object.defineProperty(input[0], 'value', {
      get() {
        return '';
      },
      set() {
        setterCalls++;
      }
    });
    $compile(input)($rootScope);
    $rootScope.$digest();
    expect(setterCalls).toBe(0);
  }));

  describe('compositionevents', () => {
    it('should not update the model between "compositionstart" and "compositionend" on non android', () => {

      $sniffer.android = false;

      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias"" />');
      helper.changeInputValueTo('a');
      expect($rootScope.name).toEqual('a');
      browserTrigger(inputElm, 'compositionstart');
      helper.changeInputValueTo('adam');
      expect($rootScope.name).toEqual('a');
      browserTrigger(inputElm, 'compositionend');
      helper.changeInputValueTo('adam');
      expect($rootScope.name).toEqual('adam');
    });


    it('should update the model between "compositionstart" and "compositionend" on android', () => {
      $sniffer.android = true;

      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias"" />');
      helper.changeInputValueTo('a');
      expect($rootScope.name).toEqual('a');
      browserTrigger(inputElm, 'compositionstart');
      helper.changeInputValueTo('adam');
      expect($rootScope.name).toEqual('adam');
      browserTrigger(inputElm, 'compositionend');
      helper.changeInputValueTo('adam2');
      expect($rootScope.name).toEqual('adam2');
    });


    it('should update the model on "compositionend"', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" />');
      browserTrigger(inputElm, 'compositionstart');
      helper.changeInputValueTo('caitp');
      expect($rootScope.name).toBeUndefined();
      browserTrigger(inputElm, 'compositionend');
      expect($rootScope.name).toEqual('caitp');
    });


    it('should end composition on "compositionupdate" when event.data is ""', () => {
      // This tests a bug workaround for IE9-11
      // During composition, when an input is de-focussed by clicking away from it,
      // the compositionupdate event is called with '', followed by a change event.
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" />');
      browserTrigger(inputElm, 'compositionstart');
      helper.changeInputValueTo('caitp');
      expect($rootScope.name).toBeUndefined();
      browserTrigger(inputElm, 'compositionupdate', {data: ''});
      browserTrigger(inputElm, 'change');
      expect($rootScope.name).toEqual('caitp');
    });
  });


  describe('IE placeholder input events', () => {
    // Support: IE 9-11 only
    // IE fires an input event whenever a placeholder visually changes, essentially treating it as a value
    // Events:
    //  placeholder attribute change: *input*
    //  focus (which visually removes the placeholder value): focusin focus *input*
    //  blur (which visually creates the placeholder value):  focusout *input* blur
    // However none of these occur if the placeholder is not visible at the time of the event.
    // These tests try simulate various scenarios which do/do-not fire the extra input event

    it('should not dirty the model on an input event in response to a placeholder change', () => {
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" attr-capture ng-model="unsetValue" name="name" />');
      expect(inputElm.attr('placeholder')).toBe('Test');
      expect(inputElm).toBePristine();

      helper.attrs.$set('placeholder', '');
      expect(inputElm.attr('placeholder')).toBe('');
      expect(inputElm).toBePristine();

      helper.attrs.$set('placeholder', 'Test Again');
      expect(inputElm.attr('placeholder')).toBe('Test Again');
      expect(inputElm).toBePristine();

      helper.attrs.$set('placeholder', undefined);
      expect(inputElm.attr('placeholder')).toBeUndefined();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should not dirty the model on an input event in response to a interpolated placeholder change', () => {
      const inputElm = helper.compileInput('<input type="text" placeholder="{{ph}}" ng-model="unsetValue" name="name" />');
      expect(inputElm).toBePristine();

      $rootScope.ph = 1;
      $rootScope.$digest();
      expect(inputElm).toBePristine();

      $rootScope.ph = '';
      $rootScope.$digest();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should dirty the model on an input event while in focus even if the placeholder changes', () => {
      $rootScope.ph = 'Test';
      const inputElm = helper.compileInput('<input type="text" ng-attr-placeholder="{{ph}}" ng-model="unsetValue" name="name" />');
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusin');
      browserTrigger(inputElm, 'focus');
      expect(inputElm.attr('placeholder')).toBe('Test');
      expect(inputElm).toBePristine();

      $rootScope.ph = 'Test Again';
      $rootScope.$digest();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should not dirty the model on an input event in response to a ng-attr-placeholder change', () => {
      const inputElm = helper.compileInput('<input type="text" ng-attr-placeholder="{{ph}}" ng-model="unsetValue" name="name" />');
      expect(inputElm).toBePristine();

      $rootScope.ph = 1;
      $rootScope.$digest();
      expect(inputElm).toBePristine();

      $rootScope.ph = '';
      $rootScope.$digest();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should not dirty the model on an input event in response to a focus', () => {
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" ng-model="unsetValue" name="name" />');
      expect(inputElm.attr('placeholder')).toBe('Test');
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusin');
      browserTrigger(inputElm, 'focus');
      expect(inputElm.attr('placeholder')).toBe('Test');
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should not dirty the model on an input event in response to a blur', () => {
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" ng-model="unsetValue" name="name" />');
      expect(inputElm.attr('placeholder')).toBe('Test');
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusin');
      browserTrigger(inputElm, 'focus');
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusout');
      browserTrigger(inputElm, 'blur');
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('foo');
      expect(inputElm).toBeDirty();
    });


    it('should dirty the model on an input event if there is a placeholder and value', () => {
      $rootScope.name = 'foo';
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" ng-model="name" value="init" name="name" />');
      expect(inputElm.val()).toBe($rootScope.name);
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('bar');
      expect(inputElm).toBeDirty();
    });


    it('should dirty the model on an input event if there is a placeholder and value after focusing', () => {
      $rootScope.name = 'foo';
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" ng-model="name" value="init" name="name" />');
      expect(inputElm.val()).toBe($rootScope.name);
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusin');
      browserTrigger(inputElm, 'focus');
      helper.changeInputValueTo('bar');
      expect(inputElm).toBeDirty();
    });


    it('should dirty the model on an input event if there is a placeholder and value after bluring', () => {
      $rootScope.name = 'foo';
      const inputElm = helper.compileInput('<input type="text" placeholder="Test" ng-model="name" value="init" name="name" />');
      expect(inputElm.val()).toBe($rootScope.name);
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusin');
      browserTrigger(inputElm, 'focus');
      expect(inputElm).toBePristine();

      browserTrigger(inputElm, 'focusout');
      browserTrigger(inputElm, 'blur');
      helper.changeInputValueTo('bar');
      expect(inputElm).toBeDirty();
    });
  });


  describe('interpolated names', () => {

    it('should interpolate input names', () => {
      $rootScope.nameID = '47';
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="name{{nameID}}" />');
      expect($rootScope.form.name47.$pristine).toBeTruthy();
      helper.changeInputValueTo('caitp');
      expect($rootScope.form.name47.$dirty).toBeTruthy();
    });


    it('should rename form controls in form when interpolated name changes', () => {
      $rootScope.nameID = 'A';
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="name{{nameID}}" />');
      expect($rootScope.form.nameA.$name).toBe('nameA');
      const oldModel = $rootScope.form.nameA;
      $rootScope.nameID = 'B';
      $rootScope.$digest();
      expect($rootScope.form.nameA).toBeUndefined();
      expect($rootScope.form.nameB).toBe(oldModel);
      expect($rootScope.form.nameB.$name).toBe('nameB');
    });


    it('should rename form controls in null form when interpolated name changes', () => {
      $rootScope.nameID = 'A';
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="name{{nameID}}" />');
      const model = inputElm.controller('ngModel');
      expect(model.$name).toBe('nameA');

      $rootScope.nameID = 'B';
      $rootScope.$digest();
      expect(model.$name).toBe('nameB');
    });
  });

  describe('"change" event', () => {
    let assertBrowserSupportsChangeEvent;

    beforeEach(() => {
      assertBrowserSupportsChangeEvent = function(inputEventSupported) {
        // Force browser to report a lack of an 'input' event
        $sniffer.hasEvent = function(eventName) {
          return !(eventName === 'input' && !inputEventSupported);
        };
        const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" />');

        inputElm.val('mark');
        browserTrigger(inputElm, 'change');
        expect($rootScope.name).toEqual('mark');
      };
    });


    it('should update the model event if the browser does not support the "input" event',() => {
      assertBrowserSupportsChangeEvent(false);
    });


    it('should update the model event if the browser supports the "input" ' +
      'event so that form auto complete works',() => {
      assertBrowserSupportsChangeEvent(true);
    });


    if (!_jqLiteMode) {
      describe('double $digest when triggering an event using jQuery', () => {
        let run;

        beforeEach(() => {
          run = function(scope) {

            $sniffer.hasEvent = function(eventName) { return eventName !== 'input'; };

            scope = scope || $rootScope;

            const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />', false, scope);

            scope.field = 'fake field';
            scope.$watch('field', () => {
              inputElm.trigger('change');
            });
            scope.$apply();
          };
        });

        it('should not cause the double $digest with non isolate scopes', () => {
          run();
        });

        it('should not cause the double $digest with isolate scopes', () => {
          run($rootScope.$new(true));
        });
      });
    }
  });

  describe('"keydown", "paste", "cut" and "drop" events', () => {
    beforeEach(() => {
      // Force browser to report a lack of an 'input' event
      $sniffer.hasEvent = function(eventName) {
        return eventName !== 'input';
      };
    });


    it('should update the model on "paste" event if the input value changes', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

      browserTrigger(inputElm, 'keydown');
      $browser.defer.flush();
      expect(inputElm).toBePristine();

      inputElm.val('mark');
      browserTrigger(inputElm, 'paste');
      $browser.defer.flush();
      expect($rootScope.name).toEqual('mark');
    });

    it('should update the model on "drop" event if the input value changes', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

      browserTrigger(inputElm, 'keydown');
      $browser.defer.flush();
      expect(inputElm).toBePristine();

      inputElm.val('mark');
      browserTrigger(inputElm, 'drop');
      $browser.defer.flush();
      expect($rootScope.name).toEqual('mark');
    });

    it('should update the model on "cut" event', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

      inputElm.val('john');
      browserTrigger(inputElm, 'cut');
      $browser.defer.flush();
      expect($rootScope.name).toEqual('john');
    });


    it('should cancel the delayed dirty if a change occurs', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" />');
      const ctrl = inputElm.controller('ngModel');

      browserTrigger(inputElm, 'keydown', {target: inputElm[0]});
      inputElm.val('f');
      browserTrigger(inputElm, 'change');
      expect(inputElm).toBeDirty();

      ctrl.$setPristine();
      $rootScope.$apply();

      $browser.defer.flush();
      expect(inputElm).toBePristine();
    });
  });


  describe('ngTrim', () => {

    it('should update the model and trim the value', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-change="change()" />');

      helper.changeInputValueTo('  a  ');
      expect($rootScope.name).toEqual('a');
    });


    it('should update the model and not trim the value', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" ng-trim="false" />');

      helper.changeInputValueTo('  a  ');
      expect($rootScope.name).toEqual('  a  ');
    });
  });


  it('should allow complex reference binding', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="obj[\'abc\'].name"/>');

    $rootScope.$apply('obj = { abc: { name: \'Misko\'} }');
    expect(inputElm.val()).toEqual('Misko');
  });


  it('should ignore input without ngModel directive', () => {
    const inputElm = helper.compileInput('<input type="text" name="whatever" required />');

    helper.changeInputValueTo('');
    expect(inputElm.hasClass('ng-valid')).toBe(false);
    expect(inputElm.hasClass('ng-invalid')).toBe(false);
    expect(inputElm.hasClass('ng-pristine')).toBe(false);
    expect(inputElm.hasClass('ng-dirty')).toBe(false);
  });


  it('should report error on assignment error', () => {
    expect(() => {
      const inputElm = helper.compileInput('<input type="text" ng-model="throw \'\'">');
    }).toThrowMinErr('$parse', 'syntax', 'Syntax Error: Token \'\'\'\' is an unexpected token at column 7 of the expression [throw \'\'] starting at [\'\'].');
  });


  it('should render as blank if null', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="age" />');

    $rootScope.$apply('age = null');

    expect($rootScope.age).toBeNull();
    expect(inputElm.val()).toEqual('');
  });


  it('should render 0 even if it is a number', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="value" />');
    $rootScope.$apply('value = 0');

    expect(inputElm.val()).toBe('0');
  });


  it('should render the $viewValue when $modelValue is empty', () => {
    const inputElm = helper.compileInput('<input type="text" ng-model="value" />');

    const ctrl = inputElm.controller('ngModel');

    ctrl.$modelValue = null;

    expect(ctrl.$isEmpty(ctrl.$modelValue)).toBe(true);

    ctrl.$viewValue = 'abc';
    ctrl.$render();

    expect(inputElm.val()).toBe('abc');
  });


  // INPUT TYPES
  describe('month', () => {
    it('should throw if model is not a Date object', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="january"/>');

      expect(() => {
        $rootScope.$apply(() => {
          $rootScope.january = '2013-01';
        });
      }).toThrowMinErr('ngModel', 'datefmt', 'Expected `2013-01` to be a date');
    });


    it('should set the view if the model is a valid Date object', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="march"/>');

      $rootScope.$apply(() => {
        $rootScope.march = new Date(2013, 2, 1);
      });

      expect(inputElm.val()).toBe('2013-03');
    });


    it('should set the model undefined if the input is an invalid month string', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value"/>');

      $rootScope.$apply(() => {
        $rootScope.value = new Date(2013, 0, 1);
      });


      expect(inputElm.val()).toBe('2013-01');

      // set to text for browsers with datetime-local validation.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('stuff');
      expect(inputElm.val()).toBe('stuff');
      expect($rootScope.value).toBeUndefined();
      expect(inputElm).toHaveClass('ng-invalid-month');
      expect(inputElm).toBeInvalid();
    });


    it('should not set error=month when a later parser returns undefined', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value"/>');
      const ctrl = inputElm.controller('ngModel');

      ctrl.$parsers.push(() => undefined);

      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('2017-01');

      expect($rootScope.value).toBeUndefined();
      expect(ctrl.$error.month).toBeFalsy();
      expect(ctrl.$error.parse).toBeTruthy();
      expect(inputElm).not.toHaveClass('ng-invalid-month');
      expect(inputElm).toHaveClass('ng-invalid-parse');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('asdf');

      expect($rootScope.value).toBeUndefined();
      expect(ctrl.$error.month).toBeTruthy();
      expect(ctrl.$error.parse).toBeFalsy();
      expect(inputElm).toHaveClass('ng-invalid-month');
      expect(inputElm).not.toHaveClass('ng-invalid-parse');
      expect(inputElm).toBeInvalid();
    });


    it('should render as blank if null', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="test" />');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should come up blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="test" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toBe('');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="test" />');

      $rootScope.$apply(() => {
        $rootScope.test = new Date(2011, 0, 1);
      });

      helper.changeInputValueTo('');
      expect($rootScope.test).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should use UTC if specified in the options', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2013-07');
      expect(+$rootScope.value).toBe(Date.UTC(2013, 6, 1));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2014, 6, 1));
      });
      expect(inputElm.val()).toBe('2014-07');
    });


    it('should be possible to override the timezone', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2013-07');
      expect(+$rootScope.value).toBe(Date.UTC(2013, 6, 1));

      inputElm.controller('ngModel').$overrideModelOptions({timezone: '-0500'});

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2013, 6, 1));
      });
      expect(inputElm.val()).toBe('2013-06');
    });


    they('should use any timezone if specified in the options (format: $prop)',
      {'+HHmm': '+0500', '+HH:mm': '+05:00'},
      (tz) => {
        const ngModelOptions = `{timezone: '${  tz  }'}`;
        const inputElm = helper.compileInput(
            `<input type="month" ng-model="value" ng-model-options="${  ngModelOptions  }" />`);

        helper.changeInputValueTo('2013-07');
        expect(+$rootScope.value).toBe(Date.UTC(2013, 5, 30, 19, 0, 0));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(2014, 5, 30, 19, 0, 0));
        });
        expect(inputElm.val()).toBe('2014-07');
      }
    );


    it('should label parse errors as `month`', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="val" name="alias" />', {
        valid: false,
        badInput: true
      });

      helper.changeInputValueTo('xxx');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.alias.$error.month).toBeTruthy();
    });


    // Support: Edge 16
    // Edge does not support years with any number of digits other than 4.
    if (!isEdge) {
      it('should allow four or more digits in year', () => {
        const inputElm = helper.compileInput('<input type="month" ng-model="value"  ng-model-options="{timezone: \'UTC\'}"/>');

        helper.changeInputValueTo('10123-03');
        expect(+$rootScope.value).toBe(Date.UTC(10123, 2, 1, 0, 0, 0));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(20456, 3, 1, 0, 0, 0));
        });
        expect(inputElm.val()).toBe('20456-04');
      });
    }

    it('should only change the month of a bound date', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2013, 7, 1, 1, 0, 0, 0));
      });
      helper.changeInputValueTo('2013-12');
      expect(+$rootScope.value).toBe(Date.UTC(2013, 11, 1, 1, 0, 0, 0));
      expect(inputElm.val()).toBe('2013-12');
    });

    it('should only change the month of a bound date in any timezone', () => {
      const inputElm = helper.compileInput('<input type="month" ng-model="value" ng-model-options="{timezone: \'+0500\'}" />');

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2013, 6, 31, 20, 0, 0));
      });
      helper.changeInputValueTo('2013-09');
      expect(+$rootScope.value).toBe(Date.UTC(2013, 7, 31, 20, 0, 0));
      expect(inputElm.val()).toBe('2013-09');
    });

    describe('min', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.minVal = '2013-01';
        inputElm = helper.compileInput('<input type="month" ng-model="value" name="alias" min="{{ minVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('2012-12');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('2013-07');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2013, 6, 1));
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should revalidate when the min value changes', () => {
        helper.changeInputValueTo('2013-07');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        $rootScope.minVal = '2014-01';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate if min is empty', () => {
        $rootScope.minVal = undefined;
        $rootScope.value = new Date(-9999, 0, 1, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="month" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="month" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });
    });

    describe('max', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.maxVal = '2013-01';
        inputElm = helper.compileInput('<input type="month" ng-model="value" name="alias" max="{{ maxVal }}" />');
      });

      it('should validate', () => {
        helper.changeInputValueTo('2012-03');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2012, 2, 1));
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('2013-05');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeUndefined();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should revalidate when the max value changes', () => {
        helper.changeInputValueTo('2012-07');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();

        $rootScope.maxVal = '2012-01';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate if max is empty', () => {
        $rootScope.maxVal = undefined;
        $rootScope.value = new Date(9999, 11, 31, 23, 59, 59);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should validate when timezone is provided.', () => {
        inputElm = helper.compileInput('<input type="month" ng-model="value" name="alias" ' +
            'max="{{ maxVal }}" ng-model-options="{timezone: \'UTC\', allowInvalid: true}"/>');
        $rootScope.maxVal = '2013-01';
        $rootScope.value = new Date(Date.UTC(2013, 0, 1, 0, 0, 0));
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();

        $rootScope.value = '';
        helper.changeInputValueTo('2013-01');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="month" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="month" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });
  });


  describe('week', () => {
    it('should throw if model is not a Date object', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="secondWeek"/>');

      expect(() => {
        $rootScope.$apply(() => {
          $rootScope.secondWeek = '2013-W02';
        });
      }).toThrowMinErr('ngModel', 'datefmt', 'Expected `2013-W02` to be a date');
    });


    it('should set the view if the model is a valid Date object', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="secondWeek"/>');

      $rootScope.$apply(() => {
        $rootScope.secondWeek = new Date(2013, 0, 11);
      });

      expect(inputElm.val()).toBe('2013-W02');
    });


    it('should not affect the hours or minutes of a bound date', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="secondWeek"/>');

      $rootScope.$apply(() => {
        $rootScope.secondWeek = new Date(2013, 0, 11, 1, 0, 0, 0);
      });

      helper.changeInputValueTo('2013-W03');

      expect(+$rootScope.secondWeek).toBe(+new Date(2013, 0, 17, 1, 0, 0, 0));
    });


    it('should set the model undefined if the input is an invalid week string', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="value"/>');

      $rootScope.$apply(() => {
        $rootScope.value = new Date(2013, 0, 11);
      });


      expect(inputElm.val()).toBe('2013-W02');

      // set to text for browsers with datetime-local validation.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('stuff');
      expect(inputElm.val()).toBe('stuff');
      expect($rootScope.value).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should render as blank if null', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="test" />');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should come up blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="test" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toBe('');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="test" />');

      $rootScope.$apply(() => {
        $rootScope.test = new Date(2011, 0, 1);
      });

      helper.changeInputValueTo('');
      expect($rootScope.test).toBeNull();
      expect(inputElm).toBeValid();
    });

    // Support: Edge 16
    // Edge does not support years with any number of digits other than 4.
    if (!isEdge) {
      it('should allow four or more digits in year', () => {
        const inputElm = helper.compileInput('<input type="week" ng-model="value"  ng-model-options="{timezone: \'UTC\'}"/>');

        helper.changeInputValueTo('10123-W03');
        expect(+$rootScope.value).toBe(Date.UTC(10123, 0, 21));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(20456, 0, 28));
        });
        expect(inputElm.val()).toBe('20456-W04');
      });
    }

    it('should use UTC if specified in the options', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2013-W03');
      expect(+$rootScope.value).toBe(Date.UTC(2013, 0, 17));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2014, 0, 17));
      });
      expect(inputElm.val()).toBe('2014-W03');
    });


    it('should be possible to override the timezone', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      // January 19 2013 is a Saturday
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2013, 0, 19));
      });

      expect(inputElm.val()).toBe('2013-W03');

      inputElm.controller('ngModel').$overrideModelOptions({timezone: '+2400'});

      // To check that the timezone overwrite works, apply an offset of +24 hours.
      // Since January 19 is a Saturday, +24 will turn the formatted Date into January 20 - Sunday -
      // which is in calendar week 4 instead of 3.
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2013, 0, 19));
      });

      // Verifying that the displayed week is week 4 confirms that overriding the timezone worked
      expect(inputElm.val()).toBe('2013-W04');
    });


    they('should use any timezone if specified in the options (format: $prop)',
      {'+HHmm': '+0500', '+HH:mm': '+05:00'},
      (tz) => {
        const ngModelOptions = `{timezone: '${  tz  }'}`;
        const inputElm = helper.compileInput(
            `<input type="week" ng-model="value" ng-model-options="${  ngModelOptions  }" />`);

        helper.changeInputValueTo('2013-W03');
        expect(+$rootScope.value).toBe(Date.UTC(2013, 0, 16, 19, 0, 0));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(2014, 0, 16, 19, 0, 0));
        });
        expect(inputElm.val()).toBe('2014-W03');
      }
    );


    it('should label parse errors as `week`', () => {
      const inputElm = helper.compileInput('<input type="week" ng-model="val" name="alias" />', {
        valid: false,
        badInput: true
      });

      helper.changeInputValueTo('yyy');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.alias.$error.week).toBeTruthy();
    });

    describe('min', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.minVal = '2013-W01';
        inputElm = helper.compileInput('<input type="week" ng-model="value" name="alias" min="{{ minVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('2012-W12');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('2013-W03');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2013, 0, 17));
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should revalidate when the min value changes', () => {
        helper.changeInputValueTo('2013-W03');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        $rootScope.minVal = '2014-W01';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate if min is empty', () => {
        $rootScope.minVal = undefined;
        $rootScope.value = new Date(-9999, 0, 1, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="week" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="week" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });
    });

    describe('max', () => {
      let inputElm;

      beforeEach(() => {
        $rootScope.maxVal = '2013-W01';
        inputElm = helper.compileInput('<input type="week" ng-model="value" name="alias" max="{{ maxVal }}" />');
      });

      it('should validate', () => {
        helper.changeInputValueTo('2012-W01');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2012, 0, 5));
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('2013-W03');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeUndefined();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should revalidate when the max value changes', () => {
        helper.changeInputValueTo('2012-W03');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();

        $rootScope.maxVal = '2012-W01';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate if max is empty', () => {
        $rootScope.maxVal = undefined;
        $rootScope.value = new Date(9999, 11, 31, 23, 59, 59);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should validate when timezone is provided.', () => {
        inputElm = helper.compileInput('<input type="week" ng-model="value" name="alias" ' +
            'max="{{ maxVal }}" ng-model-options="{timezone: \'-2400\', allowInvalid: true}"/>');
        // The calendar week comparison date is January 17. Setting the timezone to -2400
        // makes the January 18 date value valid.
        $rootScope.maxVal = '2013-W03';
        $rootScope.value = new Date(Date.UTC(2013, 0, 18));
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();

        $rootScope.value = '';
        helper.changeInputValueTo('2013-W03');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="week" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="week" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });
  });


  describe('datetime-local', () => {
    it('should throw if model is not a Date object', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="lunchtime"/>');

      expect(() => {
        $rootScope.$apply(() => {
          $rootScope.lunchtime = '2013-12-16T11:30:00';
        });
      }).toThrowMinErr('ngModel', 'datefmt', 'Expected `2013-12-16T11:30:00` to be a date');
    });


    it('should set the view if the model if a valid Date object.', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="halfSecondToNextYear"/>');

      $rootScope.$apply(() => {
        $rootScope.halfSecondToNextYear = new Date(2013, 11, 31, 23, 59, 59, 500);
      });

      expect(inputElm.val()).toBe('2013-12-31T23:59:59.500');
    });


    it('should set the model undefined if the view is invalid', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="breakMe"/>');

      $rootScope.$apply(() => {
        $rootScope.breakMe = new Date(2009, 0, 6, 16, 25, 1, 337);
      });

      expect(inputElm.val()).toBe('2009-01-06T16:25:01.337');

      // set to text for browsers with datetime-local validation.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('stuff');
      expect(inputElm.val()).toBe('stuff');
      expect($rootScope.breakMe).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should render as blank if null', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="test" />');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should come up blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="test" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toBe('');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="test" />');

      $rootScope.$apply(() => {
        $rootScope.test = new Date(2011, 0, 1);
      });

      helper.changeInputValueTo('');
      expect($rootScope.test).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should use UTC if specified in the options', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2000-01-01T01:02:03.456');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 1, 2, 3, 456));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2001, 0, 1, 1, 2, 3, 456));
      });
      expect(inputElm.val()).toBe('2001-01-01T01:02:03.456');
    });


    it('should be possible to override the timezone', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2000-01-01T01:02:03.456');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 1, 2, 3, 456));

      inputElm.controller('ngModel').$overrideModelOptions({timezone: '+0500'});
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2001, 0, 1, 1, 2, 3, 456));
      });
      expect(inputElm.val()).toBe('2001-01-01T06:02:03.456');

      inputElm.controller('ngModel').$overrideModelOptions({timezone: 'UTC'});

      helper.changeInputValueTo('2000-01-01T01:02:03.456');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 1, 2, 3, 456));
    });


    they('should use any timezone if specified in the options (format: $prop)',
      {'+HHmm': '+0500', '+HH:mm': '+05:00'},
      (tz) => {
        const ngModelOptions = `{timezone: '${  tz  }'}`;
        const inputElm = helper.compileInput(
            `<input type="datetime-local" ng-model="value" ng-model-options="${  ngModelOptions  }" />`);

        helper.changeInputValueTo('2000-01-01T06:02:03.456');
        expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 1, 2, 3, 456));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(2001, 0, 1, 1, 2, 3, 456));
        });
        expect(inputElm.val()).toBe('2001-01-01T06:02:03.456');
      }
    );


    it('should fallback to default timezone in case an unknown timezone was passed', () => {
      const inputElm = helper.compileInput(
        '<input type="datetime-local" ng-model="value1" ng-model-options="{timezone: \'WTF\'}" />' +
        '<input type="datetime-local" ng-model="value2" />');

      helper.changeGivenInputTo(inputElm.eq(0), '2000-01-01T06:02');
      helper.changeGivenInputTo(inputElm.eq(1), '2000-01-01T06:02');
      expect($rootScope.value1).toEqual($rootScope.value2);
    });


    it('should allow to specify the milliseconds', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value"" />');

      helper.changeInputValueTo('2000-01-01T01:02:03.500');
      expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 1, 2, 3, 500));
    });


    it('should allow to specify single digit milliseconds', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value"" />');

      helper.changeInputValueTo('2000-01-01T01:02:03.4');
      expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 1, 2, 3, 400));
    });


    it('should allow to specify the seconds', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value"" />');

      helper.changeInputValueTo('2000-01-01T01:02:03.456');
      expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 1, 2, 3, 456));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(2001, 0, 1, 1, 2, 3, 456);
      });
      expect(inputElm.val()).toBe('2001-01-01T01:02:03.456');
    });


    it('should allow to skip the seconds', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value"" />');

      helper.changeInputValueTo('2000-01-01T01:02');
      expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 1, 2, 0));
    });


    // Support: Edge 16
    // Edge does not support years with any number of digits other than 4.
    if (!isEdge) {
      it('should allow four or more digits in year', () => {
        const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" />');

          helper.changeInputValueTo('10123-01-01T01:02:03.456');
          expect(+$rootScope.value).toBe(+new Date(10123, 0, 1, 1, 2, 3, 456));

          $rootScope.$apply(() => {
            $rootScope.value = new Date(20456, 1, 1, 1, 2, 3, 456);
          });
          expect(inputElm.val()).toBe('20456-02-01T01:02:03.456');
        }
      );
    }


    it('should label parse errors as `datetimelocal`', () => {
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="val" name="alias" />', {
        valid: false,
        badInput: true
      });

      helper.changeInputValueTo('zzz');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.alias.$error.datetimelocal).toBeTruthy();
    });

    it('should use the timeSecondsFormat specified in ngModelOptions', () => {
      const inputElm = helper.compileInput(
        '<input type="datetime-local" ng-model-options="{timeSecondsFormat: \'\'}" ng-model="time"/>'
      );

      const ctrl = inputElm.controller('ngModel');

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 0, 500);
      });
      expect(inputElm.val()).toBe('1970-01-01T15:41');

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 50, 500);
      });
      expect(inputElm.val()).toBe('1970-01-01T15:41');

      ctrl.$overrideModelOptions({timeSecondsFormat: 'ss'});

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 5, 500);
      });
      expect(inputElm.val()).toBe('1970-01-01T15:41:05');

      ctrl.$overrideModelOptions({timeSecondsFormat: 'ss.sss'});

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 50, 50);
      });
      expect(inputElm.val()).toBe('1970-01-01T15:41:50.050');
    });


    it('should strip empty milliseconds and seconds if specified in ngModelOptions', () => {
      const inputElm = helper.compileInput(
        '<input type="datetime-local" ng-model-options="{timeStripZeroSeconds: true}" ng-model="threeFortyOnePm"/>'
      );

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 500);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41:50.500');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 500);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41:00.500');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 0);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41:50');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 0);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41');
    });


    it('should apply timeStripZeroSeconds after timeSecondsFormat', () => {
      const inputElm = helper.compileInput('<input type="datetime-local"' +
        ' ng-model-options="{timeSecondsFormat: \'ss\', timeStripZeroSeconds: true}"' +
        ' ng-model="threeFortyOnePm"/>');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 500);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41:50');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 500);
      });

      expect(inputElm.val()).toBe('1970-01-01T15:41');
    });

    describe('min', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.minVal = '2000-01-01T12:30:00';
        inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" min="{{ minVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('1999-12-31T01:02:00');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('2000-01-01T23:02:00');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 23, 2, 0));
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should revalidate when the min value changes', () => {
        helper.changeInputValueTo('2000-02-01T01:02:00');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        $rootScope.minVal = '2010-01-01T01:02:00';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate if min is empty', () => {
        $rootScope.minVal = undefined;
        $rootScope.value = new Date(-9999, 0, 1, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="datetime-local" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="datetime-local" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });

    });

    describe('max', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.maxVal = '2019-01-01T01:02:00';
        inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" max="{{ maxVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('2019-12-31T01:02:00');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('2000-01-01T01:02:00');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2000, 0, 1, 1, 2, 0));
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should revalidate when the max value changes', () => {
        helper.changeInputValueTo('2000-02-01T01:02:00');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();

        $rootScope.maxVal = '2000-01-01T01:02:00';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate if max is empty', () => {
        $rootScope.maxVal = undefined;
        $rootScope.value = new Date(3000, 11, 31, 23, 59, 59);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should validate when timezone is provided.', () => {
        inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" ' +
            'max="{{ maxVal }}" ng-model-options="{timezone: \'UTC\', allowInvalid: true}"/>');
        $rootScope.maxVal = '2013-01-01T00:00:00';
        $rootScope.value = new Date(Date.UTC(2013, 0, 1, 0, 0, 0));
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();

        $rootScope.value = '';
        helper.changeInputValueTo('2013-01-01T00:00:00');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="datetime-local" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="datetime-local" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });


    it('should validate even if max value changes on-the-fly', () => {
      $rootScope.max = '2013-01-01T01:02:00';
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" max="{{max}}" />');

      helper.changeInputValueTo('2014-01-01T12:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '2001-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.max = '2024-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if min value changes on-the-fly', () => {
      $rootScope.min = '2013-01-01T01:02:00';
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" min="{{min}}" />');

      helper.changeInputValueTo('2010-01-01T12:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '2014-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.min = '2009-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-max value changes on-the-fly', () => {
      $rootScope.max = '2013-01-01T01:02:00';
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" ng-max="max" />');

      helper.changeInputValueTo('2014-01-01T12:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '2001-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.max = '2024-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-min value changes on-the-fly', () => {
      $rootScope.min = '2013-01-01T01:02:00';
      const inputElm = helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" ng-min="min" />');

      helper.changeInputValueTo('2010-01-01T12:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '2014-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.min = '2009-01-01T01:02:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    // Support: Edge 16
    // Edge does not support years with any number of digits other than 4.
    if (!isEdge) {
      it('should correctly handle 2-digit years', () => {
        helper.compileInput('<input type="datetime-local" ng-model="value" name="alias" />');

        helper.changeInputValueTo('0001-01-01T12:34:00');
        expect($rootScope.value.getFullYear()).toBe(1);

        helper.changeInputValueTo('0099-01-01T12:34:00');
        expect($rootScope.value.getFullYear()).toBe(99);

        helper.changeInputValueTo('0100-01-01T12:34:00');
        expect($rootScope.value.getFullYear()).toBe(100);
      });
    }
  });


  describe('time', () => {
    it('should throw if model is not a Date object', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="lunchtime"/>');

      expect(() => {
        $rootScope.$apply(() => {
          $rootScope.lunchtime = '11:30:00';
        });
      }).toThrowMinErr('ngModel', 'datefmt', 'Expected `11:30:00` to be a date');
    });


    it('should set the view if the model is a valid Date object.', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="threeFortyOnePm"/>');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 500);
      });

      expect(inputElm.val()).toBe('15:41:00.500');
    });


    it('should set the model to undefined if the view is invalid', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="breakMe"/>');

      $rootScope.$apply(() => {
        $rootScope.breakMe = new Date(1970, 0, 1, 16, 25, 0);
      });

      expect(inputElm.val()).toBe('16:25:00.000');

      // set to text for browsers with time validation.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('stuff');
      expect(inputElm.val()).toBe('stuff');
      expect($rootScope.breakMe).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should set blank if null', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="test" />');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should set blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="test" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toBe('');
    });

    it('should use the timeSecondsFormat specified in ngModelOptions', () => {
      const inputElm = helper.compileInput(
        '<input type="time" ng-model-options="{timeSecondsFormat: \'\'}" ng-model="time"/>'
      );

      const ctrl = inputElm.controller('ngModel');

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 0, 500);
      });
      expect(inputElm.val()).toBe('15:41');

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 50, 500);
      });
      expect(inputElm.val()).toBe('15:41');

      ctrl.$overrideModelOptions({timeSecondsFormat: 'ss'});

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 5, 500);
      });
      expect(inputElm.val()).toBe('15:41:05');

      ctrl.$overrideModelOptions({timeSecondsFormat: 'ss.sss'});

      $rootScope.$apply(() => {
        $rootScope.time = new Date(1970, 0, 1, 15, 41, 50, 50);
      });
      expect(inputElm.val()).toBe('15:41:50.050');
    });


    it('should strip empty milliseconds and seconds if specified in ngModelOptions', () => {
      const inputElm = helper.compileInput(
        '<input type="time" ng-model-options="{timeStripZeroSeconds: true}" ng-model="threeFortyOnePm"/>'
      );

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 500);
      });

      expect(inputElm.val()).toBe('15:41:50.500');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 500);
      });

      expect(inputElm.val()).toBe('15:41:00.500');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 0);
      });

      expect(inputElm.val()).toBe('15:41:50');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 0);
      });

      expect(inputElm.val()).toBe('15:41');
    });


    it('should apply timeStripZeroSeconds after timeSecondsFormat', () => {
      const inputElm = helper.compileInput('<input type="time"' +
        ' ng-model-options="{timeSecondsFormat: \'ss\', timeStripZeroSeconds: true}"' +
        ' ng-model="threeFortyOnePm"/>');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 50, 500);
      });

      expect(inputElm.val()).toBe('15:41:50');

      $rootScope.$apply(() => {
        $rootScope.threeFortyOnePm = new Date(1970, 0, 1, 15, 41, 0, 500);
      });

      expect(inputElm.val()).toBe('15:41');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="test" />');

      $rootScope.$apply(() => {
        $rootScope.test = new Date(2011, 0, 1);
      });

      helper.changeInputValueTo('');
      expect($rootScope.test).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should use UTC if specified in the options', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('23:02:00');
      expect(+$rootScope.value).toBe(Date.UTC(1970, 0, 1, 23, 2, 0));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(1971, 0, 1, 23, 2, 0));
      });
      expect(inputElm.val()).toBe('23:02:00.000');
    });


    it('should be possible to override the timezone', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('23:02:00');
      expect(+$rootScope.value).toBe(Date.UTC(1970, 0, 1, 23, 2, 0));

      inputElm.controller('ngModel').$overrideModelOptions({timezone: '-0500'});
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(1971, 0, 1, 23, 2, 0));
      });
      expect(inputElm.val()).toBe('18:02:00.000');

      inputElm.controller('ngModel').$overrideModelOptions({timezone: 'UTC'});
      helper.changeInputValueTo('23:02:00');
      // The year is still set from the previous date
      expect(+$rootScope.value).toBe(Date.UTC(1971, 0, 1, 23, 2, 0));
    });


    they('should use any timezone if specified in the options (format: $prop)',
      {'+HHmm': '+0500', '+HH:mm': '+05:00'},
      (tz) => {
        const ngModelOptions = `{timezone: '${  tz  }'}`;
        const inputElm = helper.compileInput(
            `<input type="time" ng-model="value" ng-model-options="${  ngModelOptions  }" />`);

        helper.changeInputValueTo('23:02:00');
        expect(+$rootScope.value).toBe(Date.UTC(1970, 0, 1, 18, 2, 0));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(1971, 0, 1, 18, 2, 0));
        });
        expect(inputElm.val()).toBe('23:02:00.000');
      }
    );


    it('should allow to specify the milliseconds', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value"" />');

      helper.changeInputValueTo('01:02:03.500');
      expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 1, 2, 3, 500));
    });


    it('should allow to specify single digit milliseconds', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value"" />');

      helper.changeInputValueTo('01:02:03.4');
      expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 1, 2, 3, 400));
    });


    it('should allow to specify the seconds', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value"" />');

      helper.changeInputValueTo('01:02:03');
      expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 1, 2, 3));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(1970, 0, 1, 1, 2, 3);
      });
      expect(inputElm.val()).toBe('01:02:03.000');
    });


    it('should allow to skip the seconds', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value"" />');

      helper.changeInputValueTo('01:02');
      expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 1, 2, 0));
    });


    it('should label parse errors as `time`', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="val" name="alias" />', {
        valid: false,
        badInput: true
      });

      helper.changeInputValueTo('mmm');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.alias.$error.time).toBeTruthy();
    });


    it('should only change hours and minute of a bound date', () => {
      const inputElm = helper.compileInput('<input type="time" ng-model="value"" />');

      $rootScope.$apply(() => {
        $rootScope.value = new Date(2013, 2, 3, 1, 0, 0);
      });

      helper.changeInputValueTo('01:02');
      expect(+$rootScope.value).toBe(+new Date(2013, 2, 3, 1, 2, 0));
    });

    describe('min', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.minVal = '09:30:00';
        inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" min="{{ minVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('01:02:00');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('23:02:00');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 23, 2, 0));
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should revalidate when the min value changes', () => {
        helper.changeInputValueTo('23:02:00');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        $rootScope.minVal = '23:55:00';
        $rootScope.$digest();

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate if min is empty', () => {
        $rootScope.minVal = undefined;
        $rootScope.value = new Date(-9999, 0, 1, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="time" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="time" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });
    });

    describe('max', () => {
      let inputElm;
      beforeEach(() => {
        $rootScope.maxVal = '22:30:00';
        inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" max="{{ maxVal }}" />');
      });

      it('should invalidate', () => {
        helper.changeInputValueTo('23:00:00');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate', () => {
        helper.changeInputValueTo('05:30:00');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(1970, 0, 1, 5, 30, 0));
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

     it('should validate if max is empty', () => {
        $rootScope.maxVal = undefined;
        $rootScope.value = new Date(9999, 11, 31, 23, 59, 59);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should validate when timezone is provided.', () => {
        inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" ' +
            'max="{{ maxVal }}" ng-model-options="{timezone: \'UTC\', allowInvalid: true}"/>');
        $rootScope.maxVal = '22:30:00';
        $rootScope.value = new Date(Date.UTC(1970, 0, 1, 22, 30, 0));
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();

        $rootScope.value = '';
        helper.changeInputValueTo('22:30:00');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="time" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="time" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });


    it('should validate even if max value changes on-the-fly', () => {
      $rootScope.max = '04:02:00';
      const inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" max="{{max}}" />');

      helper.changeInputValueTo('05:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '06:34:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if min value changes on-the-fly', () => {
      $rootScope.min = '08:45:00';
      const inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" min="{{min}}" />');

      helper.changeInputValueTo('06:15:00');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '05:50:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-max value changes on-the-fly', () => {
      $rootScope.max = '04:02:00';
      const inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" ng-max="max" />');

      helper.changeInputValueTo('05:34:00');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '06:34:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-min value changes on-the-fly', () => {
      $rootScope.min = '08:45:00';
      const inputElm = helper.compileInput('<input type="time" ng-model="value" name="alias" ng-min="min" />');

      helper.changeInputValueTo('06:15:00');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '05:50:00';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });
  });


  describe('date', () => {
    it('should throw if model is not a Date object.', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="birthday"/>');

      expect(() => {
        $rootScope.$apply(() => {
          $rootScope.birthday = '1977-10-22';
        });
      }).toThrowMinErr('ngModel', 'datefmt', 'Expected `1977-10-22` to be a date');
    });


    it('should set the view to empty when the model is an InvalidDate', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="val"/>');
      // reset the element type to text otherwise newer browsers
      // would always set the input.value to empty for invalid dates...
      inputElm.attr('type', 'text');

      $rootScope.$apply(() => {
        $rootScope.val = new Date('a');
      });

      expect(inputElm.val()).toBe('');
    });


    it('should set the view if the model if a valid Date object.', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="christmas"/>');

      $rootScope.$apply(() => {
        $rootScope.christmas = new Date(2013, 11, 25);
      });

      expect(inputElm.val()).toBe('2013-12-25');
    });


    it('should set the model undefined if the view is invalid', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="arrMatey"/>');

      $rootScope.$apply(() => {
        $rootScope.arrMatey = new Date(2014, 8, 14);
      });

      expect(inputElm.val()).toBe('2014-09-14');

      // set to text for browsers with date validation.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('1-2-3');
      expect(inputElm.val()).toBe('1-2-3');
      expect($rootScope.arrMatey).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should render as blank if null', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="test" />');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should come up blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="test" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('test = null');

      expect($rootScope.test).toBeNull();
      expect(inputElm.val()).toBe('');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="test" />');

      $rootScope.$apply(() => {
        $rootScope.test = new Date(2011, 0, 1);
      });

      helper.changeInputValueTo('');
      expect($rootScope.test).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should use UTC if specified in the options', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2000-01-01');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1));

      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2001, 0, 1));
      });
      expect(inputElm.val()).toBe('2001-01-01');
    });


    it('should be possible to override the timezone', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2000-01-01');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1));

      inputElm.controller('ngModel').$overrideModelOptions({timezone: '-0500'});
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2001, 0, 1));
      });
      expect(inputElm.val()).toBe('2000-12-31');

      inputElm.controller('ngModel').$overrideModelOptions({timezone: 'UTC'});
      helper.changeInputValueTo('2000-01-01');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 0));
    });


    they('should use any timezone if specified in the options (format: $prop)',
      {'+HHmm': '+0500', '+HH:mm': '+05:00'},
      (tz) => {
        const ngModelOptions = `{timezone: '${  tz  }'}`;
        const inputElm = helper.compileInput(
            `<input type="date" ng-model="value" ng-model-options="${  ngModelOptions  }" />`);

        helper.changeInputValueTo('2000-01-01');
        expect(+$rootScope.value).toBe(Date.UTC(1999, 11, 31, 19, 0, 0));

        $rootScope.$apply(() => {
          $rootScope.value = new Date(Date.UTC(2000, 11, 31, 19, 0, 0));
        });
        expect(inputElm.val()).toBe('2001-01-01');
      }
    );

    if (!isEdge) {
      it('should allow four or more digits in year', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

          helper.changeInputValueTo('10123-01-01');
          expect(+$rootScope.value).toBe(Date.UTC(10123, 0, 1, 0, 0, 0));

          $rootScope.$apply(() => {
            $rootScope.value = new Date(Date.UTC(20456, 1, 1, 0, 0, 0));
          });
          expect(inputElm.val()).toBe('20456-02-01');
        }
      );
    }

    it('should label parse errors as `date`', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="val" name="alias" />', {
        valid: false,
        badInput: true
      });

      helper.changeInputValueTo('nnn');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.alias.$error.date).toBeTruthy();
    });


    it('should work with multiple date types bound to the same model', () => {
      const formElm = jqLite('<form name="form"></form>');

      const timeElm = jqLite('<input type="time" ng-model="val" />');
          const monthElm = jqLite('<input type="month" ng-model="val" />');
          const weekElm = jqLite('<input type="week" ng-model="val" />');

      formElm.append(timeElm);
      formElm.append(monthElm);
      formElm.append(weekElm);

      $compile(formElm)($rootScope);

      $rootScope.$apply(() => {
        $rootScope.val = new Date(2013, 1, 2, 3, 4, 5, 6);
      });

      expect(timeElm.val()).toBe('03:04:05.006');
      expect(monthElm.val()).toBe('2013-02');
      expect(weekElm.val()).toBe('2013-W05');

      helper.changeGivenInputTo(monthElm, '2012-02');
      expect(monthElm.val()).toBe('2012-02');
      expect(timeElm.val()).toBe('03:04:05.006');
      expect(weekElm.val()).toBe('2012-W05');

      helper.changeGivenInputTo(timeElm, '04:05:06');
      expect(monthElm.val()).toBe('2012-02');
      expect(timeElm.val()).toBe('04:05:06');
      expect(weekElm.val()).toBe('2012-W05');

      helper.changeGivenInputTo(weekElm, '2014-W01');
      expect(monthElm.val()).toBe('2014-01');
      expect(timeElm.val()).toBe('04:05:06.000');
      expect(weekElm.val()).toBe('2014-W01');

      expect(+$rootScope.val).toBe(+new Date(2014, 0, 2, 4, 5, 6, 0));

      dealoc(formElm);
    });

    it('should not reuse the hours part of a previous date object after changing the timezone', () => {
      const inputElm = helper.compileInput('<input type="date" ng-model="value" ng-model-options="{timezone: \'UTC\'}" />');

      helper.changeInputValueTo('2000-01-01');
      // The Date parser sets the hours part of the Date to 0 (00:00) (UTC)
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 0));

      // Change the timezone offset so that the display date is a day earlier
      // This does not change the model, but our implementation
      // internally caches a Date object with this offset
      // and re-uses it if part of the Date changes.
      // See https://github.com/angular/angular.js/commit/1a1ef62903c8fdf4ceb81277d966a8eff67f0a96
      inputElm.controller('ngModel').$overrideModelOptions({timezone: '-0500'});
      $rootScope.$apply(() => {
        $rootScope.value = new Date(Date.UTC(2000, 0, 1, 0));
      });
      expect(inputElm.val()).toBe('1999-12-31');

      // At this point, the cached Date has its hours set to to 19 (00:00 - 05:00 = 19:00)
      inputElm.controller('ngModel').$overrideModelOptions({timezone: 'UTC'});

      // When changing the timezone back to UTC, the hours part of the Date should be set to
      // the default 0 (UTC) and not use the modified value of the cached Date object.
      helper.changeInputValueTo('2000-01-01');
      expect(+$rootScope.value).toBe(Date.UTC(2000, 0, 1, 0));
    });


    describe('min', () => {

      it('should invalidate', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" min="2000-01-01" />');
        helper.changeInputValueTo('1999-12-31');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
      });

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" min="2000-01-01" />');
        helper.changeInputValueTo('2000-01-01');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2000, 0, 1));
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should parse ISO-based date strings as a valid min date value', () => {
        const inputElm = helper.compileInput('<input name="myControl" type="date" min="{{ min }}" ng-model="value">');

        $rootScope.value = new Date(2010, 1, 1, 0, 0, 0);
        $rootScope.min = new Date(2014, 10, 10, 0, 0, 0).toISOString();
        $rootScope.$digest();

        expect($rootScope.form.myControl.$error.min).toBeTruthy();
      });

      it('should parse interpolated Date objects as a valid min date value', () => {
        const inputElm = helper.compileInput('<input name="myControl" type="date" min="{{ min }}" ng-model="value">');

        $rootScope.value = new Date(2010, 1, 1, 0, 0, 0);
        $rootScope.min = new Date(2014, 10, 10, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.myControl.$error.min).toBeTruthy();
      });

      it('should validate if min is empty', () => {
        const inputElm = helper.compileInput(
            '<input type="date" name="alias" ng-model="value" min />');

        $rootScope.value = new Date(-9999, 0, 1, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.minVal = '2000-01-01';
        $rootScope.value = new Date(2010, 1, 1, 0, 0, 0);

        let inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="date" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="date" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });

    });

    describe('max', () => {

      it('should invalidate', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" max="2019-01-01" />');
        helper.changeInputValueTo('2019-12-31');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
      });

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" max="2019-01-01" />');
        helper.changeInputValueTo('2000-01-01');
        expect(inputElm).toBeValid();
        expect(+$rootScope.value).toBe(+new Date(2000, 0, 1));
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should parse ISO-based date strings as a valid max date value', () => {
        const inputElm = helper.compileInput('<input name="myControl" type="date" max="{{ max }}" ng-model="value">');

        $rootScope.value = new Date(2020, 1, 1, 0, 0, 0);
        $rootScope.max = new Date(2014, 10, 10, 0, 0, 0).toISOString();
        $rootScope.$digest();

        expect($rootScope.form.myControl.$error.max).toBeTruthy();
      });

      it('should parse interpolated Date objects as a valid max date value', () => {
        const inputElm = helper.compileInput('<input name="myControl" type="date" max="{{ max }}" ng-model="value">');

        $rootScope.value = new Date(2020, 1, 1, 0, 0, 0);
        $rootScope.max = new Date(2014, 10, 10, 0, 0, 0);
        $rootScope.$digest();

        expect($rootScope.form.myControl.$error.max).toBeTruthy();
      });

      it('should validate if max is empty', () => {
        const inputElm = helper.compileInput(
            '<input type="date" name="alias" ng-model="value" max />');

        $rootScope.value = new Date(9999, 11, 31, 23, 59, 59);
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });

      it('should validate when timezone is provided.', () => {
        const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" ' +
            'max="{{ maxVal }}" ng-model-options="{timezone: \'UTC\', allowInvalid: true}"/>');

        $rootScope.maxVal = '2013-12-01';
        $rootScope.value = new Date(Date.UTC(2013, 11, 1, 0, 0, 0));
        $rootScope.$digest();

        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();

        $rootScope.value = '';
        helper.changeInputValueTo('2013-12-01');
        expect(inputElm).toBeValid();
        expect($rootScope.form.alias.$error.max).toBeFalsy();
        expect($rootScope.form.alias.$valid).toBeTruthy();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.maxVal = '2000-01-01';
        $rootScope.value = new Date(2020, 1, 1, 0, 0, 0);

        let inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="date" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);

        inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="date" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });


    it('should validate even if max value changes on-the-fly', () => {
      $rootScope.max = '2013-01-01';
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" max="{{max}}" />');

      helper.changeInputValueTo('2014-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '2001-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.max = '2021-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if min value changes on-the-fly', () => {
      $rootScope.min = '2013-01-01';
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" min="{{min}}" />');

      helper.changeInputValueTo('2010-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '2014-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.min = '2009-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-max value changes on-the-fly', () => {
      $rootScope.max = '2013-01-01';
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" ng-max="max" />');

      helper.changeInputValueTo('2014-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.max = '2001-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.max = '2021-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should validate even if ng-min value changes on-the-fly', () => {
      $rootScope.min = '2013-01-01';
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" ng-min="min" />');

      helper.changeInputValueTo('2010-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.min = '2014-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.min = '2009-01-01';
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should allow Date objects as valid ng-max values', () => {
      $rootScope.max = new Date(2012, 1, 1, 1, 2, 0);
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" ng-max="max" />');

      helper.changeInputValueTo('2014-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.max = new Date(2013, 1, 1, 1, 2, 0);
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.max = new Date(2014, 1, 1, 1, 2, 0);
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });


    it('should allow Date objects as valid ng-min values', () => {
      $rootScope.min = new Date(2013, 1, 1, 1, 2, 0);
      const inputElm = helper.compileInput('<input type="date" ng-model="value" name="alias" ng-min="min" />');

      helper.changeInputValueTo('2010-01-01');
      expect(inputElm).toBeInvalid();

      $rootScope.min = new Date(2014, 1, 1, 1, 2, 0);
      $rootScope.$digest();

      expect(inputElm).toBeInvalid();

      $rootScope.min = new Date(2009, 1, 1, 1, 2, 0);
      $rootScope.$digest();

      expect(inputElm).toBeValid();
    });

    // Support: Edge 16
    // Edge does not support years with any number of digits other than 4.
    if (!isEdge) {
      it('should correctly handle 2-digit years', () => {
        helper.compileInput('<input type="date" ng-model="value" name="alias" />');

        helper.changeInputValueTo('0001-01-01');
        expect($rootScope.value.getFullYear()).toBe(1);

        helper.changeInputValueTo('0099-01-01');
        expect($rootScope.value.getFullYear()).toBe(99);

        helper.changeInputValueTo('0100-01-01');
        expect($rootScope.value.getFullYear()).toBe(100);
      });
    }


    describe('ISO_DATE_REGEXP', () => {
      const dates = [
        // Validate date
        ['00:00:00.0000+01:01', false],             // date must be specified
        ['2010.06.15T00:00:00.0000+01:01', false],  // date must use dash separator
        ['x2010-06-15T00:00:00.0000+01:01', false], // invalid leading characters

        // Validate year
        ['2010-06-15T00:00:00.0000+01:01', true],   // year has four or more digits
        ['20100-06-15T00:00:00.0000+01:01', true],  // year has four or more digits
        ['-06-15T00:00:00.0000+01:01', false],      // year has too few digits
        ['2-06-15T00:00:00.0000+01:01', false],     // year has too few digits
        ['20-06-15T00:00:00.0000+01:01', false],    // year has too few digits
        ['201-06-15T00:00:00.0000+01:01', false],   // year has too few digits

        // Validate month
        ['2010-01-15T00:00:00.0000+01:01', true],   // month has two digits
        ['2010--15T00:00:00.0000+01:01', false],    // month has too few digits
        ['2010-0-15T00:00:00.0000+01:01', false],   // month has too few digits
        ['2010-1-15T00:00:00.0000+01:01', false],   // month has too few digits
        ['2010-111-15T00:00:00.0000+01:01', false], // month has too many digits
        ['2010-22-15T00:00:00.0000+01:01', false],  // month is too large

        // Validate day
        ['2010-01-01T00:00:00.0000+01:01', true],   // day has two digits
        ['2010-01-T00:00:00.0000+01:01', false],    // day has too few digits
        ['2010-01-1T00:00:00.0000+01:01', false],   // day has too few digits
        ['2010-01-200T00:00:00.0000+01:01', false], // day has too many digits
        ['2010-01-41T00:00:00.0000+01:01', false],  // day is too large

        // Validate time
        ['2010-01-01', false],                      // time must be specified
        ['2010-01-0101:00:00.0000+01:01', false],   // missing date time separator
        ['2010-01-01V01:00:00.0000+01:01', false],  // invalid date time separator
        ['2010-01-01T01-00-00.0000+01:01', false],  // time must use colon separator

        // Validate hour
        ['2010-01-01T01:00:00.0000+01:01', true],   // hour has two digits
        ['2010-01-01T-01:00:00.0000+01:01', false], // hour must be positive
        ['2010-01-01T:00:00.0000+01:01', false],    // hour has too few digits
        ['2010-01-01T1:00:00.0000+01:01', false],   // hour has too few digits
        ['2010-01-01T220:00:00.0000+01:01', false], // hour has too many digits
        ['2010-01-01T32:00:00.0000+01:01', false],  // hour is too large

        // Validate minutes
        ['2010-01-01T01:00:00.0000+01:01', true],   // minute has two digits
        ['2010-01-01T01:-00:00.0000+01:01', false], // minute must be positive
        ['2010-01-01T01::00.0000+01:01', false],    // minute has too few digits
        ['2010-01-01T01:0:00.0000+01:01', false],   // minute has too few digits
        ['2010-01-01T01:100:00.0000+01:01', false], // minute has too many digits
        ['2010-01-01T01:60:00.0000+01:01', false],  // minute is too large

        // Validate seconds
        ['2010-01-01T01:00:00.0000+01:01', true],   // second has two digits
        ['2010-01-01T01:00:-00.0000+01:01', false], // second must be positive
        ['2010-01-01T01:00:.0000+01:01', false],    // second has too few digits
        ['2010-01-01T01:00:0.0000+01:01', false],   // second has too few digits
        ['2010-01-01T01:00:100.0000+01:01', false], // second has too many digits
        ['2010-01-01T01:00:60.0000+01:01', false],  // second is too large

        // Validate milliseconds
        ['2010-01-01T01:00:00+01:01', false],       // millisecond must be specified
        ['2010-01-01T01:00:00.-0000+01:01', false], // millisecond must be positive
        ['2010-01-01T01:00:00:0000+01:01', false],  // millisecond must use period separator
        ['2010-01-01T01:00:00.+01:01', false],      // millisecond has too few digits

        // Validate timezone
        ['2010-06-15T00:00:00.0000', false],        // timezone must be specified

        // Validate timezone offset
        ['2010-06-15T00:00:00.0000+01:01', true],   // timezone offset can be positive hours and minutes
        ['2010-06-15T00:00:00.0000-01:01', true],   // timezone offset can be negative hours and minutes
        ['2010-06-15T00:00:00.0000~01:01', false],  // timezone has postive/negative indicator
        ['2010-06-15T00:00:00.000001:01', false],   // timezone has postive/negative indicator
        ['2010-06-15T00:00:00.0000+00:01Z', false], // timezone invalid trailing characters
        ['2010-06-15T00:00:00.0000+00:01 ', false], // timezone invalid trailing characters

        // Validate timezone hour offset
        ['2010-06-15T00:00:00.0000+:01', false],    // timezone hour offset has too few digits
        ['2010-06-15T00:00:00.0000+0:01', false],   // timezone hour offset has too few digits
        ['2010-06-15T00:00:00.0000+211:01', false], // timezone hour offset too many digits
        ['2010-06-15T00:00:00.0000+31:01', false],  // timezone hour offset value too large

        // Validate timezone minute offset
        ['2010-06-15T00:00:00.0000+00:-01', false], // timezone minute offset must be positive
        ['2010-06-15T00:00:00.0000+00.01', false],  // timezone minute offset must use colon separator
        ['2010-06-15T00:00:00.0000+0101', false],   // timezone minute offset must use colon separator
        ['2010-06-15T00:00:00.0000+010', false],    // timezone minute offset must use colon separator
        ['2010-06-15T00:00:00.0000+00', false],     // timezone minute offset has too few digits
        ['2010-06-15T00:00:00.0000+00:', false],    // timezone minute offset has too few digits
        ['2010-06-15T00:00:00.0000+00:0', false],   // timezone minute offset has too few digits
        ['2010-06-15T00:00:00.0000+00:211', false], // timezone minute offset has too many digits
        ['2010-06-15T00:00:00.0000+01010', false],  // timezone minute offset has too many digits
        ['2010-06-15T00:00:00.0000+00:61', false],  // timezone minute offset is too large

        // Validate timezone UTC
        ['2010-06-15T00:00:00.0000Z', true],        // UTC timezone can be indicated with Z
        ['2010-06-15T00:00:00.0000K', false],       // UTC timezone indicator is invalid
        ['2010-06-15T00:00:00.0000 Z', false],      // UTC timezone indicator has extra space
        ['2010-06-15T00:00:00.0000ZZ', false],      // UTC timezone indicator invalid trailing characters
        ['2010-06-15T00:00:00.0000Z ', false]       // UTC timezone indicator invalid trailing characters
      ];

      they('should validate date: $prop', dates, (item) => {
        const date = item[0];
        const valid = item[1];

        /* global ISO_DATE_REGEXP: false */
        expect(ISO_DATE_REGEXP.test(date)).toBe(valid);
      });
    });
  });

  ['month', 'week', 'time', 'date', 'datetime-local'].forEach((inputType) => {
    if (jqLite(`<input type="${  inputType  }">`).prop('type') !== inputType) {
      return;
    }

    describe(inputType, () => {
      they('should re-validate and dirty when partially editing the input value ($prop event)',
        ['keydown', 'wheel', 'mousedown'],
        (validationEvent) => {
          const mockValidity = {valid: true, badInput: false};
          const inputElm = helper.compileInput(`<input type="${  inputType  }" ng-model="val" name="alias" />`, mockValidity);

          expect(inputElm).toBeValid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();

          inputElm.triggerHandler({type: validationEvent});
          mockValidity.valid = false;
          mockValidity.badInput = true;
          $browser.defer.flush();
          expect(inputElm).toBeInvalid();
          expect($rootScope.form.alias.$pristine).toBeFalsy();
        }
      );

      they('should do nothing when $prop event fired but validity does not change',
        ['keydown', 'wheel', 'mousedown'],
        (validationEvent) => {
          const mockValidity = {valid: true, badInput: false};
          const inputElm = helper.compileInput(`<input type="${  inputType  }" ng-model="val" name="alias" />`, mockValidity);

          expect(inputElm).toBeValid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();

          inputElm.triggerHandler({type: validationEvent});
          $browser.defer.flush();
          expect(inputElm).toBeValid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();
        }
      );

      they('should re-validate dirty when already $invalid and partially editing the input value ($prop event)',
        ['keydown', 'wheel', 'mousedown'],
        (validationEvent) => {
          const mockValidity = {valid: false, valueMissing: true, badInput: false};
          const inputElm = helper.compileInput(`<input type="${  inputType  }" required ng-model="val" name="alias" />`, mockValidity);

          expect(inputElm).toBeInvalid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();

          inputElm.triggerHandler({type: validationEvent});
          mockValidity.valid = false;
          mockValidity.valueMissing = true;
          mockValidity.badInput = true;
          $browser.defer.flush();
          expect(inputElm).toBeInvalid();
          expect($rootScope.form.alias.$pristine).toBeFalsy();
        }
      );

      they('should do nothing when already $invalid and $prop event fired but validity does not change',
        ['keydown', 'wheel', 'mousedown'],
        (validationEvent) => {
          const mockValidity = {valid: false, valueMissing: true, badInput: false};
          const inputElm = helper.compileInput(`<input type="${  inputType  }" required ng-model="val" name="alias" />`, mockValidity);

          expect(inputElm).toBeInvalid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();

          inputElm.triggerHandler({type: validationEvent});
          $browser.defer.flush();
          expect(inputElm).toBeInvalid();
          expect($rootScope.form.alias.$pristine).toBeTruthy();
        }
      );
    });
  });


  describe('number', () => {

    // Helpers for min / max tests
    const subtract = function(value) {
      return value - 5;
    };

    const add = function(value) {
      return value + 5;
    };

    it('should reset the model if view is invalid', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age"/>');

      $rootScope.$apply('age = 123');
      expect(inputElm.val()).toBe('123');

      // to allow non-number values, we have to change type so that
      // the browser which have number validation will not interfere with
      // this test.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('123X');
      expect(inputElm.val()).toBe('123X');
      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should render as blank if null', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age" />');

      $rootScope.$apply('age = null');

      expect($rootScope.age).toBeNull();
      expect(inputElm.val()).toEqual('');
    });


    it('should come up blank when no value specified', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age" />');

      expect(inputElm.val()).toBe('');

      $rootScope.$apply('age = null');

      expect($rootScope.age).toBeNull();
      expect(inputElm.val()).toBe('');
    });


    it('should parse empty string to null', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age" />');

      $rootScope.$apply('age = 10');

      helper.changeInputValueTo('');
      expect($rootScope.age).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should only invalidate the model if suffering from bad input when the data is parsed', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age" />', {
        valid: false,
        badInput: true
      });

      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('this-will-fail-because-of-the-badInput-flag');

      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should validate number if transition from bad input to empty string', () => {
      const validity = {
        valid: false,
        badInput: true
      };
      const inputElm = helper.compileInput('<input type="number" ng-model="age" />', validity);
      helper.changeInputValueTo('10a');
      validity.badInput = false;
      validity.valid = true;
      helper.changeInputValueTo('');
      expect($rootScope.age).toBeNull();
      expect(inputElm).toBeValid();
    });


    it('should validate with undefined viewValue when $validate() called', () => {
      const inputElm = helper.compileInput('<input type="number" name="alias" ng-model="value" />');

      $rootScope.form.alias.$validate();

      expect(inputElm).toBeValid();
      expect($rootScope.form.alias.$error.number).toBeUndefined();
    });


    it('should throw if the model value is not a number', () => {
      expect(() => {
        $rootScope.value = 'one';
        const inputElm = helper.compileInput('<input type="number" ng-model="value" />');
      }).toThrowMinErr('ngModel', 'numfmt', 'Expected `one` to be a number');
    });


    it('should parse exponential notation', () => {
      const inputElm = helper.compileInput('<input type="number" name="alias" ng-model="value" />');

      // #.###e+##
      $rootScope.form.alias.$setViewValue('1.23214124123412412e+26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e+26);

      // #.###e##
      $rootScope.form.alias.$setViewValue('1.23214124123412412e26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e26);

      // #.###e-##
      $rootScope.form.alias.$setViewValue('1.23214124123412412e-26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e-26);

      // ####e+##
      $rootScope.form.alias.$setViewValue('123214124123412412e+26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e26);

      // ####e##
      $rootScope.form.alias.$setViewValue('123214124123412412e26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e26);

      // ####e-##
      $rootScope.form.alias.$setViewValue('123214124123412412e-26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e-26);

      // #.###E+##
      $rootScope.form.alias.$setViewValue('1.23214124123412412E+26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e+26);

      // #.###E##
      $rootScope.form.alias.$setViewValue('1.23214124123412412E26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e26);

      // #.###E-##
      $rootScope.form.alias.$setViewValue('1.23214124123412412E-26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(1.23214124123412412e-26);

      // ####E+##
      $rootScope.form.alias.$setViewValue('123214124123412412E+26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e26);

      // ####E##
      $rootScope.form.alias.$setViewValue('123214124123412412E26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e26);

      // ####E-##
      $rootScope.form.alias.$setViewValue('123214124123412412E-26');
      expect(inputElm).toBeValid();
      expect($rootScope.value).toBe(123214124123412412e-26);
    });

    it('should not set $error number if any other parser fails', () => {
      const inputElm = helper.compileInput('<input type="number" ng-model="age"/>');
      const ctrl = inputElm.controller('ngModel');

      let previousParserFail = false;
      let laterParserFail = false;

      ctrl.$parsers.unshift((value) => previousParserFail ? undefined : value);

      ctrl.$parsers.push((value) => laterParserFail ? undefined : value);

      // to allow non-number values, we have to change type so that
      // the browser which have number validation will not interfere with
      // this test.
      inputElm[0].setAttribute('type', 'text');

      helper.changeInputValueTo('123X');
      expect(inputElm.val()).toBe('123X');

      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
      expect(ctrl.$error.number).toBe(true);
      expect(ctrl.$error.parse).toBeFalsy();
      expect(inputElm).toHaveClass('ng-invalid-number');
      expect(inputElm).not.toHaveClass('ng-invalid-parse');

      previousParserFail = true;
      helper.changeInputValueTo('123');
      expect(inputElm.val()).toBe('123');

      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
      expect(ctrl.$error.number).toBeFalsy();
      expect(ctrl.$error.parse).toBe(true);
      expect(inputElm).not.toHaveClass('ng-invalid-number');
      expect(inputElm).toHaveClass('ng-invalid-parse');

      previousParserFail = false;
      laterParserFail = true;

      helper.changeInputValueTo('1234');
      expect(inputElm.val()).toBe('1234');

      expect($rootScope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
      expect(ctrl.$error.number).toBeFalsy();
      expect(ctrl.$error.parse).toBe(true);
      expect(inputElm).not.toHaveClass('ng-invalid-number');
      expect(inputElm).toHaveClass('ng-invalid-parse');

      laterParserFail = false;

      helper.changeInputValueTo('12345');
      expect(inputElm.val()).toBe('12345');

      expect($rootScope.age).toBe(12345);
      expect(inputElm).toBeValid();
      expect(ctrl.$error.number).toBeFalsy();
      expect(ctrl.$error.parse).toBeFalsy();
      expect(inputElm).not.toHaveClass('ng-invalid-number');
      expect(inputElm).not.toHaveClass('ng-invalid-parse');
    });


    describe('min', () => {

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" min="10" />');

        helper.changeInputValueTo('1');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();

        helper.changeInputValueTo('100');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(100);
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });


      it('should validate against the viewValue', () => {
        const inputElm = helper.compileInput(
          '<input type="number" ng-model-options="{allowInvalid: true}" ng-model="value" name="alias" min="10" />');

        const ngModelCtrl = inputElm.controller('ngModel');
        ngModelCtrl.$parsers.push(subtract);

        helper.changeInputValueTo('10');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(5);
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        ngModelCtrl.$parsers.pop();
        ngModelCtrl.$parsers.push(add);

        helper.changeInputValueTo('5');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
        expect($rootScope.value).toBe(10);
      });


      it('should validate even if min value changes on-the-fly', () => {
        $rootScope.min = undefined;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" min="{{min}}" />');
        expect(inputElm).toBeValid();

        helper.changeInputValueTo('15');
        expect(inputElm).toBeValid();

        $rootScope.min = 10;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.min = 20;
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.min = null;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.min = '20';
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.min = 'abc';
        $rootScope.$digest();
        expect(inputElm).toBeValid();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.value = 5;
        $rootScope.minVal = 3;
        const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="number" ng-model="value" validation-spy="min" min="{{ minVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });

    });

    describe('ngMin', () => {

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" ng-min="50" />');

        helper.changeInputValueTo('1');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeFalsy();
        expect($rootScope.form.alias.$error.min).toBeTruthy();

        helper.changeInputValueTo('100');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(100);
        expect($rootScope.form.alias.$error.min).toBeFalsy();
      });


      it('should validate against the viewValue', () => {
        const inputElm = helper.compileInput(
          '<input type="number" ng-model-options="{allowInvalid: true}" ng-model="value" name="alias" ng-min="10" />');
        const ngModelCtrl = inputElm.controller('ngModel');
        ngModelCtrl.$parsers.push(subtract);

        helper.changeInputValueTo('10');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(5);
        expect($rootScope.form.alias.$error.min).toBeFalsy();

        ngModelCtrl.$parsers.pop();
        ngModelCtrl.$parsers.push(add);

        helper.changeInputValueTo('5');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.min).toBeTruthy();
        expect($rootScope.value).toBe(10);
      });


      it('should validate even if the ngMin value changes on-the-fly', () => {
        $rootScope.min = undefined;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" ng-min="min" />');
        expect(inputElm).toBeValid();

        helper.changeInputValueTo('15');
        expect(inputElm).toBeValid();

        $rootScope.min = 10;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.min = 20;
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.min = null;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.min = '20';
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.min = 'abc';
        $rootScope.$digest();
        expect(inputElm).toBeValid();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.value = 5;
        $rootScope.minVal = 3;
        const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="number" ng-model="value" validation-spy="min" ng-min="minVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.min).toBe(1);
      });
    });


    describe('max', () => {

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" max="10" />');

        helper.changeInputValueTo('20');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeUndefined();
        expect($rootScope.form.alias.$error.max).toBeTruthy();

        helper.changeInputValueTo('0');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(0);
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });


      it('should validate against the viewValue', () => {
        const inputElm = helper.compileInput('<input type="number"' +
          'ng-model-options="{allowInvalid: true}" ng-model="value" name="alias" max="10" />');
        const ngModelCtrl = inputElm.controller('ngModel');
        ngModelCtrl.$parsers.push(add);

        helper.changeInputValueTo('10');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(15);
        expect($rootScope.form.alias.$error.max).toBeFalsy();

        ngModelCtrl.$parsers.pop();
        ngModelCtrl.$parsers.push(subtract);

        helper.changeInputValueTo('15');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
        expect($rootScope.value).toBe(10);
      });


      it('should validate even if max value changes on-the-fly', () => {
        $rootScope.max = undefined;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" max="{{max}}" />');
        expect(inputElm).toBeValid();

        helper.changeInputValueTo('5');
        expect(inputElm).toBeValid();

        $rootScope.max = 10;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.max = 0;
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.max = null;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.max = '4';
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.max = 'abc';
        $rootScope.$digest();
        expect(inputElm).toBeValid();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.value = 5;
        $rootScope.maxVal = 3;
        const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="number" ng-model="value" validation-spy="max" name="alias" max="{{ maxVal }}" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });

    });

    describe('ngMax', () => {

      it('should validate', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" ng-max="5" />');

        helper.changeInputValueTo('20');
        expect(inputElm).toBeInvalid();
        expect($rootScope.value).toBeUndefined();
        expect($rootScope.form.alias.$error.max).toBeTruthy();

        helper.changeInputValueTo('0');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(0);
        expect($rootScope.form.alias.$error.max).toBeFalsy();
      });


      it('should validate against the viewValue', () => {
        const inputElm = helper.compileInput('<input type="number"' +
          'ng-model-options="{allowInvalid: true}" ng-model="value" name="alias" ng-max="10" />');
        const ngModelCtrl = inputElm.controller('ngModel');
        ngModelCtrl.$parsers.push(add);

        helper.changeInputValueTo('10');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(15);
        expect($rootScope.form.alias.$error.max).toBeFalsy();

        ngModelCtrl.$parsers.pop();
        ngModelCtrl.$parsers.push(subtract);

        helper.changeInputValueTo('15');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.max).toBeTruthy();
        expect($rootScope.value).toBe(10);
      });


      it('should validate even if the ngMax value changes on-the-fly', () => {
        $rootScope.max = undefined;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" ng-max="max" />');
        expect(inputElm).toBeValid();

        helper.changeInputValueTo('5');
        expect(inputElm).toBeValid();

        $rootScope.max = 10;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.max = 0;
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.max = null;
        $rootScope.$digest();
        expect(inputElm).toBeValid();

        $rootScope.max = '4';
        $rootScope.$digest();
        expect(inputElm).toBeInvalid();

        $rootScope.max = 'abc';
        $rootScope.$digest();
        expect(inputElm).toBeValid();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.value = 5;
        $rootScope.maxVal = 3;
        const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
          '<input type="number" ng-model="value" validation-spy="max" ng-max="maxVal" />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.max).toBe(1);
      });
    });


    forEach({
      step: 'step="{{step}}"',
      ngStep: 'ng-step="step"'
    }, (attrHtml, attrName) => {

      describe(attrName, () => {

        it('should validate', () => {
          $rootScope.step = 10;
          $rootScope.value = 20;
          const inputElm = helper.compileInput(
              `<input type="number" ng-model="value" name="alias" ${  attrHtml  } />`);

          expect(inputElm.val()).toBe('20');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(20);
          expect($rootScope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('18');
          expect(inputElm).toBeInvalid();
          expect(inputElm.val()).toBe('18');
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.alias.$error.step).toBeTruthy();

          helper.changeInputValueTo('10');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('10');
          expect($rootScope.value).toBe(10);
          expect($rootScope.form.alias.$error.step).toBeFalsy();

          $rootScope.$apply('value = 12');
          expect(inputElm).toBeInvalid();
          expect(inputElm.val()).toBe('12');
          expect($rootScope.value).toBe(12);
          expect($rootScope.form.alias.$error.step).toBeTruthy();
        });

        it('should validate even if the step value changes on-the-fly', () => {
          $rootScope.step = 10;
          const inputElm = helper.compileInput(
              `<input type="number" ng-model="value" name="alias" ${  attrHtml  } />`);

          helper.changeInputValueTo('10');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(10);

          // Step changes, but value matches
          $rootScope.$apply('step = 5');
          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(10);
          expect($rootScope.form.alias.$error.step).toBeFalsy();

          // Step changes, value does not match
          $rootScope.$apply('step = 6');
          expect(inputElm).toBeInvalid();
          expect($rootScope.value).toBeUndefined();
          expect(inputElm.val()).toBe('10');
          expect($rootScope.form.alias.$error.step).toBeTruthy();

          // null = valid
          $rootScope.$apply('step = null');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(10);
          expect(inputElm.val()).toBe('10');
          expect($rootScope.form.alias.$error.step).toBeFalsy();

          // Step val as string
          $rootScope.$apply('step = "7"');
          expect(inputElm).toBeInvalid();
          expect($rootScope.value).toBeUndefined();
          expect(inputElm.val()).toBe('10');
          expect($rootScope.form.alias.$error.step).toBeTruthy();

          // unparsable string is ignored
          $rootScope.$apply('step = "abc"');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(10);
          expect(inputElm.val()).toBe('10');
          expect($rootScope.form.alias.$error.step).toBeFalsy();
        });

        it('should use the correct "step base" when `[min]` is specified', () => {
          $rootScope.min = 5;
          $rootScope.step = 10;
          $rootScope.value = 10;
          const inputElm = helper.compileInput(
              `<input type="number" ng-model="value" min="{{min}}" ${  attrHtml  } />`);
          const ngModel = inputElm.controller('ngModel');

          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBe(10); // an initially invalid value should not be changed

          helper.changeInputValueTo('15');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(15);

          $rootScope.$apply('step = 3');
          expect(inputElm.val()).toBe('15');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();

          helper.changeInputValueTo('8');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(8);

          $rootScope.$apply('min = 10; step = 20');
          helper.changeInputValueTo('30');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(30);

          $rootScope.$apply('min = 5');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();

          $rootScope.$apply('step = 0.00000001');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(30);

          // 0.3 - 0.2 === 0.09999999999999998
          $rootScope.$apply('min = 0.2; step = (0.3 - 0.2)');
          helper.changeInputValueTo('0.3');
          expect(inputElm.val()).toBe('0.3');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();
        });

        it('should correctly validate even in cases where the JS floating point arithmetic fails',
          () => {
            $rootScope.step = 0.1;
            const inputElm = helper.compileInput(
                `<input type="number" ng-model="value" ${  attrHtml  } />`);
            const ngModel = inputElm.controller('ngModel');

            expect(inputElm.val()).toBe('');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBeUndefined();

            helper.changeInputValueTo('0.3');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(0.3);

            helper.changeInputValueTo('2.9999999999999996');
            expect(inputElm).toBeInvalid();
            expect(ngModel.$error.step).toBe(true);
            expect($rootScope.value).toBeUndefined();

            // 0.5 % 0.1 === 0.09999999999999998
            helper.changeInputValueTo('0.5');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(0.5);

            // 3.5 % 0.1 === 0.09999999999999981
            helper.changeInputValueTo('3.5');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(3.5);

            // 1.16 % 0.01 === 0.009999999999999896
            // 1.16 * 100  === 115.99999999999999
            $rootScope.step = 0.01;
            helper.changeInputValueTo('1.16');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(1.16);
          }
        );

        it('should validate only once after compilation inside ngRepeat', () => {
          $rootScope.step = 10;
          $rootScope.value = 20;
          const inputElm = helper.compileInput(`<div ng-repeat="input in [0]">` +
              `<input type="number" ng-model="value" name="alias" ${  attrHtml  } validation-spy="step" />` +
              `</div>`);

          expect(helper.validationCounter.step).toBe(1);
        });

      });
    });


    describe('required', () => {

      it('should be valid even if value is 0', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" required />');

        helper.changeInputValueTo('0');
        expect(inputElm).toBeValid();
        expect($rootScope.value).toBe(0);
        expect($rootScope.form.alias.$error.required).toBeFalsy();
      });

      it('should be valid even if value 0 is set from model', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" required />');

        $rootScope.$apply('value = 0');

        expect(inputElm).toBeValid();
        expect(inputElm.val()).toBe('0');
        expect($rootScope.form.alias.$error.required).toBeFalsy();
      });

      it('should register required on non boolean elements', () => {
        const inputElm = helper.compileInput('<div ng-model="value" name="alias" required>');

        $rootScope.$apply('value = \'\'');

        expect(inputElm).toBeInvalid();
        expect($rootScope.form.alias.$error.required).toBeTruthy();
      });

      it('should not invalidate number if ng-required=false and viewValue has not been committed', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" name="alias" ng-required="required">');

        $rootScope.$apply('required = false');

        expect(inputElm).toBeValid();
      });

      it('should only validate once after compilation when inside ngRepeat', () => {
        $rootScope.value = 'text';
        const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
            '<input ng-model="value" validation-spy="required" required />' +
          '</div>');
        $rootScope.$digest();

        expect(helper.validationCounter.required).toBe(1);
      });
    });

    describe('ngRequired', () => {

      describe('when the ngRequired expression initially evaluates to true', () => {

        it('should be valid even if value is 0', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="true" />');

          helper.changeInputValueTo('0');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(0);
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
        });

        it('should be valid even if value 0 is set from model', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="true" />');

          $rootScope.$apply('value = 0');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('0');
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
        });

        it('should register required on non boolean elements', () => {
          const inputElm = helper.compileInput('<div ng-model="value" name="numberInput" ng-required="true">');

          $rootScope.$apply('value = \'\'');

          expect(inputElm).toBeInvalid();
          expect($rootScope.form.numberInput.$error.required).toBeTruthy();
        });

        it('should change from invalid to valid when the value is empty and the ngRequired expression changes to false', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="ngRequiredExpr" />');

          $rootScope.$apply('ngRequiredExpr = true');

          expect(inputElm).toBeInvalid();
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.numberInput.$error.required).toBeTruthy();

          $rootScope.$apply('ngRequiredExpr = false');

          expect(inputElm).toBeValid();
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
        });

        it('should only validate once after compilation when inside ngRepeat', () => {
          $rootScope.value = 'text';
          $rootScope.isRequired = true;
          const inputElm = helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input ng-model="value" validation-spy="required" ng-required="isRequired" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.required).toBe(1);
        });
      });

      describe('when the ngRequired expression initially evaluates to false', () => {

        it('should be valid even if value is empty', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="false" />');

          expect(inputElm).toBeValid();
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
          expect($rootScope.form.numberInput.$error.number).toBeFalsy();
        });

        it('should be valid if value is non-empty', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="false" />');

          helper.changeInputValueTo('42');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(42);
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
        });

        it('should not register required on non boolean elements', () => {
          const inputElm = helper.compileInput('<div ng-model="value" name="numberInput" ng-required="false">');

          $rootScope.$apply('value = \'\'');

          expect(inputElm).toBeValid();
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();
        });

        it('should change from valid to invalid when the value is empty and the ngRequired expression changes to true', () => {
          const inputElm = helper.compileInput('<input type="number" ng-model="value" name="numberInput" ng-required="ngRequiredExpr" />');

          $rootScope.$apply('ngRequiredExpr = false');

          expect(inputElm).toBeValid();
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.numberInput.$error.required).toBeFalsy();

          $rootScope.$apply('ngRequiredExpr = true');

          expect(inputElm).toBeInvalid();
          expect($rootScope.value).toBeUndefined();
          expect($rootScope.form.numberInput.$error.required).toBeTruthy();
        });
      });
    });

    describe('minlength', () => {

      it('should invalidate values that are shorter than the given minlength', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" ng-minlength="3" />');

        helper.changeInputValueTo('12');
        expect(inputElm).toBeInvalid();

        helper.changeInputValueTo('123');
        expect(inputElm).toBeValid();
      });

      it('should listen on ng-minlength when minlength is observed', () => {
        let value = 0;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" ng-minlength="min" attr-capture />');
        helper.attrs.$observe('minlength', (v) => {
          value = toInt(helper.attrs.minlength);
        });

        $rootScope.$apply(() => {
          $rootScope.min = 5;
        });

        expect(value).toBe(5);
      });

      it('should observe the standard minlength attribute and register it as a validator on the model', () => {
        const inputElm = helper.compileInput('<input type="number" name="input" ng-model="value" minlength="{{ min }}" />');
        $rootScope.$apply(() => {
          $rootScope.min = 10;
        });

        helper.changeInputValueTo('12345');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.input.$error.minlength).toBe(true);

        $rootScope.$apply(() => {
          $rootScope.min = 5;
        });

        expect(inputElm).toBeValid();
        expect($rootScope.form.input.$error.minlength).not.toBe(true);
      });
    });


    describe('maxlength', () => {

      it('should invalidate values that are longer than the given maxlength', () => {
        const inputElm = helper.compileInput('<input type="number" ng-model="value" ng-maxlength="5" />');

        helper.changeInputValueTo('12345678');
        expect(inputElm).toBeInvalid();

        helper.changeInputValueTo('123');
        expect(inputElm).toBeValid();
      });

      it('should listen on ng-maxlength when maxlength is observed', () => {
        let value = 0;
        const inputElm = helper.compileInput('<input type="number" ng-model="value" ng-maxlength="max" attr-capture />');
        helper.attrs.$observe('maxlength', (v) => {
          value = toInt(helper.attrs.maxlength);
        });

        $rootScope.$apply(() => {
          $rootScope.max = 10;
        });

        expect(value).toBe(10);
      });

      it('should observe the standard maxlength attribute and register it as a validator on the model', () => {
        const inputElm = helper.compileInput('<input type="number" name="input" ng-model="value" maxlength="{{ max }}" />');
        $rootScope.$apply(() => {
          $rootScope.max = 1;
        });

        helper.changeInputValueTo('12345');
        expect(inputElm).toBeInvalid();
        expect($rootScope.form.input.$error.maxlength).toBe(true);

        $rootScope.$apply(() => {
          $rootScope.max = 6;
        });

        expect(inputElm).toBeValid();
        expect($rootScope.form.input.$error.maxlength).not.toBe(true);
      });
    });
  });

  describe('range', () => {
    let scope;

    const rangeTestEl = angular.element('<input type="range">');
    const supportsRange = rangeTestEl[0].type === 'range';
    beforeEach(() => {
      scope = $rootScope;
    });

    if (supportsRange) {
      // This behavior only applies to browsers that implement the range input, which do not
      // allow to set a non-number value and will set the value of the input to 50 even when you
      // change it directly on the element.
      // Other browsers fall back to text inputs, where setting a model value of 50 does not make
      // sense if the input value is a string. These browsers will mark the input as invalid instead.

      it('should render as 50 if null', () => {
        const inputElm = helper.compileInput('<input type="range" ng-model="age" />');

        helper.changeInputValueTo('25');
        expect(scope.age).toBe(25);

        scope.$apply('age = null');

        expect(inputElm.val()).toEqual('50');
      });

      it('should set model to 50 when no value specified and default min/max', () => {
        const inputElm = helper.compileInput('<input type="range" ng-model="age" />');

        expect(inputElm.val()).toBe('50');

        scope.$apply('age = null');

        expect(scope.age).toBe(50);
      });

      it('should parse non-number values to 50 when default min/max', () => {
        const inputElm = helper.compileInput('<input type="range" ng-model="age" />');

        scope.$apply('age = 10');
        expect(inputElm.val()).toBe('10');

        helper.changeInputValueTo('');
        expect(scope.age).toBe(50);
        expect(inputElm).toBeValid();
      });
    } else {

      it('should reset the model if view is invalid', () => {
        const inputElm = helper.compileInput('<input type="range" ng-model="age"/>');

        scope.$apply('age = 100');
        expect(inputElm.val()).toBe('100');

        helper.changeInputValueTo('100X');
        expect(inputElm.val()).toBe('100X');
        expect(scope.age).toBeUndefined();
        expect(inputElm).toBeInvalid();
      });
    }

    it('should parse the input value to a Number', () => {
      const inputElm = helper.compileInput('<input type="range" ng-model="age" />');

      helper.changeInputValueTo('75');
      expect(scope.age).toBe(75);
    });


    it('should only invalidate the model if suffering from bad input when the data is parsed', () => {
      scope.age = 60;

      const inputElm = helper.compileInput('<input type="range" ng-model="age" />', {
        valid: false,
        badInput: true
      });

      expect(inputElm).toBeValid();

      helper.changeInputValueTo('this-will-fail-because-of-the-badInput-flag');

      expect(scope.age).toBeUndefined();
      expect(inputElm).toBeInvalid();
    });


    it('should throw if the model value is not a number', () => {
      expect(() => {
        scope.value = 'one';
        const inputElm = helper.compileInput('<input type="range" ng-model="value" />');
      }).toThrowMinErr('ngModel', 'numfmt', 'Expected `one` to be a number');
    });


    describe('min', () => {

      if (supportsRange) {

        it('should initialize correctly with non-default model and min value', () => {
          scope.value = -3;
          scope.min = -5;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="{{min}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('-3');
          expect(scope.value).toBe(-3);
          expect(scope.form.alias.$error.min).toBeFalsy();
        });

        // Browsers that implement range will never allow you to set the value < min values
        it('should adjust invalid input values', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="10" />');

          helper.changeInputValueTo('5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.min).toBeFalsy();

          helper.changeInputValueTo('100');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(100);
          expect(scope.form.alias.$error.min).toBeFalsy();
        });

        it('should set the model to the min val if it is less than the min val', () => {
          scope.value = -10;
          // Default min is 0
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="{{min}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('0');
          expect(scope.value).toBe(0);

          scope.$apply('value = 5; min = 10');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('10');
          expect(scope.value).toBe(10);
        });

        it('should adjust the element and model value when the min value changes on-the-fly', () => {
          scope.min = 10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="{{min}}" />');

          helper.changeInputValueTo('15');
          expect(inputElm).toBeValid();

          scope.min = 20;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(20);
          expect(inputElm.val()).toBe('20');

          scope.min = null;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(20);
          expect(inputElm.val()).toBe('20');

          scope.min = '15';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(20);
          expect(inputElm.val()).toBe('20');

          scope.min = 'abc';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(20);
          expect(inputElm.val()).toBe('20');
        });

        it('should only validate once after compilation when inside ngRepeat', () => {
          $rootScope.minVal = 5;
          $rootScope.value = 10;
          helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input type="range" ng-model="value" validation-spy="min" min="minVal" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.min).toBe(1);
        });

      } else {
        // input[type=range] will become type=text in browsers that don't support it

        it('should validate if "range" is not implemented', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="10" />');

          helper.changeInputValueTo('5');
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(scope.form.alias.$error.min).toBeTruthy();

          helper.changeInputValueTo('100');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(100);
          expect(scope.form.alias.$error.min).toBeFalsy();
        });

        it('should not assume a min val of 0 if the min interpolates to a non-number', () => {
          scope.value = -10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="{{min}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('-10');
          expect(scope.value).toBe(-10);
          expect(scope.form.alias.$error.min).toBeFalsy();

          helper.changeInputValueTo('-5');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('-5');
          expect(scope.value).toBe(-5);
          expect(scope.form.alias.$error.min).toBeFalsy();

          scope.$apply('max = "null"');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('-5');
          expect(scope.value).toBe(-5);
          expect(scope.form.alias.$error.max).toBeFalsy();

          scope.$apply('max = "asdf"');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('-5');
          expect(scope.value).toBe(-5);
          expect(scope.form.alias.$error.max).toBeFalsy();
        });

        it('should validate even if the min value changes on-the-fly', () => {
          scope.min = 10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" min="{{min}}" />');

          helper.changeInputValueTo('15');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(15);

          scope.min = 20;
          scope.$digest();
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('15');

          scope.min = null;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(15);
          expect(inputElm.val()).toBe('15');

          scope.min = '16';
          scope.$digest();
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('15');

          scope.min = 'abc';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(15);
          expect(inputElm.val()).toBe('15');
        });

        it('should only validate once after compilation when inside ngRepeat', () => {
          $rootScope.minVal = 5;
          $rootScope.value = 10;
          helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input type="range" ng-model="value" validation-spy="min" min="minVal" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.min).toBe(1);
        });
      }
    });

    describe('max', () => {

      if (supportsRange) {
        // Browsers that implement range will never allow you to set the value > max value
        it('should initialize correctly with non-default model and max value', () => {
          scope.value = 130;
          scope.max = 150;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('130');
          expect(scope.value).toBe(130);
          expect(scope.form.alias.$error.max).toBeFalsy();
        });

        it('should validate', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="10" />');

          helper.changeInputValueTo('20');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.max).toBeFalsy();

          helper.changeInputValueTo('0');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(scope.form.alias.$error.max).toBeFalsy();
        });

        it('should set the model to the max val if it is greater than the max val', () => {
          scope.value = 110;
          // Default max is 100
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('100');
          expect(scope.value).toBe(100);

          scope.$apply('value = 90; max = 10');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('10');
          expect(scope.value).toBe(10);
        });

        it('should adjust the element and model value if the max value changes on-the-fly', () => {
          scope.max = 10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" />');

          helper.changeInputValueTo('5');
          expect(inputElm).toBeValid();

          scope.max = 0;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(inputElm.val()).toBe('0');

          scope.max = null;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(inputElm.val()).toBe('0');

          scope.max = '4';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(inputElm.val()).toBe('0');

          scope.max = 'abc';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(inputElm.val()).toBe('0');
        });

        it('should only validate once after compilation when inside ngRepeat and the value is valid', () => {
          $rootScope.maxVal = 5;
          $rootScope.value = 5;
          helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input type="range" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.max).toBe(1);
        });

      } else {
        it('should validate if "range" is not implemented', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="10" />');

          helper.changeInputValueTo('20');
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(scope.form.alias.$error.max).toBeTruthy();

          helper.changeInputValueTo('0');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(0);
          expect(scope.form.alias.$error.max).toBeFalsy();
        });

        it('should not assume a max val of 100 if the max attribute interpolates to a non-number', () => {
          scope.value = 120;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" />');

          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('120');
          expect(scope.value).toBe(120);
          expect(scope.form.alias.$error.max).toBeFalsy();

          helper.changeInputValueTo('140');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('140');
          expect(scope.value).toBe(140);
          expect(scope.form.alias.$error.max).toBeFalsy();

          scope.$apply('max = null');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('140');
          expect(scope.value).toBe(140);
          expect(scope.form.alias.$error.max).toBeFalsy();

          scope.$apply('max = "asdf"');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('140');
          expect(scope.value).toBe(140);
          expect(scope.form.alias.$error.max).toBeFalsy();
        });

        it('should validate even if the max value changes on-the-fly', () => {
          scope.max = 10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" />');

          helper.changeInputValueTo('5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);

          scope.max = 0;
          scope.$digest();
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('5');

          scope.max = null;
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(inputElm.val()).toBe('5');

          scope.max = '4';
          scope.$digest();
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('5');

          scope.max = 'abc';
          scope.$digest();
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(inputElm.val()).toBe('5');
        });

        it('should only validate once after compilation when inside ngRepeat', () => {
          $rootScope.maxVal = 5;
          $rootScope.value = 10;
          helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input type="range" ng-model="value" validation-spy="max" max="{{ maxVal }}" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.max).toBe(1);
        });
      }
    });

    if (supportsRange) {

      describe('min and max', () => {

        it('should set the correct initial value when min and max are specified', () => {
          scope.max = 80;
          scope.min = 40;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" min="{{min}}" />');

          expect(inputElm.val()).toBe('60');
          expect(scope.value).toBe(60);
        });

        it('should set element and model value to min if max is less than min', () => {
          scope.min = 40;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" max="{{max}}" min="{{min}}" />');

          expect(inputElm.val()).toBe('70');
          expect(scope.value).toBe(70);

          scope.max = 20;
          scope.$digest();

          expect(inputElm.val()).toBe('40');
          expect(scope.value).toBe(40);
        });
      });
    }


    describe('step', () => {

      if (supportsRange) {
        // Browsers that implement range will never allow you to set a value that doesn't match the step value
        // However, currently only Firefox fully implements the spec when setting the value after the step value changes.
        // Other browsers fail in various edge cases, which is why they are not tested here.

        it('should round the input value to the nearest step on user input', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" step="5" />');

          helper.changeInputValueTo('5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(scope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('9');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('7');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(scope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('7.5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();
        });

        it('should round the input value to the nearest step when setting the model', () => {
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" step="5" />');

          scope.$apply('value = 10');
          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          scope.$apply('value = 5');
          expect(inputElm.val()).toBe('5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(scope.form.alias.$error.step).toBeFalsy();

          scope.$apply('value = 7.5');
          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          scope.$apply('value = 7');
          expect(inputElm.val()).toBe('5');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(5);
          expect(scope.form.alias.$error.step).toBeFalsy();

          scope.$apply('value = 9');
          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();
        });

        it('should only validate once after compilation when inside ngRepeat', () => {
          $rootScope.stepVal = 5;
          $rootScope.value = 10;
          helper.compileInput('<div ng-repeat="input in [0]">' +
              '<input type="range" ng-model="value" validation-spy="step" step="{{ stepVal }}" />' +
            '</div>');
          $rootScope.$digest();

          expect(helper.validationCounter.step).toBe(1);
        });

      } else {

        it('should validate if "range" is not implemented', () => {
          scope.step = 10;
          scope.value = 20;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" step="{{step}}" />');

          expect(inputElm.val()).toBe('20');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(20);
          expect(scope.form.alias.$error.step).toBeFalsy();

          helper.changeInputValueTo('18');
          expect(inputElm).toBeInvalid();
          expect(inputElm.val()).toBe('18');
          expect(scope.value).toBeUndefined();
          expect(scope.form.alias.$error.step).toBeTruthy();

          helper.changeInputValueTo('10');
          expect(inputElm).toBeValid();
          expect(inputElm.val()).toBe('10');
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          scope.$apply('value = 12');
          expect(inputElm).toBeInvalid();
          expect(inputElm.val()).toBe('12');
          expect(scope.value).toBe(12);
          expect(scope.form.alias.$error.step).toBeTruthy();
        });

        it('should validate even if the step value changes on-the-fly', () => {
          scope.step = 10;
          const inputElm = helper.compileInput('<input type="range" ng-model="value" name="alias" step="{{step}}" />');

          helper.changeInputValueTo('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);

          // Step changes, but value matches
          scope.$apply('step = 5');
          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(scope.form.alias.$error.step).toBeFalsy();

          // Step changes, value does not match
          scope.$apply('step = 6');
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('10');
          expect(scope.form.alias.$error.step).toBeTruthy();

          // null = valid
          scope.$apply('step = null');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(inputElm.val()).toBe('10');
          expect(scope.form.alias.$error.step).toBeFalsy();

          // Step val as string
          scope.$apply('step = "7"');
          expect(inputElm).toBeInvalid();
          expect(scope.value).toBeUndefined();
          expect(inputElm.val()).toBe('10');
          expect(scope.form.alias.$error.step).toBeTruthy();

          // unparsable string is ignored
          scope.$apply('step = "abc"');
          expect(inputElm).toBeValid();
          expect(scope.value).toBe(10);
          expect(inputElm.val()).toBe('10');
          expect(scope.form.alias.$error.step).toBeFalsy();
        });

        it('should use the correct "step base" when `[min]` is specified', () => {
          $rootScope.min = 5;
          $rootScope.step = 10;
          $rootScope.value = 10;
          const inputElm = helper.compileInput(
              '<input type="range" ng-model="value" min="{{min}}" step="{{step}}" />');
          const ngModel = inputElm.controller('ngModel');

          expect(inputElm.val()).toBe('10');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBe(10);

          helper.changeInputValueTo('15');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(15);

          $rootScope.$apply('step = 3');
          expect(inputElm.val()).toBe('15');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();

          helper.changeInputValueTo('8');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(8);

          $rootScope.$apply('min = 10; step = 20; value = 30');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(30);

          $rootScope.$apply('min = 5');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();

          $rootScope.$apply('step = 0.00000001');
          expect(inputElm.val()).toBe('30');
          expect(inputElm).toBeValid();
          expect($rootScope.value).toBe(30);

          // 0.3 - 0.2 === 0.09999999999999998
          $rootScope.$apply('min = 0.2; step = 0.09999999999999998; value = 0.3');
          expect(inputElm.val()).toBe('0.3');
          expect(inputElm).toBeInvalid();
          expect(ngModel.$error.step).toBe(true);
          expect($rootScope.value).toBeUndefined();
        });

        it('should correctly validate even in cases where the JS floating point arithmetic fails',
          () => {
            $rootScope.step = 0.1;
            const inputElm = helper.compileInput(
                '<input type="range" ng-model="value" step="{{step}}" />');
            const ngModel = inputElm.controller('ngModel');

            expect(inputElm.val()).toBe('');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBeUndefined();

            helper.changeInputValueTo('0.3');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(0.3);

            helper.changeInputValueTo('2.9999999999999996');
            expect(inputElm).toBeInvalid();
            expect(ngModel.$error.step).toBe(true);
            expect($rootScope.value).toBeUndefined();

            // 0.5 % 0.1 === 0.09999999999999998
            helper.changeInputValueTo('0.5');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(0.5);

            // 3.5 % 0.1 === 0.09999999999999981
            helper.changeInputValueTo('3.5');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(3.5);

            // 1.16 % 0.01 === 0.009999999999999896
            // 1.16 * 100  === 115.99999999999999
            $rootScope.step = 0.01;
            helper.changeInputValueTo('1.16');
            expect(inputElm).toBeValid();
            expect($rootScope.value).toBe(1.16);
          }
        );
      }
    });
  });

  describe('email', () => {

    it('should validate e-mail', () => {
      const inputElm = helper.compileInput('<input type="email" ng-model="email" name="alias" />');

      const widget = $rootScope.form.alias;
      helper.changeInputValueTo('vojta@google.com');

      expect($rootScope.email).toBe('vojta@google.com');
      expect(inputElm).toBeValid();
      expect(widget.$error.email).toBeFalsy();

      helper.changeInputValueTo('invalid@');
      expect($rootScope.email).toBeUndefined();
      expect(inputElm).toBeInvalid();
      expect(widget.$error.email).toBeTruthy();
    });


    describe('EMAIL_REGEXP', () => {
      /* global EMAIL_REGEXP: false */
      it('should validate email', () => {
        /* basic functionality */
        expect(EMAIL_REGEXP.test('a@b.com')).toBe(true);
        expect(EMAIL_REGEXP.test('a@b.museum')).toBe(true);
        expect(EMAIL_REGEXP.test('a@B.c')).toBe(true);
        /* domain label separation, hyphen-minus, syntax */
        expect(EMAIL_REGEXP.test('a@b.c.')).toBe(false);
        expect(EMAIL_REGEXP.test('a@.b.c')).toBe(false);
        expect(EMAIL_REGEXP.test('a@-b.c')).toBe(false);
        expect(EMAIL_REGEXP.test('a@b-.c')).toBe(false);
        expect(EMAIL_REGEXP.test('a@b-c')).toBe(true);
        expect(EMAIL_REGEXP.test('a@-')).toBe(false);
        expect(EMAIL_REGEXP.test('a@.')).toBe(false);
        expect(EMAIL_REGEXP.test('a@host_name')).toBe(false);
        /* leading or sole digit */
        expect(EMAIL_REGEXP.test('a@3b.c')).toBe(true);
        expect(EMAIL_REGEXP.test('a@3')).toBe(true);
        /* TLD eMail address */
        expect(EMAIL_REGEXP.test('a@b')).toBe(true);
        /* domain valid characters */
        expect(EMAIL_REGEXP.test('a@abcdefghijklmnopqrstuvwxyz-ABCDEFGHIJKLMNOPQRSTUVWXYZ.0123456789')).toBe(true);
        /* domain invalid characters */
        expect(EMAIL_REGEXP.test('a@')).toBe(false);
        expect(EMAIL_REGEXP.test('a@ ')).toBe(false);
        expect(EMAIL_REGEXP.test('a@!')).toBe(false);
        expect(EMAIL_REGEXP.test('a@"')).toBe(false);
        expect(EMAIL_REGEXP.test('a@#')).toBe(false);
        expect(EMAIL_REGEXP.test('a@$')).toBe(false);
        expect(EMAIL_REGEXP.test('a@%')).toBe(false);
        expect(EMAIL_REGEXP.test('a@&')).toBe(false);
        expect(EMAIL_REGEXP.test('a@\'')).toBe(false);
        expect(EMAIL_REGEXP.test('a@(')).toBe(false);
        expect(EMAIL_REGEXP.test('a@)')).toBe(false);
        expect(EMAIL_REGEXP.test('a@*')).toBe(false);
        expect(EMAIL_REGEXP.test('a@+')).toBe(false);
        expect(EMAIL_REGEXP.test('a@,')).toBe(false);
        expect(EMAIL_REGEXP.test('a@/')).toBe(false);
        expect(EMAIL_REGEXP.test('a@:')).toBe(false);
        expect(EMAIL_REGEXP.test('a@;')).toBe(false);
        expect(EMAIL_REGEXP.test('a@<')).toBe(false);
        expect(EMAIL_REGEXP.test('a@=')).toBe(false);
        expect(EMAIL_REGEXP.test('a@>')).toBe(false);
        expect(EMAIL_REGEXP.test('a@?')).toBe(false);
        expect(EMAIL_REGEXP.test('a@@')).toBe(false);
        expect(EMAIL_REGEXP.test('a@[')).toBe(false);
        expect(EMAIL_REGEXP.test('a@\\')).toBe(false);
        expect(EMAIL_REGEXP.test('a@]')).toBe(false);
        expect(EMAIL_REGEXP.test('a@^')).toBe(false);
        expect(EMAIL_REGEXP.test('a@_')).toBe(false);
        expect(EMAIL_REGEXP.test('a@`')).toBe(false);
        expect(EMAIL_REGEXP.test('a@{')).toBe(false);
        expect(EMAIL_REGEXP.test('a@|')).toBe(false);
        expect(EMAIL_REGEXP.test('a@}')).toBe(false);
        expect(EMAIL_REGEXP.test('a@~')).toBe(false);
        expect(EMAIL_REGEXP.test('a@İ')).toBe(false);
        expect(EMAIL_REGEXP.test('a@ı')).toBe(false);
        /* domain length, label and total */
        expect(EMAIL_REGEXP.test('a@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true);
        expect(EMAIL_REGEXP.test('a@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
        /* eslint-disable max-len */
        expect(EMAIL_REGEXP.test('a@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(true);
        expect(EMAIL_REGEXP.test('a@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.x')).toBe(true);
        expect(EMAIL_REGEXP.test('a@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xx')).toBe(false);
        expect(EMAIL_REGEXP.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xx')).toBe(true);
        expect(EMAIL_REGEXP.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxx')).toBe(false);
        /* eslint-enable */
        /* local-part valid characters and dot-atom syntax */
        expect(EMAIL_REGEXP.test('\'@x')).toBe(true);
        expect(EMAIL_REGEXP.test('-!#$%&*+/0123456789=?ABCDEFGHIJKLMNOPQRSTUVWXYZ@x')).toBe(true);
        expect(EMAIL_REGEXP.test('^_`abcdefghijklmnopqrstuvwxyz{|}~@x')).toBe(true);
        expect(EMAIL_REGEXP.test('.@x')).toBe(false);
        expect(EMAIL_REGEXP.test('\'.@x')).toBe(false);
        expect(EMAIL_REGEXP.test('.\'@x')).toBe(false);
        expect(EMAIL_REGEXP.test('\'.\'@x')).toBe(true);
        /* local-part invalid characters */
        expect(EMAIL_REGEXP.test('@x')).toBe(false);
        expect(EMAIL_REGEXP.test(' @x')).toBe(false);
        expect(EMAIL_REGEXP.test('"@x')).toBe(false);
        expect(EMAIL_REGEXP.test('(@x')).toBe(false);
        expect(EMAIL_REGEXP.test(')@x')).toBe(false);
        expect(EMAIL_REGEXP.test(',@x')).toBe(false);
        expect(EMAIL_REGEXP.test(':@x')).toBe(false);
        expect(EMAIL_REGEXP.test(';@x')).toBe(false);
        expect(EMAIL_REGEXP.test('<@x')).toBe(false);
        expect(EMAIL_REGEXP.test('>@x')).toBe(false);
        expect(EMAIL_REGEXP.test('@@x')).toBe(false);
        expect(EMAIL_REGEXP.test('[@x')).toBe(false);
        expect(EMAIL_REGEXP.test('\\@x')).toBe(false);
        expect(EMAIL_REGEXP.test(']@x')).toBe(false);
        expect(EMAIL_REGEXP.test('İ@x')).toBe(false);
        expect(EMAIL_REGEXP.test('ı@x')).toBe(false);
        /* local-part size limit */
        expect(EMAIL_REGEXP.test('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@x')).toBe(true);
        expect(EMAIL_REGEXP.test('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@x')).toBe(false);
        /* content (local-part + ‘@’ + domain) is required */
        expect(EMAIL_REGEXP.test('')).toBe(false);
        expect(EMAIL_REGEXP.test('a')).toBe(false);
        expect(EMAIL_REGEXP.test('aa')).toBe(false);
      });
    });
  });


  describe('url', () => {

    it('should validate url', () => {
      const inputElm = helper.compileInput('<input type="url" ng-model="url" name="alias" />');
      const widget = $rootScope.form.alias;

      helper.changeInputValueTo('http://www.something.com');
      expect($rootScope.url).toBe('http://www.something.com');
      expect(inputElm).toBeValid();
      expect(widget.$error.url).toBeFalsy();

      helper.changeInputValueTo('invalid.com');
      expect($rootScope.url).toBeUndefined();
      expect(inputElm).toBeInvalid();
      expect(widget.$error.url).toBeTruthy();
    });


    describe('URL_REGEXP', () => {
      // See valid URLs in RFC3987 (http://tools.ietf.org/html/rfc3987)
      // Note: We are being more lenient, because browsers are too.
      const urls = [
        ['scheme://hostname', true],
        ['scheme://username:password@host.name:7678/pa/t.h?q=u&e=r&y#fragment', true],

        // Validating `scheme`
        ['://example.com', false],
        ['0scheme://example.com', false],
        ['.scheme://example.com', false],
        ['+scheme://example.com', false],
        ['-scheme://example.com', false],
        ['_scheme://example.com', false],
        ['scheme0://example.com', true],
        ['scheme.://example.com', true],
        ['scheme+://example.com', true],
        ['scheme-://example.com', true],
        ['scheme_://example.com', false],

        // Validating `:` and `/` after `scheme`
        ['scheme//example.com', false],
        ['scheme:example.com', true],
        ['scheme:/example.com', true],
        ['scheme:///example.com', true],

        // Validating `username` and `password`
        ['scheme://@example.com', true],
        ['scheme://username@example.com', true],
        ['scheme://u0s.e+r-n_a~m!e@example.com', true],
        ['scheme://u#s$e%r^n&a*m;e@example.com', true],
        ['scheme://:password@example.com', true],
        ['scheme://username:password@example.com', true],
        ['scheme://username:pass:word@example.com', true],
        ['scheme://username:p0a.s+s-w_o~r!d@example.com', true],
        ['scheme://username:p#a$s%s^w&o*r;d@example.com', true],

        // Validating `hostname`
        ['scheme:', false],                                  // Chrome, FF: true
        ['scheme://', false],                                // Chrome, FF: true
        ['scheme:// example.com:', false],                   // Chrome, FF: true
        ['scheme://example com:', false],                    // Chrome, FF: true
        ['scheme://:', false],                               // Chrome, FF: true
        ['scheme://?', false],                               // Chrome, FF: true
        ['scheme://#', false],                               // Chrome, FF: true
        ['scheme://username:password@:', false],             // Chrome, FF: true
        ['scheme://username:password@/', false],             // Chrome, FF: true
        ['scheme://username:password@?', false],             // Chrome, FF: true
        ['scheme://username:password@#', false],             // Chrome, FF: true
        ['scheme://host.name', true],
        ['scheme://123.456.789.10', true],
        ['scheme://[1234:0000:0000:5678:9abc:0000:0000:def]', true],
        ['scheme://[1234:0000:0000:5678:9abc:0000:0000:def]:7678', true],
        ['scheme://[1234:0:0:5678:9abc:0:0:def]', true],
        ['scheme://[1234::5678:9abc::def]', true],
        ['scheme://~`!@$%^&*-_=+|\\;\'",.()[]{}<>', true],

        // Validating `port`
        ['scheme://example.com/no-port', true],
        ['scheme://example.com:7678', true],
        ['scheme://example.com:76T8', false],                // Chrome, FF: true
        ['scheme://example.com:port', false],                // Chrome, FF: true

        // Validating `path`
        ['scheme://example.com/', true],
        ['scheme://example.com/path', true],
        ['scheme://example.com/path/~`!@$%^&*-_=+|\\;:\'",./()[]{}<>', true],

        // Validating `query`
        ['scheme://example.com?query', true],
        ['scheme://example.com/?query', true],
        ['scheme://example.com/path?query', true],
        ['scheme://example.com/path?~`!@$%^&*-_=+|\\;:\'",.?/()[]{}<>', true],

        // Validating `fragment`
        ['scheme://example.com#fragment', true],
        ['scheme://example.com/#fragment', true],
        ['scheme://example.com/path#fragment', true],
        ['scheme://example.com/path/#fragment', true],
        ['scheme://example.com/path?query#fragment', true],
        ['scheme://example.com/path?query#~`!@#$%^&*-_=+|\\;:\'",.?/()[]{}<>', true],

        // Validating miscellaneous
        ['scheme://☺.✪.⌘.➡/䨹', true],
        ['scheme://مثال.إختبار', true],
        ['scheme://例子.测试', true],
        ['scheme://उदाहरण.परीक्षा', true],

        // Legacy tests
        ['http://server:123/path', true],
        ['https://server:123/path', true],
        ['file:///home/user', true],
        ['mailto:user@example.com?subject=Foo', true],
        ['r2-d2.c3-p0://localhost/foo', true],
        ['abc:/foo', true],
        ['http://example.com/path;path', true],
        ['http://example.com/[]$\'()*,~)', true],
        ['http:', false],                                            // FF: true
        ['a@B.c', false],
        ['a_B.c', false],
        ['0scheme://example.com', false],
        ['http://example.com:9999/``', true]
      ];

      they('should validate url: $prop', urls, (item) => {
        const url = item[0];
        const valid = item[1];

        /* global URL_REGEXP: false */
        expect(URL_REGEXP.test(url)).toBe(valid);
      });
    });
  });


  describe('radio', () => {

    they('should update the model on $prop event', ['click', 'change'], (event) => {
      const inputElm = helper.compileInput(
          '<input type="radio" ng-model="color" value="white" />' +
          '<input type="radio" ng-model="color" value="red" />' +
          '<input type="radio" ng-model="color" value="blue" />');

      $rootScope.$apply('color = \'white\'');
      expect(inputElm[0].checked).toBe(true);
      expect(inputElm[1].checked).toBe(false);
      expect(inputElm[2].checked).toBe(false);

      $rootScope.$apply('color = \'red\'');
      expect(inputElm[0].checked).toBe(false);
      expect(inputElm[1].checked).toBe(true);
      expect(inputElm[2].checked).toBe(false);

      if (event === 'change') inputElm[2].checked = true;
      browserTrigger(inputElm[2], event);
      expect($rootScope.color).toBe('blue');
    });

    it('should treat the value as a string when evaluating checked-ness', () => {
      const inputElm = helper.compileInput(
          '<input type="radio" ng-model="model" value="0" />');

      $rootScope.$apply('model = \'0\'');
      expect(inputElm[0].checked).toBe(true);

      $rootScope.$apply('model = 0');
      expect(inputElm[0].checked).toBe(false);
    });


    it('should allow {{expr}} as value', () => {
      $rootScope.some = 11;
      const inputElm = helper.compileInput(
          '<input type="radio" ng-model="value" value="{{some}}" />' +
          '<input type="radio" ng-model="value" value="{{other}}" />');

      $rootScope.$apply(() => {
        $rootScope.value = 'blue';
        $rootScope.some = 'blue';
        $rootScope.other = 'red';
      });

      expect(inputElm[0].checked).toBe(true);
      expect(inputElm[1].checked).toBe(false);

      browserTrigger(inputElm[1], 'click');
      expect($rootScope.value).toBe('red');

      $rootScope.$apply('other = \'non-red\'');

      expect(inputElm[0].checked).toBe(false);
      expect(inputElm[1].checked).toBe(false);
    });


    it('should allow the use of ngTrim', () => {
      $rootScope.some = 11;
      const inputElm = helper.compileInput(
          '<input type="radio" ng-model="value" value="opt1" />' +
          '<input type="radio" ng-model="value" value="  opt2  " />' +
          '<input type="radio" ng-model="value" ng-trim="false" value="  opt3  " />' +
          '<input type="radio" ng-model="value" ng-trim="false" value="{{some}}" />' +
          '<input type="radio" ng-model="value" ng-trim="false" value="  {{some}}  " />');

      $rootScope.$apply(() => {
        $rootScope.value = 'blue';
        $rootScope.some = 'blue';
      });

      expect(inputElm[0].checked).toBe(false);
      expect(inputElm[1].checked).toBe(false);
      expect(inputElm[2].checked).toBe(false);
      expect(inputElm[3].checked).toBe(true);
      expect(inputElm[4].checked).toBe(false);

      browserTrigger(inputElm[1], 'click');
      expect($rootScope.value).toBe('opt2');
      browserTrigger(inputElm[2], 'click');
      expect($rootScope.value).toBe('  opt3  ');
      browserTrigger(inputElm[3], 'click');
      expect($rootScope.value).toBe('blue');
      browserTrigger(inputElm[4], 'click');
      expect($rootScope.value).toBe('  blue  ');

      $rootScope.$apply('value = \'  opt2  \'');
      expect(inputElm[1].checked).toBe(false);
      $rootScope.$apply('value = \'opt2\'');
      expect(inputElm[1].checked).toBe(true);
      $rootScope.$apply('value = \'  opt3  \'');
      expect(inputElm[2].checked).toBe(true);
      $rootScope.$apply('value = \'opt3\'');
      expect(inputElm[2].checked).toBe(false);

      $rootScope.$apply('value = \'blue\'');
      expect(inputElm[3].checked).toBe(true);
      expect(inputElm[4].checked).toBe(false);
      $rootScope.$apply('value = \'  blue  \'');
      expect(inputElm[3].checked).toBe(false);
      expect(inputElm[4].checked).toBe(true);
    });
  });


  describe('checkbox', () => {

    it('should ignore checkbox without ngModel directive', () => {
      const inputElm = helper.compileInput('<input type="checkbox" name="whatever" required />');

      helper.changeInputValueTo('');
      expect(inputElm.hasClass('ng-valid')).toBe(false);
      expect(inputElm.hasClass('ng-invalid')).toBe(false);
      expect(inputElm.hasClass('ng-pristine')).toBe(false);
      expect(inputElm.hasClass('ng-dirty')).toBe(false);
    });


    they('should update the model on $prop event', ['click', 'change'], (event) => {
      const inputElm = helper.compileInput('<input type="checkbox" ng-model="checkbox" />');

      expect(inputElm[0].checked).toBe(false);

      $rootScope.$apply('checkbox = true');
      expect(inputElm[0].checked).toBe(true);

      $rootScope.$apply('checkbox = false');
      expect(inputElm[0].checked).toBe(false);

      if (event === 'change') inputElm[0].checked = true;
      browserTrigger(inputElm[0], event);
      expect($rootScope.checkbox).toBe(true);
    });


    it('should format booleans', () => {
      const inputElm = helper.compileInput('<input type="checkbox" ng-model="name" />');

      $rootScope.$apply('name = false');
      expect(inputElm[0].checked).toBe(false);

      $rootScope.$apply('name = true');
      expect(inputElm[0].checked).toBe(true);
    });


    it('should support type="checkbox" with non-standard capitalization', () => {
      const inputElm = helper.compileInput('<input type="checkBox" ng-model="checkbox" />');

      browserTrigger(inputElm, 'click');
      expect($rootScope.checkbox).toBe(true);

      browserTrigger(inputElm, 'click');
      expect($rootScope.checkbox).toBe(false);
    });


    it('should allow custom enumeration', () => {
      const inputElm = helper.compileInput('<input type="checkbox" ng-model="name" ng-true-value="\'y\'" ' +
          'ng-false-value="\'n\'">');

      $rootScope.$apply('name = \'y\'');
      expect(inputElm[0].checked).toBe(true);

      $rootScope.$apply('name = \'n\'');
      expect(inputElm[0].checked).toBe(false);

      $rootScope.$apply('name = \'something else\'');
      expect(inputElm[0].checked).toBe(false);

      browserTrigger(inputElm, 'click');
      expect($rootScope.name).toEqual('y');

      browserTrigger(inputElm, 'click');
      expect($rootScope.name).toEqual('n');
    });


    it('should throw if ngTrueValue is present and not a constant expression', () => {
      expect(() => {
        const inputElm = helper.compileInput('<input type="checkbox" ng-model="value" ng-true-value="yes" />');
      }).toThrowMinErr('ngModel', 'constexpr', 'Expected constant expression for `ngTrueValue`, but saw `yes`.');
    });


    it('should throw if ngFalseValue is present and not a constant expression', () => {
      expect(() => {
        const inputElm = helper.compileInput('<input type="checkbox" ng-model="value" ng-false-value="no" />');
      }).toThrowMinErr('ngModel', 'constexpr', 'Expected constant expression for `ngFalseValue`, but saw `no`.');
    });


    it('should not throw if ngTrueValue or ngFalseValue are not present', () => {
      expect(() => {
        const inputElm = helper.compileInput('<input type="checkbox" ng-model="value" />');
      }).not.toThrow();
    });


    it('should be required if false', () => {
      const inputElm = helper.compileInput('<input type="checkbox" ng-model="value" required />');

      browserTrigger(inputElm, 'click');
      expect(inputElm[0].checked).toBe(true);
      expect(inputElm).toBeValid();

      browserTrigger(inputElm, 'click');
      expect(inputElm[0].checked).toBe(false);
      expect(inputElm).toBeInvalid();
    });


    it('should pass validation for "required" when trueValue is a string', () => {
      const inputElm = helper.compileInput('<input type="checkbox" required name="cb"' +
        'ng-model="value" ng-true-value="\'yes\'" />');

      expect(inputElm).toBeInvalid();
      expect($rootScope.form.cb.$error.required).toBe(true);

      browserTrigger(inputElm, 'click');
      expect(inputElm[0].checked).toBe(true);
      expect(inputElm).toBeValid();
      expect($rootScope.form.cb.$error.required).toBeUndefined();
    });
  });


  describe('textarea', () => {

    it('should process textarea', () => {
      const inputElm = helper.compileInput('<textarea ng-model="name"></textarea>');

      $rootScope.$apply('name = \'Adam\'');
      expect(inputElm.val()).toEqual('Adam');

      helper.changeInputValueTo('Shyam');
      expect($rootScope.name).toEqual('Shyam');

      helper.changeInputValueTo('Kai');
      expect($rootScope.name).toEqual('Kai');
    });


    it('should ignore textarea without ngModel directive', () => {
      const inputElm = helper.compileInput('<textarea name="whatever" required></textarea>');

      helper.changeInputValueTo('');
      expect(inputElm.hasClass('ng-valid')).toBe(false);
      expect(inputElm.hasClass('ng-invalid')).toBe(false);
      expect(inputElm.hasClass('ng-pristine')).toBe(false);
      expect(inputElm.hasClass('ng-dirty')).toBe(false);
    });
  });


  describe('ngValue', () => {

    it('should update the dom "value" property and attribute', () => {
      const inputElm = helper.compileInput('<input type="submit" ng-value="value">');

      $rootScope.$apply('value = \'something\'');

      expect(inputElm[0].value).toBe('something');
      expect(inputElm[0].getAttribute('value')).toBe('something');
    });

    it('should clear the "dom" value property and attribute when the value is undefined', () => {
      const inputElm = helper.compileInput('<input type="text" ng-value="value">');

      $rootScope.$apply('value = "something"');

      expect(inputElm[0].value).toBe('something');
      expect(inputElm[0].getAttribute('value')).toBe('something');

      $rootScope.$apply(() => {
        delete $rootScope.value;
      });

      expect(inputElm[0].value).toBe('');
      // Support: IE 9-11, Edge
      // In IE it is not possible to remove the `value` attribute from an input element.
      if (!msie && !isEdge) {
        expect(inputElm[0].getAttribute('value')).toBeNull();
      } else {
        // Support: IE 9-11, Edge
        // This will fail if the Edge bug gets fixed
        expect(inputElm[0].getAttribute('value')).toBe('something');
      }
    });

    they('should update the $prop "value" property and attribute after the bound expression changes', {
      input: '<input type="text" ng-value="value">',
      textarea: '<textarea ng-value="value"></textarea>'
    }, (tmpl) => {
      const element = helper.compileInput(tmpl);

      helper.changeInputValueTo('newValue');
      expect(element[0].value).toBe('newValue');
      expect(element[0].getAttribute('value')).toBeNull();

      $rootScope.$apply(() => {
        $rootScope.value = 'anotherValue';
      });
      expect(element[0].value).toBe('anotherValue');
      expect(element[0].getAttribute('value')).toBe('anotherValue');
    });

    it('should evaluate and set constant expressions', () => {
      const inputElm = helper.compileInput('<input type="radio" ng-model="selected" ng-value="true">' +
                   '<input type="radio" ng-model="selected" ng-value="false">' +
                   '<input type="radio" ng-model="selected" ng-value="1">');

      browserTrigger(inputElm[0], 'click');
      expect($rootScope.selected).toBe(true);

      browserTrigger(inputElm[1], 'click');
      expect($rootScope.selected).toBe(false);

      browserTrigger(inputElm[2], 'click');
      expect($rootScope.selected).toBe(1);
    });


    it('should use strict comparison between model and value', () => {
      $rootScope.selected = false;
      const inputElm = helper.compileInput('<input type="radio" ng-model="selected" ng-value="false">' +
                   '<input type="radio" ng-model="selected" ng-value="\'\'">' +
                   '<input type="radio" ng-model="selected" ng-value="0">');

      expect(inputElm[0].checked).toBe(true);
      expect(inputElm[1].checked).toBe(false);
      expect(inputElm[2].checked).toBe(false);
    });


    it('should watch the expression', () => {
      const inputElm = helper.compileInput('<input type="radio" ng-model="selected" ng-value="value">');

      $rootScope.$apply(() => {
        $rootScope.selected = $rootScope.value = {some: 'object'};
      });
      expect(inputElm[0].checked).toBe(true);

      $rootScope.$apply(() => {
        $rootScope.value = {some: 'other'};
      });
      expect(inputElm[0].checked).toBe(false);

      browserTrigger(inputElm, 'click');
      expect($rootScope.selected).toBe($rootScope.value);
    });


    it('should work inside ngRepeat', () => {
      helper.compileInput(
        '<input type="radio" ng-repeat="i in items" ng-model="$parent.selected" ng-value="i.id">');

      $rootScope.$apply(() => {
        $rootScope.items = [{id: 1}, {id: 2}];
        $rootScope.selected = 1;
      });

      const inputElms = helper.formElm.find('input');
      expect(inputElms[0].checked).toBe(true);
      expect(inputElms[1].checked).toBe(false);

      browserTrigger(inputElms.eq(1), 'click');
      expect($rootScope.selected).toBe(2);
    });


    it('should work inside ngRepeat with primitive values', () => {
      helper.compileInput(
        '<div ng-repeat="i in items">' +
          '<input type="radio" name="sel_{{i.id}}" ng-model="i.selected" ng-value="true">' +
          '<input type="radio" name="sel_{{i.id}}" ng-model="i.selected" ng-value="false">' +
        '</div>');

      $rootScope.$apply(() => {
        $rootScope.items = [{id: 1, selected: true}, {id: 2, selected: false}];
      });

      const inputElms = helper.formElm.find('input');
      expect(inputElms[0].checked).toBe(true);
      expect(inputElms[1].checked).toBe(false);
      expect(inputElms[2].checked).toBe(false);
      expect(inputElms[3].checked).toBe(true);

      browserTrigger(inputElms.eq(1), 'click');
      expect($rootScope.items[0].selected).toBe(false);
    });


    it('should work inside ngRepeat without name attribute', () => {
      helper.compileInput(
        '<div ng-repeat="i in items">' +
          '<input type="radio" ng-model="i.selected" ng-value="true">' +
          '<input type="radio" ng-model="i.selected" ng-value="false">' +
        '</div>');

      $rootScope.$apply(() => {
        $rootScope.items = [{id: 1, selected: true}, {id: 2, selected: false}];
      });

      const inputElms = helper.formElm.find('input');
      expect(inputElms[0].checked).toBe(true);
      expect(inputElms[1].checked).toBe(false);
      expect(inputElms[2].checked).toBe(false);
      expect(inputElms[3].checked).toBe(true);

      browserTrigger(inputElms.eq(1), 'click');
      expect($rootScope.items[0].selected).toBe(false);
    });
  });


  describe('password', () => {
    // Under no circumstances should input[type=password] trim inputs
    it('should not trim if ngTrim is unspecified', () => {
      const inputElm = helper.compileInput('<input type="password" ng-model="password">');
      helper.changeInputValueTo(' - - untrimmed - - ');
      expect($rootScope.password.length).toBe(' - - untrimmed - - '.length);
    });


    it('should not trim if ngTrim !== false', () => {
      const inputElm = helper.compileInput('<input type="password" ng-model="password" ng-trim="true">');
      helper.changeInputValueTo(' - - untrimmed - - ');
      expect($rootScope.password.length).toBe(' - - untrimmed - - '.length);
      dealoc(inputElm);
    });


    it('should not trim if ngTrim === false', () => {
      const inputElm = helper.compileInput('<input type="password" ng-model="password" ng-trim="false">');
      helper.changeInputValueTo(' - - untrimmed - - ');
      expect($rootScope.password.length).toBe(' - - untrimmed - - '.length);
      dealoc(inputElm);
    });
  });
});
