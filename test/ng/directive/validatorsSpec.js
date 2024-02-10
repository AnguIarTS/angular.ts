

/* globals generateInputCompilerHelper: false */

describe('validators', () => {

  const helper = {}; let $rootScope;

  generateInputCompilerHelper(helper);

  beforeEach(inject((_$rootScope_) => {
    $rootScope = _$rootScope_;
  }));


  describe('pattern', () => {

    it('should validate in-lined pattern', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="/^\\d\\d\\d-\\d\\d-\\d\\d\\d\\d$/" />');

      helper.changeInputValueTo('x000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('000-00-0000');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('123-45-6789');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('x');
      expect(inputElm).toBeInvalid();
    });


    it('should listen on ng-pattern when pattern is observed', () => {
      let value; const patternVal = /^\w+$/;
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="pat" attr-capture />');
      helper.attrs.$observe('pattern', (v) => {
        value = helper.attrs.pattern;
      });

      $rootScope.$apply(() => {
        $rootScope.pat = patternVal;
      });

      expect(value).toBe(patternVal);
    });


    it('should validate in-lined pattern with modifiers', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="/^abc?$/i" />');

      helper.changeInputValueTo('aB');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('xx');
      expect(inputElm).toBeInvalid();
    });


    it('should validate pattern from scope', () => {
      $rootScope.regexp = /^\d\d\d-\d\d-\d\d\d\d$/;
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="regexp" />');

      helper.changeInputValueTo('x000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('000-00-0000');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('000-00-0000x');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('123-45-6789');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('x');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(() => {
        $rootScope.regexp = /abc?/;
      });

      helper.changeInputValueTo('ab');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('xx');
      expect(inputElm).toBeInvalid();
    });


    it('should perform validations when the ngPattern scope value changes', () => {
      $rootScope.regexp = /^[a-z]+$/;
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-pattern="regexp" />');

      helper.changeInputValueTo('abcdef');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(() => {
        $rootScope.regexp = /^\d+$/;
      });

      expect(inputElm).toBeValid();

      helper.changeInputValueTo('abcdef');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply(() => {
        $rootScope.regexp = '';
      });

      expect(inputElm).toBeValid();
    });


    it('should register "pattern" with the model validations when the pattern attribute is used', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" pattern="^\\d+$" />');

      helper.changeInputValueTo('abcd');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.pattern).toBe(true);

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.pattern).not.toBe(true);
    });


    it('should not throw an error when scope pattern can\'t be found', () => {
      expect(() => {
        const inputElm = helper.compileInput('<input type="text" ng-model="foo" ng-pattern="fooRegexp" />');
        $rootScope.$apply('foo = \'bar\'');
      }).not.toThrow();
    });


    it('should throw an error when the scope pattern is not a regular expression', () => {
      expect(() => {
        const inputElm = helper.compileInput('<input type="text" ng-model="foo" ng-pattern="fooRegexp" />');
        $rootScope.$apply(() => {
          $rootScope.fooRegexp = {};
          $rootScope.foo = 'bar';
        });
      }).toThrowMinErr('ngPattern', 'noregexp', 'Expected fooRegexp to be a RegExp but was');
    });


    it('should be invalid if entire string does not match pattern', () => {
      const inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    it('should be cope with patterns that start with ^', () => {
      const inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="^\\d{4}">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    it('should be cope with patterns that end with $', () => {
      const inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}$">');
      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('123');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();

      helper.changeInputValueTo('12345');
      expect($rootScope.form.test.$error.pattern).toBe(true);
      expect(inputElm).not.toBeValid();
    });


    it('should validate the viewValue and not the modelValue', () => {
      const inputElm = helper.compileInput('<input type="text" name="test" ng-model="value" pattern="\\d{4}">');
      const ctrl = inputElm.controller('ngModel');

      ctrl.$parsers.push((value) => `${value * 10  }`);

      helper.changeInputValueTo('1234');
      expect($rootScope.form.test.$error.pattern).not.toBe(true);
      expect($rootScope.form.test.$modelValue).toBe('12340');
      expect(inputElm).toBeValid();
    });


    it('should validate on non-input elements', inject(($compile) => {
      $rootScope.pattern = '\\d{4}';
      const elm = $compile('<span ng-model="value" pattern="\\d{4}"></span>')($rootScope);
      const elmNg = $compile('<span ng-model="value" ng-pattern="pattern"></span>')($rootScope);
      const ctrl = elm.controller('ngModel');
      const ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.pattern).not.toBe(true);
      expect(ctrlNg.$error.pattern).not.toBe(true);

      ctrl.$setViewValue('12');
      ctrlNg.$setViewValue('12');

      expect(ctrl.$error.pattern).toBe(true);
      expect(ctrlNg.$error.pattern).toBe(true);
    }));

    it('should only validate once after compilation when inside ngRepeat', () => {

      $rootScope.pattern = /\d{4}/;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" pattern="\\d{4}" validation-spy="pattern" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.pattern).toBe(1);

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-pattern="pattern" validation-spy="pattern" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.pattern).toBe(1);
    });
  });


  describe('minlength', () => {

    it('should invalidate values that are shorter than the given minlength', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-minlength="3" />');

      helper.changeInputValueTo('aa');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('aaa');
      expect(inputElm).toBeValid();
    });


    it('should listen on ng-minlength when minlength is observed', () => {
      let value = 0;
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-minlength="min" attr-capture />');
      helper.attrs.$observe('minlength', (v) => {
        value = toInt(helper.attrs.minlength);
      });

      $rootScope.$apply('min = 5');

      expect(value).toBe(5);
    });


    it('should observe the standard minlength attribute and register it as a validator on the model', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="{{ min }}" />');
      $rootScope.$apply('min = 10');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.minlength).toBe(true);

      $rootScope.$apply('min = 5');

      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.minlength).not.toBe(true);
    });


    it('should validate when the model is initialized as a number', () => {
      $rootScope.value = 12345;
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');
      expect($rootScope.value).toBe(12345);
      expect($rootScope.form.input.$error.minlength).toBeUndefined();
    });

    it('should validate emptiness against the viewValue', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');

      const ctrl = inputElm.controller('ngModel');
      spyOn(ctrl, '$isEmpty').and.callThrough();

      ctrl.$parsers.push((value) => `${value  }678`);

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    it('should validate on non-input elements', inject(($compile) => {
      $rootScope.min = 3;
      const elm = $compile('<span ng-model="value" minlength="{{min}}"></span>')($rootScope);
      const elmNg = $compile('<span ng-model="value" ng-minlength="min"></span>')($rootScope);
      const ctrl = elm.controller('ngModel');
      const ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.minlength).not.toBe(true);
      expect(ctrlNg.$error.minlength).not.toBe(true);

      ctrl.$setViewValue('12');
      ctrlNg.$setViewValue('12');

      expect(ctrl.$error.minlength).toBe(true);
      expect(ctrlNg.$error.minlength).toBe(true);
    }));


    it('should only validate once after compilation when inside ngRepeat', () => {
      $rootScope.minlength = 5;

      let element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" minlength="{{minlength}}" validation-spy="minlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.minlength).toBe(1);

      element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-minlength="minlength" validation-spy="minlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.minlength).toBe(1);
    });
  });

  describe('maxlength', () => {

    it('should invalidate values that are longer than the given maxlength', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="5" />');

      helper.changeInputValueTo('aaaaaaaa');
      expect(inputElm).toBeInvalid();

      helper.changeInputValueTo('aaa');
      expect(inputElm).toBeValid();
    });


    it('should only accept empty values when maxlength is 0', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="0" />');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('a');
      expect(inputElm).toBeInvalid();
    });


    it('should accept values of any length when maxlength is negative', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="-1" />');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('aaaaaaaaaa');
      expect(inputElm).toBeValid();
    });


    it('should accept values of any length when maxlength is non-numeric', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="maxlength" />');
      helper.changeInputValueTo('aaaaaaaaaa');

      $rootScope.$apply('maxlength = "5"');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('maxlength = "abc"');
      expect(inputElm).toBeValid();

      $rootScope.$apply('maxlength = ""');
      expect(inputElm).toBeValid();

      $rootScope.$apply('maxlength = null');
      expect(inputElm).toBeValid();

      $rootScope.someObj = {};
      $rootScope.$apply('maxlength = someObj');
      expect(inputElm).toBeValid();
    });


    it('should listen on ng-maxlength when maxlength is observed', () => {
      let value = 0;
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-maxlength="max" attr-capture />');
      helper.attrs.$observe('maxlength', (v) => {
        value = toInt(helper.attrs.maxlength);
      });

      $rootScope.$apply('max = 10');

      expect(value).toBe(10);
    });


    it('should observe the standard maxlength attribute and register it as a validator on the model', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');
      $rootScope.$apply('max = 1');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);

      $rootScope.$apply('max = 6');

      expect(inputElm).toBeValid();
      expect($rootScope.form.input.$error.maxlength).not.toBe(true);
    });


    it('should assign the correct model after an observed validator became valid', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');

      $rootScope.$apply('max = 1');
      helper.changeInputValueTo('12345');
      expect($rootScope.value).toBeUndefined();

      $rootScope.$apply('max = 6');
      expect($rootScope.value).toBe('12345');
    });


    it('should assign the correct model after an observed validator became invalid', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');

      $rootScope.$apply('max = 6');
      helper.changeInputValueTo('12345');
      expect($rootScope.value).toBe('12345');

      $rootScope.$apply('max = 1');
      expect($rootScope.value).toBeUndefined();
    });


    it('should leave the value as invalid if observed maxlength changed, but is still invalid', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="{{ max }}" />');
      $rootScope.$apply('max = 1');

      helper.changeInputValueTo('12345');
      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);
      expect($rootScope.value).toBeUndefined();

      $rootScope.$apply('max = 3');

      expect(inputElm).toBeInvalid();
      expect($rootScope.form.input.$error.maxlength).toBe(true);
      expect($rootScope.value).toBeUndefined();
    });


    it('should not notify if observed maxlength changed, but is still invalid', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" ng-change="ngChangeSpy()" ' +
                   'maxlength="{{ max }}" />');

      $rootScope.$apply('max = 1');
      helper.changeInputValueTo('12345');

      $rootScope.ngChangeSpy = jasmine.createSpy();
      $rootScope.$apply('max = 3');

      expect($rootScope.ngChangeSpy).not.toHaveBeenCalled();
    });


    it('should leave the model untouched when validating before model initialization', () => {
      $rootScope.value = '12345';
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" minlength="3" />');
      expect($rootScope.value).toBe('12345');
    });


    it('should validate when the model is initialized as a number', () => {
      $rootScope.value = 12345;
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="10" />');
      expect($rootScope.value).toBe(12345);
      expect($rootScope.form.input.$error.maxlength).toBeUndefined();
    });

    it('should validate emptiness against the viewValue', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" maxlength="10" />');

      const ctrl = inputElm.controller('ngModel');
      spyOn(ctrl, '$isEmpty').and.callThrough();

      ctrl.$parsers.push((value) => `${value  }678`);

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    it('should validate on non-input elements', inject(($compile) => {
      $rootScope.max = 3;
      const elm = $compile('<span ng-model="value" maxlength="{{max}}"></span>')($rootScope);
      const elmNg = $compile('<span ng-model="value" ng-maxlength="max"></span>')($rootScope);
      const ctrl = elm.controller('ngModel');
      const ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.maxlength).not.toBe(true);
      expect(ctrlNg.$error.maxlength).not.toBe(true);

      ctrl.$setViewValue('1234');
      ctrlNg.$setViewValue('1234');

      expect(ctrl.$error.maxlength).toBe(true);
      expect(ctrlNg.$error.maxlength).toBe(true);
    }));


    it('should only validate once after compilation when inside ngRepeat', () => {
      $rootScope.maxlength = 5;

      let element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" maxlength="{{maxlength}}" validation-spy="maxlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.maxlength).toBe(1);

      element = helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-maxlength="maxlength" validation-spy="maxlength" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.maxlength).toBe(1);
    });
  });


  describe('required', () => {

    it('should allow bindings via ngRequired', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" ng-required="required" />');

      $rootScope.$apply('required = false');

      helper.changeInputValueTo('');
      expect(inputElm).toBeValid();


      $rootScope.$apply('required = true');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('value = \'some\'');
      expect(inputElm).toBeValid();

      helper.changeInputValueTo('');
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('required = false');
      expect(inputElm).toBeValid();
    });


    it('should invalid initial value with bound required', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" required="{{required}}" />');

      $rootScope.$apply('required = true');

      expect(inputElm).toBeInvalid();
    });


    it('should be $invalid but $pristine if not touched', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="name" name="alias" required />');

      $rootScope.$apply('name = null');

      expect(inputElm).toBeInvalid();
      expect(inputElm).toBePristine();

      helper.changeInputValueTo('');
      expect(inputElm).toBeInvalid();
      expect(inputElm).toBeDirty();
    });


    it('should allow empty string if not required', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="foo" />');
      helper.changeInputValueTo('a');
      helper.changeInputValueTo('');
      expect($rootScope.foo).toBe('');
    });


    it('should set $invalid when model undefined', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="notDefined" required />');
      expect(inputElm).toBeInvalid();
    });


    it('should consider bad input as an error before any other errors are considered', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="value" required />', { badInput: true });
      const ctrl = inputElm.controller('ngModel');
      ctrl.$parsers.push(() => undefined);

      helper.changeInputValueTo('abc123');

      expect(ctrl.$error.parse).toBe(true);
      expect(inputElm).toHaveClass('ng-invalid-parse');
      expect(inputElm).toBeInvalid(); // invalid because of the number validator
    });


    it('should allow `false` as a valid value when the input type is not "checkbox"', () => {
      const inputElm = helper.compileInput('<input type="radio" ng-value="true" ng-model="answer" required />' +
        '<input type="radio" ng-value="false" ng-model="answer" required />');

      $rootScope.$apply();
      expect(inputElm).toBeInvalid();

      $rootScope.$apply('answer = true');
      expect(inputElm).toBeValid();

      $rootScope.$apply('answer = false');
      expect(inputElm).toBeValid();
    });


    it('should validate emptiness against the viewValue', () => {
      const inputElm = helper.compileInput('<input type="text" name="input" ng-model="value" required />');

      const ctrl = inputElm.controller('ngModel');
      spyOn(ctrl, '$isEmpty').and.callThrough();

      ctrl.$parsers.push((value) => `${value  }678`);

      helper.changeInputValueTo('12345');
      expect(ctrl.$isEmpty).toHaveBeenCalledWith('12345');
    });


    it('should validate on non-input elements', inject(($compile) => {
      $rootScope.value = '12';
      const elm = $compile('<span ng-model="value" required></span>')($rootScope);
      const elmNg = $compile('<span ng-model="value" ng-required="true"></span>')($rootScope);
      const ctrl = elm.controller('ngModel');
      const ctrlNg = elmNg.controller('ngModel');

      expect(ctrl.$error.required).not.toBe(true);
      expect(ctrlNg.$error.required).not.toBe(true);

      ctrl.$setViewValue('');
      ctrlNg.$setViewValue('');

      expect(ctrl.$error.required).toBe(true);
      expect(ctrlNg.$error.required).toBe(true);
    }));


    it('should override "required" when ng-required="false" is set', () => {
      const inputElm = helper.compileInput('<input type="text" ng-model="notDefined" required ng-required="false" />');

      expect(inputElm).toBeValid();
    });


    it('should validate only once after compilation when inside ngRepeat', () => {
      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" required validation-spy="required" />' +
         '</div>');

      $rootScope.$digest();

      expect(helper.validationCounter.required).toBe(1);
    });


    it('should validate only once after compilation when inside ngRepeat and ngRequired is true', () => {
      $rootScope.isRequired = true;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
         '</div>');

      expect(helper.validationCounter.required).toBe(1);
    });


    it('should validate only once after compilation when inside ngRepeat and ngRequired is false', () => {
      $rootScope.isRequired = false;

      helper.compileInput(
         '<div ng-repeat="input in [0]">' +
           '<input type="text" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
         '</div>');

      expect(helper.validationCounter.required).toBe(1);
    });


    it('should validate once when inside ngRepeat, and set the "required" error when ngRequired is false by default', () => {
      $rootScope.isRequired = false;
      $rootScope.refs = {};

      const elm = helper.compileInput(
        '<div ng-repeat="input in [0]">' +
          '<input type="text" ng-ref="refs.input" ng-ref-read="ngModel" ng-model="value" ng-required="isRequired" validation-spy="required" />' +
        '</div>');

      expect(helper.validationCounter.required).toBe(1);
      expect($rootScope.refs.input.$error.required).toBeUndefined();
    });


    it('should validate only once when inside ngIf with required on non-input elements', inject(($compile) => {
      $rootScope.value = '12';
      $rootScope.refs = {};
      helper.compileInput('<div ng-if="true"><span ng-model="value" ng-ref="refs.ctrl" ng-ref-read="ngModel" required validation-spy="required"></span></div>');
      $rootScope.$digest();

      expect(helper.validationCounter.required).toBe(1);
      expect($rootScope.refs.ctrl.$error.required).not.toBe(true);
    }));
  });
});
