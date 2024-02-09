

describe('$$animation', function() {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  let element;
  afterEach(function() {
    dealoc(element);
  });

  beforeEach(module(function($$animationProvider) {
    $$animationProvider.drivers.length = 0;
  }));

  it('should not run an animation if there are no drivers',
    inject(function($$animation, $animate, $rootScope) {

    element = jqLite('<div></div>');
    let done = false;
    $$animation(element, 'someEvent').then(function() {
      done = true;
    });
    $animate.flush();
    $rootScope.$digest();
    expect(done).toBe(true);
  }));

  it('should not run an animation if no drivers return an animation step function', function() {
    module(function($$animationProvider, $provide) {
      $$animationProvider.drivers.push('matiasDriver');
      $provide.value('matiasDriver', function() {
        return false;
      });
    });
    inject(function($$animation, $animate, $rootScope) {
      element = jqLite('<div></div>');
      let parent = jqLite('<div></div>');
      parent.append(element);

      let done = false;
      $$animation(element, 'someEvent').then(function() {
        done = true;
      });
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(true);
    });
  });

  describe('drivers', function() {
    it('should use the first driver that returns a step function', function() {
      let count = 0;
      let activeDriver;
      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('1');
        $$animationProvider.drivers.push('2');
        $$animationProvider.drivers.push('3');

        let runner;

        $provide.value('1', function() {
          count++;
        });

        $provide.value('2', function() {
          count++;
          return {
            start: function() {
              activeDriver = '2';
              return runner;
            }
          };
        });

        $provide.value('3', function() {
          count++;
        });

        return function($$AnimateRunner) {
          runner = new $$AnimateRunner();
        };
      });

      inject(function($$animation, $rootScope, $rootElement) {
        element = jqLite('<div></div>');
        $rootElement.append(element);

        $$animation(element, 'enter');
        $rootScope.$digest();

        expect(count).toBe(2);
        expect(activeDriver).toBe('2');
      });
    });

    describe('step function', function() {
      let capturedAnimation;
      beforeEach(module(function($$animationProvider, $provide) {
        element = jqLite('<div></div>');

        $$animationProvider.drivers.push('stepper');
        $provide.factory('stepper', function($$AnimateRunner) {
          return function() {
            capturedAnimation = arguments;
            return {
              start: function() {
                return new $$AnimateRunner();
              }
            };
          };
        });
      }));

      it('should obtain the element, event, the provided options and the domOperation',
        inject(function($$animation, $rootScope, $rootElement) {
        $rootElement.append(element);

        let options = {};
        options.foo = 'bar';
        options.domOperation = function() {
          domOperationCalled = true;
        };
        let domOperationCalled = false;
        $$animation(element, 'megaEvent', options);
        $rootScope.$digest();

        let details = capturedAnimation[0];
        expect(details.element).toBe(element);
        expect(details.event).toBe('megaEvent');
        expect(details.options.foo).toBe(options.foo);

        // the function is wrapped inside of $$animation, but it is still a function
        expect(domOperationCalled).toBe(false);
        details.options.domOperation();
        expect(domOperationCalled).toBe(true);
      }));

      it('should obtain the classes string which is a combination of className, addClass and removeClass',
        inject(function($$animation, $rootScope, $rootElement) {

        element.addClass('blue red');
        $rootElement.append(element);

        $$animation(element, 'enter', {
          addClass: 'green',
          removeClass: 'orange',
          tempClasses: 'pink'
        });

        $rootScope.$digest();

        let classes = capturedAnimation[0].classes;
        expect(classes).toBe('blue red green orange pink');
      }));
    });

    it('should traverse the drivers in reverse order', function() {
      let log = [];
      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('first');
        $$animationProvider.drivers.push('second');

        $provide.value('first', function() {
          log.push('first');
          return false;
        });

        $provide.value('second', function() {
          log.push('second');
          return false;
        });
      });

      inject(function($$animation, $rootScope, $rootElement) {
        element = jqLite('<div></div>');
        $rootElement.append(element);
        $$animation(element, 'enter');
        $rootScope.$digest();
        expect(log).toEqual(['second', 'first']);
      });
    });

    they('should $prop the animation call if the driver $proped the returned promise',
      ['resolve', 'reject'], function(event) {

      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('resolvingAnimation');
        $provide.factory('resolvingAnimation', function($$AnimateRunner) {
          return function() {
            return {
              start: function() {
                return new $$AnimateRunner();
              }
            };
          };
        });
      });

      inject(function($$animation, $rootScope, $animate) {
        let status;
        let element = jqLite('<div></div>');
        let parent = jqLite('<div></div>');
        parent.append(element);

        let runner = $$animation(element, 'enter');
        runner.then(function() {
            status = 'resolve';
          }, function() {
            status = 'reject';
          });

        // the animation is started
        $rootScope.$digest();

        if (event === 'resolve') {
          runner.end();
        } else {
          runner.cancel();
        }

        // the resolve/rejection digest
        $animate.flush();
        $rootScope.$digest();

        expect(status).toBe(event);
      });
    });

    they('should $prop the driver animation when runner.$prop() is called',
      ['cancel', 'end'], function(method) {

      let log = [];

      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers.push('actualDriver');
        $provide.factory('actualDriver', function($$AnimateRunner) {
          return function() {
            return {
              start: function() {
                log.push('start');
                return new $$AnimateRunner({
                  end: function() {
                    log.push('end');
                  },
                  cancel: function() {
                    log.push('cancel');
                  }
                });
              }
            };
          };
        });
      });

      inject(function($$animation, $rootScope, $rootElement) {
        element = jqLite('<div></div>');
        $rootElement.append(element);

        let runner = $$animation(element, 'enter');
        $rootScope.$digest();

        runner[method]();
        expect(log).toEqual(['start', method]);
      });
    });
  });

  describe('when', function() {
    let captureLog;
    let runnerLog;
    let capturedAnimation;

    beforeEach(module(function($$animationProvider, $provide) {
      captureLog = [];
      runnerLog = [];
      capturedAnimation = null;

      $$animationProvider.drivers.push('interceptorDriver');
      $provide.factory('interceptorDriver', function($$AnimateRunner) {
        return function(details) {
          captureLog.push(capturedAnimation = details); //only one param is passed into the driver
          return {
            start: function() {
              return new $$AnimateRunner({
                end: runnerEvent('end'),
                cancel: runnerEvent('cancel')
              });
            }
          };
        };
      });

      function runnerEvent(token) {
        return function() {
          runnerLog.push(token);
        };
      }
    }));

    describe('singular', function() {
      beforeEach(module(function($provide) {
        element = jqLite('<div></div>');
        return function($rootElement) {
          $rootElement.append(element);
        };
      }));

      it('should space out multiple ancestorial class-based animations with a RAF in between',
        inject(function($rootScope, $$animation, $$rAF) {

        let parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        let child = jqLite('<div></div>');
        element.append(child);

        $$animation(parent, 'addClass', { addClass: 'blue' });
        $$animation(element, 'addClass', { addClass: 'red' });
        $$animation(child, 'addClass', { addClass: 'green' });

        $rootScope.$digest();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();
        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('red');

        $$rAF.flush();
        expect(captureLog.length).toBe(3);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      it('should properly cancel out pending animations that are spaced with a RAF request before the digest completes',
        inject(function($rootScope, $$animation, $$rAF) {

        let parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        let child = jqLite('<div></div>');
        element.append(child);

        let r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        let r2 = $$animation(element, 'addClass', { addClass: 'red' });
        let r3 = $$animation(child, 'addClass', { addClass: 'green' });

        r2.end();

        $rootScope.$digest();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();

        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      it('should properly cancel out pending animations that are spaced with a RAF request after the digest completes',
        inject(function($rootScope, $$animation, $$rAF) {

        let parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        let child = jqLite('<div></div>');
        element.append(child);

        let r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        let r2 = $$animation(element, 'addClass', { addClass: 'red' });
        let r3 = $$animation(child, 'addClass', { addClass: 'green' });

        $rootScope.$digest();

        r2.end();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();
        expect(captureLog.length).toBe(1);

        $$rAF.flush();
        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      they('should return a runner that object that contains a $prop() function',
        ['end', 'cancel', 'then'], function(method) {
        inject(function($$animation) {
          let runner = $$animation(element, 'someEvent');
          expect(isFunction(runner[method])).toBe(true);
        });
      });

      they('should close the animation if runner.$prop() is called before the $postDigest phase kicks in',
        ['end', 'cancel'], function(method) {
        inject(function($$animation, $rootScope, $animate) {
          let status;
          let runner = $$animation(element, 'someEvent');
          runner.then(function() { status = 'end'; },
                      function() { status = 'cancel'; });

          runner[method]();
          $rootScope.$digest();
          expect(runnerLog).toEqual([]);

          $animate.flush();
          expect(status).toBe(method);
        });
      });

      they('should update the runner methods to the ones provided by the driver when the animation starts',
        ['end', 'cancel'], function(method) {

        let spy = jasmine.createSpy();
        module(function($$animationProvider, $provide) {
          $$animationProvider.drivers.push('animalDriver');
          $provide.factory('animalDriver', function($$AnimateRunner) {
            return function() {
              return {
                start: function() {
                  let data = {};
                  data[method] = spy;
                  return new $$AnimateRunner(data);
                }
              };
            };
          });
        });
        inject(function($$animation, $rootScope, $rootElement) {
          let r1 = $$animation(element, 'someEvent');
          r1[method]();
          expect(spy).not.toHaveBeenCalled();
          $rootScope.$digest(); // this clears the digest which cleans up the mess

          let r2 = $$animation(element, 'otherEvent');
          $rootScope.$digest();
          r2[method]();
          expect(spy).toHaveBeenCalled();
        });
      });

      it('should not start the animation if the element is removed from the DOM before the postDigest kicks in',
        inject(function($$animation) {

        let runner = $$animation(element, 'someEvent');

        expect(capturedAnimation).toBeFalsy();
        element.remove();
        expect(capturedAnimation).toBeFalsy();
      }));

      it('should immediately end the animation if the element is removed from the DOM during the animation',
        inject(function($$animation, $animate, $rootScope) {

        let runner = $$animation(element, 'someEvent');
        $rootScope.$digest();

        expect(capturedAnimation).toBeTruthy();
        expect(runnerLog).toEqual([]);
        element.remove();
        expect(runnerLog).toEqual(['end']);
      }));

      it('should not end the animation when the leave animation removes the element from the DOM',
        inject(function($$animation, $animate, $rootScope) {

        let runner = $$animation(element, 'leave', {}, function() {
          element.remove();
        });

        $rootScope.$digest();

        expect(runnerLog).toEqual([]);
        capturedAnimation.options.domOperation(); //this removes the element
        element.remove();
        expect(runnerLog).toEqual([]);
      }));

      it('should remove the $destroy event listener when the animation is closed',
        inject(function($$animation, $rootScope) {

        let addListen = spyOn(element, 'on').and.callThrough();
        let removeListen = spyOn(element, 'off').and.callThrough();
        let runner = $$animation(element, 'someEvent');

        let args = addListen.calls.mostRecent().args[0];
        expect(args).toBe('$destroy');

        runner.end();

        args = removeListen.calls.mostRecent().args[0];
        expect(args).toBe('$destroy');
      }));

      it('should always sort parent-element animations to run in order of parent-to-child DOM structure',
        inject(function($$animation, $rootScope, $animate) {

        let child = jqLite('<div></div>');
        let grandchild = jqLite('<div></div>');

        element.append(child);
        child.append(grandchild);

        $$animation(grandchild, 'enter');
        $$animation(child, 'enter');
        $$animation(element, 'enter');

        expect(captureLog.length).toBe(0);

        $rootScope.$digest();

        $animate.flush();

        expect(captureLog[0].element).toBe(element);
        expect(captureLog[1].element).toBe(child);
        expect(captureLog[2].element).toBe(grandchild);
      }));


      they('should only apply the ng-$prop-prepare class if there are a child animations',
        ['enter', 'leave', 'move'], function(animationType) {
        inject(function($$animation, $rootScope, $animate) {
          let expectedClassName = 'ng-' + animationType + '-prepare';

          $$animation(element, animationType);
          $rootScope.$digest();
          expect(element).not.toHaveClass(expectedClassName);

          let child = jqLite('<div></div>');
          element.append(child);

          $$animation(element, animationType);
          $$animation(child, animationType);
          $rootScope.$digest();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).toHaveClass(expectedClassName);
        });
      });


      they('should remove the preparation class before the $prop-animation starts',
        ['enter', 'leave', 'move'], function(animationType) {
        inject(function($$animation, $rootScope, $$rAF) {
          let expectedClassName = 'ng-' + animationType + '-prepare';

          let child = jqLite('<div></div>');
          element.append(child);

          $$animation(element, animationType);
          $$animation(child, animationType);
          $rootScope.$digest();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).toHaveClass(expectedClassName);

          $$rAF.flush();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).not.toHaveClass(expectedClassName);
        });
      });
    });

    describe('grouped', function() {
      let fromElement;
      let toElement;
      let fromAnchors;
      let toAnchors;
      beforeEach(module(function($provide) {
        fromElement = jqLite('<div></div>');
        toElement = jqLite('<div></div>');
        fromAnchors = [
          jqLite('<div>1</div>'),
          jqLite('<div>2</div>'),
          jqLite('<div>3</div>')
        ];
        toAnchors = [
          jqLite('<div>a</div>'),
          jqLite('<div>b</div>'),
          jqLite('<div>c</div>')
        ];

        return function($rootElement) {
          $rootElement.append(fromElement);
          $rootElement.append(toElement);
          forEach(fromAnchors, function(a) {
            fromElement.append(a);
          });
          forEach(toAnchors, function(a) {
            toElement.append(a);
          });
        };
      }));

      it('should group animations together when they have shared anchors and a shared CSS class',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '1');
        toAnchors[0].attr('ng-animate-ref', '1');
        $rootScope.$digest();

        expect(captureLog.length).toBe(1);

        let fromAnimation = capturedAnimation.from;
        expect(fromAnimation.element).toEqual(fromElement);
        expect(fromAnimation.event).toBe('leave');

        let toAnimation = capturedAnimation.to;
        expect(toAnimation.element).toBe(toElement);
        expect(toAnimation.event).toBe('enter');

        let fromElm = fromAnchors[0];
        let toElm = toAnchors[0];

        let anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElm, anchors['out']);
        assertCompareNodes(toElm, anchors['in']);
      }));

      it('should group animations together and properly match up multiple anchors based on their references',
        inject(function($$animation, $rootScope) {

        let attr = 'ng-animate-ref';

        fromAnchors[0].attr(attr, '1');
        fromAnchors[1].attr(attr, '2');
        fromAnchors[2].attr(attr, '3');

        toAnchors[0].attr(attr, '1');
        toAnchors[1].attr(attr, '3');
        toAnchors[2].attr(attr, '2');

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        $rootScope.$digest();

        let anchors = capturedAnimation.anchors;
        assertCompareNodes(fromAnchors[0], anchors[0]['out']);
        assertCompareNodes(toAnchors[0], anchors[0]['in']);

        assertCompareNodes(fromAnchors[1], anchors[1]['out']);
        assertCompareNodes(toAnchors[2], anchors[1]['in']);

        assertCompareNodes(fromAnchors[2], anchors[2]['out']);
        assertCompareNodes(toAnchors[1], anchors[2]['in']);
      }));

      it('should group animations together on the from and to elements if their both contain matching anchors',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        fromElement.attr('ng-animate-ref', '1');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        toElement.attr('ng-animate-ref', '1');
        $$animation(toElement, 'enter');

        $rootScope.$digest();

        let anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElement, anchors['out']);
        assertCompareNodes(toElement, anchors['in']);
      }));

      it('should not group animations into an anchored animation if enter/leave events are NOT used',
        inject(function($$animation, $rootScope, $$rAF) {

        fromElement.addClass('shared-class');
        fromElement.attr('ng-animate-ref', '1');
        $$animation(fromElement, 'addClass', {
          addClass: 'red'
        });

        toElement.addClass('shared-class');
        toElement.attr('ng-animate-ref', '1');
        $$animation(toElement, 'removeClass', {
          removeClass: 'blue'
        });

        $rootScope.$digest();
        $$rAF.flush();
        expect(captureLog.length).toBe(2);
      }));

      it('should not group animations together if a matching pair of anchors is not detected',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '6');
        toAnchors[0].attr('ng-animate-ref', '3');
        $rootScope.$digest();

        expect(captureLog.length).toBe(2);
      }));

      it('should not group animations together if a matching CSS class is not detected',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('even-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('odd-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '9');
        toAnchors[0].attr('ng-animate-ref', '9');
        $rootScope.$digest();

        expect(captureLog.length).toBe(2);
      }));

      it('should expose the shared CSS class in the options provided to the driver',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('fresh-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('fresh-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '9');
        toAnchors[0].attr('ng-animate-ref', '9');
        $rootScope.$digest();

        expect(capturedAnimation.classes).toBe('fresh-class');
      }));

      it('should update the runner methods to the grouped runner methods handled by the driver',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        let runner1 = $$animation(fromElement, 'leave');

        toElement.addClass('group-1');
        let runner2 = $$animation(toElement, 'enter');

        expect(runner1).not.toBe(runner2);

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        expect(runner1).not.toBe(runner2);
        expect(runner1.end).toBe(runner2.end);
        expect(runner1.cancel).toBe(runner2.cancel);
      }));

      they('should end the animation if the $prop element is prematurely removed from the DOM during the animation', ['from', 'to'], function(event) {
        inject(function($$animation, $rootScope) {
          fromElement.addClass('group-1');
          $$animation(fromElement, 'leave');

          toElement.addClass('group-1');
          $$animation(toElement, 'enter');

          fromAnchors[0].attr('ng-animate-ref', 'abc');
          toAnchors[0].attr('ng-animate-ref', 'abc');
          $rootScope.$digest();

          expect(runnerLog).toEqual([]);

          (event === 'from' ? fromElement : toElement).remove();
          expect(runnerLog).toEqual(['end']);
        });
      });

      it('should not end the animation when the `from` animation calls its own leave dom operation',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        let elementRemoved = false;
        $$animation(fromElement, 'leave', {
          domOperation: function() {
            elementRemoved = true;
            fromElement.remove();
          }
        });

        toElement.addClass('group-1');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        let leaveAnimation = capturedAnimation.from;
        expect(leaveAnimation.event).toBe('leave');

        // this removes the element and this code is run normally
        // by the driver when it is time for the element to be removed
        leaveAnimation.options.domOperation();

        expect(elementRemoved).toBe(true);
        expect(runnerLog).toEqual([]);
      }));

      it('should not end the animation if any of the anchor elements are removed from the DOM during the animation',
        inject(function($$animation, $rootScope) {

        fromElement.addClass('group-1');
        let elementRemoved = false;
        $$animation(fromElement, 'leave', {}, function() {
          elementRemoved = true;
          fromElement.remove();
        });

        toElement.addClass('group-1');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        fromAnchors[0].remove();
        toAnchors[0].remove();

        expect(runnerLog).toEqual([]);
      }));

      it('should prepare a parent-element animation to run first before the anchored animation',
        inject(function($$animation, $rootScope, $rootElement, $animate) {

        fromAnchors[0].attr('ng-animate-ref', 'shared');
        toAnchors[0].attr('ng-animate-ref', 'shared');

        let parent = jqLite('<div></div>');
        parent.append(fromElement);
        parent.append(toElement);
        $rootElement.append(parent);

        fromElement.addClass('group-1');
        toElement.addClass('group-1');

        // issued first
        $$animation(toElement, 'enter');
        $$animation(fromElement, 'leave');

        // issued second
        $$animation(parent, 'addClass', { addClass: 'red' });

        expect(captureLog.length).toBe(0);

        $rootScope.$digest();
        $animate.flush();

        expect(captureLog[0].element).toBe(parent);
        expect(captureLog[1].from.element).toBe(fromElement);
        expect(captureLog[1].to.element).toBe(toElement);
      }));
    });
  });

  describe('[options]', function() {
    let runner;
    let defered;
    let parent;
    let mockedDriverFn;
    let mockedPlayerFn;

    beforeEach(module(function($$animationProvider, $provide) {
      $$animationProvider.drivers.push('mockedTestDriver');
      $provide.factory('mockedTestDriver', function() {
        return mockedDriverFn;
      });

      element = jqLite('<div></div>');
      parent = jqLite('<div></div>');

      return function($$AnimateRunner, $rootElement, $document) {
        jqLite($document[0].body).append($rootElement);
        $rootElement.append(parent);

        mockedDriverFn = function(element, method, options, domOperation) {
          return {
            start: function() {
              runner = new $$AnimateRunner();
              return runner;
            }
          };
        };
      };
    }));

    it('should temporarily assign the provided CSS class for the duration of the animation',
      inject(function($rootScope, $$animation) {

      parent.append(element);

      $$animation(element, 'enter', {
        tempClasses: 'temporary fudge'
      });
      $rootScope.$digest();

      expect(element).toHaveClass('temporary');
      expect(element).toHaveClass('fudge');

      runner.end();
      $rootScope.$digest();

      expect(element).not.toHaveClass('temporary');
      expect(element).not.toHaveClass('fudge');
    }));

    it('should add and remove the ng-animate CSS class when the animation is active',
      inject(function($$animation, $rootScope) {

      parent.append(element);

      $$animation(element, 'enter');
      $rootScope.$digest();
      expect(element).toHaveClass('ng-animate');

      runner.end();
      $rootScope.$digest();

      expect(element).not.toHaveClass('ng-animate');
    }));


    it('should apply the `ng-animate` and temporary CSS classes before the driver is invoked', function() {
      let capturedElementClasses;

      parent.append(element);

      module(function($provide) {
        $provide.factory('mockedTestDriver', function() {
          return function(details) {
            capturedElementClasses = details.element.attr('class');
          };
        });
      });

      inject(function($$animation, $rootScope) {
        parent.append(element);

        $$animation(element, 'enter', {
          tempClasses: 'temp-class-name'
        });
        $rootScope.$digest();

        expect(capturedElementClasses).toMatch(/\bng-animate\b/);
        expect(capturedElementClasses).toMatch(/\btemp-class-name\b/);
      });
    });

    it('should perform the DOM operation at the end of the animation if the driver doesn\'t run it already',
      inject(function($$animation, $rootScope) {

      parent.append(element);

      let domOperationFired = false;
      $$animation(element, 'enter', {
        domOperation: function() {
          domOperationFired = true;
        }
      });

      $rootScope.$digest();

      expect(domOperationFired).toBeFalsy();
      runner.end();
      $rootScope.$digest();

      expect(domOperationFired).toBeTruthy();
    }));

    it('should still apply the `from` and `to` styling even if no driver was detected', function() {
      module(function($$animationProvider) {
        $$animationProvider.drivers.length = 0;
      });
      inject(function($$animation, $rootScope) {
        $$animation(element, 'event', {
          from: { background: 'red' },
          to: { background: 'blue' }
        });

        expect(element.css('background')).toContain('blue');
      });
    });

    it('should still apply the `from` and `to` styling even if the driver does not do the job', function() {
      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', function($q) {
          return function stepFn() {
            return $q.resolve(true);
          };
        });
      });
      inject(function($$animation, $rootScope, $animate) {
        element.addClass('four');
        parent.append(element);

        let completed = false;
        $$animation(element, 'event', {
          from: { height: '100px' },
          to: { height: '200px', 'font-size': '50px' }
        }).then(function() {
          completed = true;
        });

        $rootScope.$digest(); //runs the animation
        $rootScope.$digest(); //flushes the step code
        $animate.flush();
        $rootScope.$digest(); //the runner promise

        expect(completed).toBe(true);
        expect(element.css('height')).toContain('200px');
        expect(element.css('font-size')).toBe('50px');
      });
    });

    it('should still resolve the `addClass` and `removeClass` classes even if no driver was detected', function() {
      module(function($$animationProvider) {
        $$animationProvider.drivers.length = 0;
      });
      inject(function($$animation, $rootScope) {
        element.addClass('four');

        $$animation(element, 'event', {
          addClass: 'one two three',
          removeClass: 'four'
        });

        expect(element).toHaveClass('one');
        expect(element).toHaveClass('two');
        expect(element).toHaveClass('three');
        expect(element).not.toHaveClass('four');
      });
    });

    it('should still resolve the `addClass` and `removeClass` classes even if the driver does not do the job', function() {
      module(function($$animationProvider, $provide) {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', function($$AnimateRunner) {
          return function initFn() {
            return function stepFn() {
              return new $$AnimateRunner();
            };
          };
        });
      });
      inject(function($$animation, $rootScope, $animate) {
        parent.append(element);
        element.addClass('four');

        let completed = false;
        let runner = $$animation(element, 'event', {
          addClass: 'one two three',
          removeClass: 'four'
        });
        runner.then(function() {
          completed = true;
        });

        $rootScope.$digest(); //runs the animation
        $rootScope.$digest(); //flushes the step code

        runner.end();
        $animate.flush();
        $rootScope.$digest(); //the runner promise

        expect(completed).toBe(true);
        expect(element).toHaveClass('one');
        expect(element).toHaveClass('two');
        expect(element).toHaveClass('three');
        expect(element).not.toHaveClass('four');
      });
    });
  });
});
