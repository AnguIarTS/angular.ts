

beforeEach(function() {

  function cssMatcher(presentClasses, absentClasses) {
    return function() {
      return {
        compare: function(actual) {
          let element = angular.element(actual);
          let present = true;
          let absent = false;

          angular.forEach(presentClasses.split(' '), function(className) {
            present = present && element.hasClass(className);
          });

          angular.forEach(absentClasses.split(' '), function(className) {
            absent = absent || element.hasClass(className);
          });

          let message = function() {
            return 'Expected to have ' + presentClasses +
              (absentClasses ? (' and not have ' + absentClasses + '') : '') +
              ' but had ' + element[0].className + '.';
          };
          return {
            pass: present && !absent,
            message: message
          };
        }
      };
    };
  }

  function DOMTester(a, b) {
    if (a && b && a.nodeType > 0 && b.nodeType > 0) {
      return a === b;
    }
  }

  function isNgElementHidden(element) {
    // we need to check element.getAttribute for SVG nodes
    let hidden = true;
    forEach(angular.element(element), function(element) {
      if ((' '  + (element.getAttribute('class') || '') + ' ').indexOf(' ng-hide ') === -1) {
        hidden = false;
      }
    });
    return hidden;
  }

  function MinErrMatcher(isNot, namespace, code, content, wording) {
    let codeRegex = new RegExp('^' + escapeRegexp('[' + namespace + ':' + code + ']'));
    let contentRegex = angular.isUndefined(content) || jasmine.isA_('RegExp', content) ?
        content : new RegExp(escapeRegexp(content));

    this.test = test;

    function escapeRegexp(str) {
      // This function escapes all special regex characters.
      // We use it to create matching regex from arbitrary strings.
      // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    }

    function test(exception) {
      let exceptionMessage = (exception && exception.message) || exception || '';

      let codeMatches = codeRegex.test(exceptionMessage);
      let contentMatches = angular.isUndefined(contentRegex) || contentRegex.test(exceptionMessage);
      let matches = codeMatches && contentMatches;

      return {
        pass: isNot ? !matches : matches,
        message: message
      };

      function message() {
        return 'Expected ' + wording.inputType + (isNot ? ' not' : '') + ' to ' +
            wording.expectedAction + ' ' + namespace + 'MinErr(\'' + code + '\')' +
            (contentRegex ? ' matching ' + contentRegex.toString() : '') +
            (!exception ? '.' : ', but it ' + wording.actualAction + ': ' + exceptionMessage);
      }
    }
  }

  jasmine.addMatchers({
    toBeEmpty: cssMatcher('ng-empty', 'ng-not-empty'),
    toBeNotEmpty: cssMatcher('ng-not-empty', 'ng-empty'),
    toBeInvalid: cssMatcher('ng-invalid', 'ng-valid'),
    toBeValid: cssMatcher('ng-valid', 'ng-invalid'),
    toBeDirty: cssMatcher('ng-dirty', 'ng-pristine'),
    toBePristine: cssMatcher('ng-pristine', 'ng-dirty'),
    toBeUntouched: cssMatcher('ng-untouched', 'ng-touched'),
    toBeTouched: cssMatcher('ng-touched', 'ng-untouched'),

    toBeAPromise: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };
      function generateCompare(isNot) {
        return function(actual) {
          let message = valueFn(
            'Expected object ' + (isNot ? 'not ' : '') + 'to be a promise');
          return { pass: isPromiseLike(actual), message: message };
        };
      }
    },

    toBeShown: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };
      function generateCompare(isNot) {
        return function(actual) {
          let message = valueFn('Expected element ' + (isNot ? '' : 'not ') + 'to have \'ng-hide\' class');
          let pass = !isNgElementHidden(actual);
          if (isNot) {
            pass = !pass;
          }
          return { pass: pass, message: message };
        };
      }
    },

    toBeHidden: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };
      function generateCompare(isNot) {
        return function(actual) {
          let message = valueFn('Expected element ' + (isNot ? 'not ' : '') + 'to have \'ng-hide\' class');
          let pass = isNgElementHidden(actual);
          if (isNot) {
            pass = !pass;
          }
          return { pass: pass, message: message };
        };
      }
    },

    toEqual: function(util) {
      return {
        compare: function(actual, expected) {
          if (actual && actual.$$log) {
            actual = (typeof expected === 'string')
                ? actual.toString()
                : actual.toArray();
          }
          return {
            pass: util.equals(actual, expected, [DOMTester])
          };
        }
      };
    },

    toEqualOneOf: function(util) {
      return {
        compare: function(actual) {
          let expectedArgs = Array.prototype.slice.call(arguments, 1);
          return {
            pass: expectedArgs.some(function(expected) {
              return util.equals(actual, expected, [DOMTester]);
            })
          };
        }
      };
    },

    toEqualData: function() {
      return {
        compare: function(actual, expected) {
          return { pass: angular.equals(actual, expected) };
        }
      };
    },

    toHaveBeenCalledOnce: function() {
      return {
        compare: function(actual) {
          if (arguments.length > 1) {
            throw new Error('`toHaveBeenCalledOnce` does not take arguments, ' +
                            'use `toHaveBeenCalledOnceWith`');
          }

          if (!jasmine.isSpy(actual)) {
            throw new Error('Expected a spy, but got ' + jasmine.pp(actual) + '.');
          }

          let count = actual.calls.count();
          let pass = count === 1;

          let message = function() {
            let msg = 'Expected spy ' + actual.and.identity() + (pass ? ' not ' : ' ') +
                      'to have been called once, but ';

            switch (count) {
              case 0:
                msg += 'it was never called.';
                break;
              case 1:
                msg += 'it was called once.';
                break;
              default:
                msg += 'it was called ' + count + ' times.';
                break;
            }

            return msg;
          };

          return {
            pass: pass,
            message: message
          };
        }
      };
    },

    toHaveBeenCalledOnceWith: function(util, customEqualityTesters) {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };

      function generateCompare(isNot) {
        return function(actual) {
          if (!jasmine.isSpy(actual)) {
            throw new Error('Expected a spy, but got ' + jasmine.pp(actual) + '.');
          }

          let expectedArgs = Array.prototype.slice.call(arguments, 1);
          let actualCount = actual.calls.count();
          let actualArgs = actualCount && actual.calls.argsFor(0);

          let pass = (actualCount === 1) && util.equals(actualArgs, expectedArgs);
          if (isNot) pass = !pass;

          let message = function() {
            let msg = 'Expected spy ' + actual.and.identity() + (isNot ? ' not ' : ' ') +
                      'to have been called once with ' + jasmine.pp(expectedArgs) + ', but ';

            if (isNot) {
              msg += 'it was.';
            } else {
              switch (actualCount) {
                case 0:
                  msg += 'it was never called.';
                  break;
                case 1:
                  msg += 'it was called with ' + jasmine.pp(actualArgs) + '.';
                  break;
                default:
                  msg += 'it was called ' + actualCount + ' times.';
                  break;
              }
            }

            return msg;
          };

          return {
            pass: pass,
            message: message
          };
        };
      }
    },

    toBeOneOf: function() {
      return {
        compare: function(actual) {
          let expectedArgs = Array.prototype.slice.call(arguments, 1);
          return { pass: expectedArgs.indexOf(actual) !== -1 };
        }
      };
    },

    toHaveClass: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };
      function hasClass(element, selector) {
        if (!element.getAttribute) return false;
        return ((' ' + (element.getAttribute('class') || '') + ' ').replace(/[\n\t]/g, ' ').
            indexOf(' ' + selector + ' ') > -1);
      }
      function generateCompare(isNot) {
        return function(actual, clazz) {
          let message = function() {
            return 'Expected \'' + angular.mock.dump(actual) + '\'' + (isNot ? ' not ' : '') + ' to have class \'' + clazz + '\'.';
          };
          let classes = clazz.trim().split(/\s+/);
          for (let i = 0; i < classes.length; ++i) {
            if (!hasClass(actual[0], classes[i])) {
              return { pass: isNot };
            }
          }
          return { pass: !isNot };
        };
      }
    },

    toEqualMinErr: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };

      function generateCompare(isNot) {
        return function(actual, namespace, code, content) {

          let matcher = new MinErrMatcher(isNot, namespace, code, content, {
            inputType: 'error',
            expectedAction: 'equal',
            actualAction: 'was'
          });

          return matcher.test(actual);
        };
      }
    },

    toThrowMinErr: function() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true)
      };

      function generateCompare(isNot) {
        return function(actual, namespace, code, content) {
          let exception;

          if (!angular.isFunction(actual)) {
            throw new Error('Actual is not a function');
          }

          try {
            actual();
          } catch (e) {
            exception = e;
          }

          let matcher = new MinErrMatcher(isNot, namespace, code, content, {
            inputType: 'function',
            expectedAction: 'throw',
            actualAction: 'threw'
          });

          return matcher.test(exception);
        };
      }
    },

    toBeMarkedAsSelected: function() {
      // Selected is special because the element property and attribute reflect each other's state.

      // Support: IE 9 only
      // IE9 will wrongly report hasAttribute('selected') === true when the property is
      // undefined or null, and the dev tools show that no attribute is set

      return {
        compare: function(actual) {
          let errors = [];
          let optionVal = toJson(actual.value);

          if (actual.selected === null || typeof actual.selected === 'undefined' || actual.selected === false) {
            errors.push('Expected option with value ' + optionVal + ' to have property "selected" set to truthy');
          }

          
          let result = {
            pass: errors.length === 0,
            message: errors.join('\n')
          };

          return result;
        },
        negativeCompare: function(actual) {
          let errors = [];
          let optionVal = toJson(actual.value);

          if (actual.selected) {
            errors.push('Expected option with value ' + optionVal + ' property "selected" to be falsy');
          }

          let result = {
            pass: errors.length === 0,
            message: errors.join('\n')
          };

          return result;
        }
      };
    },
    toEqualSelect: function() {
      return {
        compare: function(actual, expected) {
          let actualValues = [],
              expectedValues = [].slice.call(arguments, 1);

          forEach(actual.find('option'), function(option) {
            actualValues.push(option.selected ? [option.value] : option.value);
          });

          let message = function() {
            return 'Expected ' + toJson(actualValues) + ' to equal ' + toJson(expectedValues) + '.';
          };

          return {
            pass: equals(expectedValues, actualValues),
            message: message
          };
        }
      };
    }
  });
});

/**
 * Create jasmine.Spy on given method, but ignore calls without arguments
 * This is helpful when need to spy only setter methods and ignore getters
 */
function spyOnlyCallsWithArgs(obj, method) {
  let originalFn = obj[method];
  let spy = spyOn(obj, method);
  obj[method] = function() {
    if (arguments.length) return spy.apply(this, arguments);
    return originalFn.apply(this);
  };
  return spy;
}

// Minimal implementation to mock what was removed from Jasmine 1.x
function createAsync(doneFn) {
  function Job() {
    this.next = [];
  }
  Job.prototype.done = function() {
    return this.runs(doneFn);
  };
  Job.prototype.runs = function(fn) {
    let newJob = new Job();
    this.next.push(function() {
      fn();
      newJob.start();
    });
    return newJob;
  };
  Job.prototype.waitsFor = function(fn, error, timeout) {
    let newJob = new Job();
    timeout = timeout || 5000;
    this.next.push(function() {
      let counter = 0,
        intervalId = window.setInterval(function() {
          if (fn()) {
            window.clearInterval(intervalId);
            newJob.start();
          }
          counter += 5;
          if (counter > timeout) {
            window.clearInterval(intervalId);
            throw new Error(error);
          }
        }, 5);
    });
    return newJob;
  };
  Job.prototype.waits = function(timeout) {
    return this.waitsFor(function() { return true; }, undefined, timeout);
  };
  Job.prototype.start = function() {
    let i;
    for (i = 0; i < this.next.length; i += 1) {
      this.next[i]();
    }
  };
  return new Job();
}

