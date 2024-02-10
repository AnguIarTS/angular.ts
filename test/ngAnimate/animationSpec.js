

describe('$$animation', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  let element;
  afterEach(() => {
    dealoc(element);
  });

  beforeEach(module(($$animationProvider) => {
    $$animationProvider.drivers.length = 0;
  }));

  it('should not run an animation if there are no drivers',
    inject(($$animation, $animate, $rootScope) => {

    element = jqLite('<div></div>');
    let done = false;
    $$animation(element, 'someEvent').then(() => {
      done = true;
    });
    $animate.flush();
    $rootScope.$digest();
    expect(done).toBe(true);
  }));

  it('should not run an animation if no drivers return an animation step function', () => {
    module(($$animationProvider, $provide) => {
      $$animationProvider.drivers.push('matiasDriver');
      $provide.value('matiasDriver', () => false);
    });
    inject(($$animation, $animate, $rootScope) => {
      element = jqLite('<div></div>');
      const parent = jqLite('<div></div>');
      parent.append(element);

      let done = false;
      $$animation(element, 'someEvent').then(() => {
        done = true;
      });
      $rootScope.$digest();
      $animate.flush();
      $rootScope.$digest();
      expect(done).toBe(true);
    });
  });

  describe('drivers', () => {
    it('should use the first driver that returns a step function', () => {
      let count = 0;
      let activeDriver;
      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers.push('1');
        $$animationProvider.drivers.push('2');
        $$animationProvider.drivers.push('3');

        let runner;

        $provide.value('1', () => {
          count++;
        });

        $provide.value('2', () => {
          count++;
          return {
            start() {
              activeDriver = '2';
              return runner;
            }
          };
        });

        $provide.value('3', () => {
          count++;
        });

        return function($$AnimateRunner) {
          runner = new $$AnimateRunner();
        };
      });

      inject(($$animation, $rootScope, $rootElement) => {
        element = jqLite('<div></div>');
        $rootElement.append(element);

        $$animation(element, 'enter');
        $rootScope.$digest();

        expect(count).toBe(2);
        expect(activeDriver).toBe('2');
      });
    });

    describe('step function', () => {
      let capturedAnimation;
      beforeEach(module(($$animationProvider, $provide) => {
        element = jqLite('<div></div>');

        $$animationProvider.drivers.push('stepper');
        $provide.factory('stepper', ($$AnimateRunner) => function() {
            capturedAnimation = arguments;
            return {
              start() {
                return new $$AnimateRunner();
              }
            };
          });
      }));

      it('should obtain the element, event, the provided options and the domOperation',
        inject(($$animation, $rootScope, $rootElement) => {
        $rootElement.append(element);

        const options = {};
        options.foo = 'bar';
        options.domOperation = function() {
          domOperationCalled = true;
        };
        let domOperationCalled = false;
        $$animation(element, 'megaEvent', options);
        $rootScope.$digest();

        const details = capturedAnimation[0];
        expect(details.element).toBe(element);
        expect(details.event).toBe('megaEvent');
        expect(details.options.foo).toBe(options.foo);

        // the function is wrapped inside of $$animation, but it is still a function
        expect(domOperationCalled).toBe(false);
        details.options.domOperation();
        expect(domOperationCalled).toBe(true);
      }));

      it('should obtain the classes string which is a combination of className, addClass and removeClass',
        inject(($$animation, $rootScope, $rootElement) => {

        element.addClass('blue red');
        $rootElement.append(element);

        $$animation(element, 'enter', {
          addClass: 'green',
          removeClass: 'orange',
          tempClasses: 'pink'
        });

        $rootScope.$digest();

        const {classes} = capturedAnimation[0];
        expect(classes).toBe('blue red green orange pink');
      }));
    });

    it('should traverse the drivers in reverse order', () => {
      const log = [];
      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers.push('first');
        $$animationProvider.drivers.push('second');

        $provide.value('first', () => {
          log.push('first');
          return false;
        });

        $provide.value('second', () => {
          log.push('second');
          return false;
        });
      });

      inject(($$animation, $rootScope, $rootElement) => {
        element = jqLite('<div></div>');
        $rootElement.append(element);
        $$animation(element, 'enter');
        $rootScope.$digest();
        expect(log).toEqual(['second', 'first']);
      });
    });

    they('should $prop the animation call if the driver $proped the returned promise',
      ['resolve', 'reject'], (event) => {

      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers.push('resolvingAnimation');
        $provide.factory('resolvingAnimation', ($$AnimateRunner) => function() {
            return {
              start() {
                return new $$AnimateRunner();
              }
            };
          });
      });

      inject(($$animation, $rootScope, $animate) => {
        let status;
        const element = jqLite('<div></div>');
        const parent = jqLite('<div></div>');
        parent.append(element);

        const runner = $$animation(element, 'enter');
        runner.then(() => {
            status = 'resolve';
          }, () => {
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
      ['cancel', 'end'], (method) => {

      const log = [];

      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers.push('actualDriver');
        $provide.factory('actualDriver', ($$AnimateRunner) => function() {
            return {
              start() {
                log.push('start');
                return new $$AnimateRunner({
                  end() {
                    log.push('end');
                  },
                  cancel() {
                    log.push('cancel');
                  }
                });
              }
            };
          });
      });

      inject(($$animation, $rootScope, $rootElement) => {
        element = jqLite('<div></div>');
        $rootElement.append(element);

        const runner = $$animation(element, 'enter');
        $rootScope.$digest();

        runner[method]();
        expect(log).toEqual(['start', method]);
      });
    });
  });

  describe('when', () => {
    let captureLog;
    let runnerLog;
    let capturedAnimation;

    beforeEach(module(($$animationProvider, $provide) => {
      captureLog = [];
      runnerLog = [];
      capturedAnimation = null;

      $$animationProvider.drivers.push('interceptorDriver');
      $provide.factory('interceptorDriver', ($$AnimateRunner) => function(details) {
          captureLog.push(capturedAnimation = details); // only one param is passed into the driver
          return {
            start() {
              return new $$AnimateRunner({
                end: runnerEvent('end'),
                cancel: runnerEvent('cancel')
              });
            }
          };
        });

      function runnerEvent(token) {
        return function() {
          runnerLog.push(token);
        };
      }
    }));

    describe('singular', () => {
      beforeEach(module(($provide) => {
        element = jqLite('<div></div>');
        return function($rootElement) {
          $rootElement.append(element);
        };
      }));

      it('should space out multiple ancestorial class-based animations with a RAF in between',
        inject(($rootScope, $$animation, $$rAF) => {

        const parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        const child = jqLite('<div></div>');
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
        inject(($rootScope, $$animation, $$rAF) => {

        const parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        const child = jqLite('<div></div>');
        element.append(child);

        const r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        const r2 = $$animation(element, 'addClass', { addClass: 'red' });
        const r3 = $$animation(child, 'addClass', { addClass: 'green' });

        r2.end();

        $rootScope.$digest();

        expect(captureLog.length).toBe(1);
        expect(capturedAnimation.options.addClass).toBe('blue');

        $$rAF.flush();

        expect(captureLog.length).toBe(2);
        expect(capturedAnimation.options.addClass).toBe('green');
      }));

      it('should properly cancel out pending animations that are spaced with a RAF request after the digest completes',
        inject(($rootScope, $$animation, $$rAF) => {

        const parent = element;
        element = jqLite('<div></div>');
        parent.append(element);

        const child = jqLite('<div></div>');
        element.append(child);

        const r1 = $$animation(parent, 'addClass', { addClass: 'blue' });
        const r2 = $$animation(element, 'addClass', { addClass: 'red' });
        const r3 = $$animation(child, 'addClass', { addClass: 'green' });

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
        ['end', 'cancel', 'then'], (method) => {
        inject(($$animation) => {
          const runner = $$animation(element, 'someEvent');
          expect(isFunction(runner[method])).toBe(true);
        });
      });

      they('should close the animation if runner.$prop() is called before the $postDigest phase kicks in',
        ['end', 'cancel'], (method) => {
        inject(($$animation, $rootScope, $animate) => {
          let status;
          const runner = $$animation(element, 'someEvent');
          runner.then(() => { status = 'end'; },
                      () => { status = 'cancel'; });

          runner[method]();
          $rootScope.$digest();
          expect(runnerLog).toEqual([]);

          $animate.flush();
          expect(status).toBe(method);
        });
      });

      they('should update the runner methods to the ones provided by the driver when the animation starts',
        ['end', 'cancel'], (method) => {

        const spy = jasmine.createSpy();
        module(($$animationProvider, $provide) => {
          $$animationProvider.drivers.push('animalDriver');
          $provide.factory('animalDriver', ($$AnimateRunner) => function() {
              return {
                start() {
                  const data = {};
                  data[method] = spy;
                  return new $$AnimateRunner(data);
                }
              };
            });
        });
        inject(($$animation, $rootScope, $rootElement) => {
          const r1 = $$animation(element, 'someEvent');
          r1[method]();
          expect(spy).not.toHaveBeenCalled();
          $rootScope.$digest(); // this clears the digest which cleans up the mess

          const r2 = $$animation(element, 'otherEvent');
          $rootScope.$digest();
          r2[method]();
          expect(spy).toHaveBeenCalled();
        });
      });

      it('should not start the animation if the element is removed from the DOM before the postDigest kicks in',
        inject(($$animation) => {

        const runner = $$animation(element, 'someEvent');

        expect(capturedAnimation).toBeFalsy();
        element.remove();
        expect(capturedAnimation).toBeFalsy();
      }));

      it('should immediately end the animation if the element is removed from the DOM during the animation',
        inject(($$animation, $animate, $rootScope) => {

        const runner = $$animation(element, 'someEvent');
        $rootScope.$digest();

        expect(capturedAnimation).toBeTruthy();
        expect(runnerLog).toEqual([]);
        element.remove();
        expect(runnerLog).toEqual(['end']);
      }));

      it('should not end the animation when the leave animation removes the element from the DOM',
        inject(($$animation, $animate, $rootScope) => {

        const runner = $$animation(element, 'leave', {}, () => {
          element.remove();
        });

        $rootScope.$digest();

        expect(runnerLog).toEqual([]);
        capturedAnimation.options.domOperation(); // this removes the element
        element.remove();
        expect(runnerLog).toEqual([]);
      }));

      it('should remove the $destroy event listener when the animation is closed',
        inject(($$animation, $rootScope) => {

        const addListen = spyOn(element, 'on').and.callThrough();
        const removeListen = spyOn(element, 'off').and.callThrough();
        const runner = $$animation(element, 'someEvent');

        let args = addListen.calls.mostRecent().args[0];
        expect(args).toBe('$destroy');

        runner.end();

        args = removeListen.calls.mostRecent().args[0];
        expect(args).toBe('$destroy');
      }));

      it('should always sort parent-element animations to run in order of parent-to-child DOM structure',
        inject(($$animation, $rootScope, $animate) => {

        const child = jqLite('<div></div>');
        const grandchild = jqLite('<div></div>');

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
        ['enter', 'leave', 'move'], (animationType) => {
        inject(($$animation, $rootScope, $animate) => {
          const expectedClassName = `ng-${  animationType  }-prepare`;

          $$animation(element, animationType);
          $rootScope.$digest();
          expect(element).not.toHaveClass(expectedClassName);

          const child = jqLite('<div></div>');
          element.append(child);

          $$animation(element, animationType);
          $$animation(child, animationType);
          $rootScope.$digest();

          expect(element).not.toHaveClass(expectedClassName);
          expect(child).toHaveClass(expectedClassName);
        });
      });


      they('should remove the preparation class before the $prop-animation starts',
        ['enter', 'leave', 'move'], (animationType) => {
        inject(($$animation, $rootScope, $$rAF) => {
          const expectedClassName = `ng-${  animationType  }-prepare`;

          const child = jqLite('<div></div>');
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

    describe('grouped', () => {
      let fromElement;
      let toElement;
      let fromAnchors;
      let toAnchors;
      beforeEach(module(($provide) => {
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
          forEach(fromAnchors, (a) => {
            fromElement.append(a);
          });
          forEach(toAnchors, (a) => {
            toElement.append(a);
          });
        };
      }));

      it('should group animations together when they have shared anchors and a shared CSS class',
        inject(($$animation, $rootScope) => {

        fromElement.addClass('shared-class');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', '1');
        toAnchors[0].attr('ng-animate-ref', '1');
        $rootScope.$digest();

        expect(captureLog.length).toBe(1);

        const fromAnimation = capturedAnimation.from;
        expect(fromAnimation.element).toEqual(fromElement);
        expect(fromAnimation.event).toBe('leave');

        const toAnimation = capturedAnimation.to;
        expect(toAnimation.element).toBe(toElement);
        expect(toAnimation.event).toBe('enter');

        const fromElm = fromAnchors[0];
        const toElm = toAnchors[0];

        const anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElm, anchors.out);
        assertCompareNodes(toElm, anchors.in);
      }));

      it('should group animations together and properly match up multiple anchors based on their references',
        inject(($$animation, $rootScope) => {

        const attr = 'ng-animate-ref';

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

        const {anchors} = capturedAnimation;
        assertCompareNodes(fromAnchors[0], anchors[0].out);
        assertCompareNodes(toAnchors[0], anchors[0].in);

        assertCompareNodes(fromAnchors[1], anchors[1].out);
        assertCompareNodes(toAnchors[2], anchors[1].in);

        assertCompareNodes(fromAnchors[2], anchors[2].out);
        assertCompareNodes(toAnchors[1], anchors[2].in);
      }));

      it('should group animations together on the from and to elements if their both contain matching anchors',
        inject(($$animation, $rootScope) => {

        fromElement.addClass('shared-class');
        fromElement.attr('ng-animate-ref', '1');
        $$animation(fromElement, 'leave');

        toElement.addClass('shared-class');
        toElement.attr('ng-animate-ref', '1');
        $$animation(toElement, 'enter');

        $rootScope.$digest();

        const anchors = capturedAnimation.anchors[0];
        assertCompareNodes(fromElement, anchors.out);
        assertCompareNodes(toElement, anchors.in);
      }));

      it('should not group animations into an anchored animation if enter/leave events are NOT used',
        inject(($$animation, $rootScope, $$rAF) => {

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
        inject(($$animation, $rootScope) => {

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
        inject(($$animation, $rootScope) => {

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
        inject(($$animation, $rootScope) => {

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
        inject(($$animation, $rootScope) => {

        fromElement.addClass('group-1');
        const runner1 = $$animation(fromElement, 'leave');

        toElement.addClass('group-1');
        const runner2 = $$animation(toElement, 'enter');

        expect(runner1).not.toBe(runner2);

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        expect(runner1).not.toBe(runner2);
        expect(runner1.end).toBe(runner2.end);
        expect(runner1.cancel).toBe(runner2.cancel);
      }));

      they('should end the animation if the $prop element is prematurely removed from the DOM during the animation', ['from', 'to'], (event) => {
        inject(($$animation, $rootScope) => {
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
        inject(($$animation, $rootScope) => {

        fromElement.addClass('group-1');
        let elementRemoved = false;
        $$animation(fromElement, 'leave', {
          domOperation() {
            elementRemoved = true;
            fromElement.remove();
          }
        });

        toElement.addClass('group-1');
        $$animation(toElement, 'enter');

        fromAnchors[0].attr('ng-animate-ref', 'abc');
        toAnchors[0].attr('ng-animate-ref', 'abc');
        $rootScope.$digest();

        const leaveAnimation = capturedAnimation.from;
        expect(leaveAnimation.event).toBe('leave');

        // this removes the element and this code is run normally
        // by the driver when it is time for the element to be removed
        leaveAnimation.options.domOperation();

        expect(elementRemoved).toBe(true);
        expect(runnerLog).toEqual([]);
      }));

      it('should not end the animation if any of the anchor elements are removed from the DOM during the animation',
        inject(($$animation, $rootScope) => {

        fromElement.addClass('group-1');
        let elementRemoved = false;
        $$animation(fromElement, 'leave', {}, () => {
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
        inject(($$animation, $rootScope, $rootElement, $animate) => {

        fromAnchors[0].attr('ng-animate-ref', 'shared');
        toAnchors[0].attr('ng-animate-ref', 'shared');

        const parent = jqLite('<div></div>');
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

  describe('[options]', () => {
    let runner;
    let defered;
    let parent;
    let mockedDriverFn;
    let mockedPlayerFn;

    beforeEach(module(($$animationProvider, $provide) => {
      $$animationProvider.drivers.push('mockedTestDriver');
      $provide.factory('mockedTestDriver', () => mockedDriverFn);

      element = jqLite('<div></div>');
      parent = jqLite('<div></div>');

      return function($$AnimateRunner, $rootElement, $document) {
        jqLite($document[0].body).append($rootElement);
        $rootElement.append(parent);

        mockedDriverFn = function(element, method, options, domOperation) {
          return {
            start() {
              runner = new $$AnimateRunner();
              return runner;
            }
          };
        };
      };
    }));

    it('should temporarily assign the provided CSS class for the duration of the animation',
      inject(($rootScope, $$animation) => {

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
      inject(($$animation, $rootScope) => {

      parent.append(element);

      $$animation(element, 'enter');
      $rootScope.$digest();
      expect(element).toHaveClass('ng-animate');

      runner.end();
      $rootScope.$digest();

      expect(element).not.toHaveClass('ng-animate');
    }));


    it('should apply the `ng-animate` and temporary CSS classes before the driver is invoked', () => {
      let capturedElementClasses;

      parent.append(element);

      module(($provide) => {
        $provide.factory('mockedTestDriver', () => function(details) {
            capturedElementClasses = details.element.attr('class');
          });
      });

      inject(($$animation, $rootScope) => {
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
      inject(($$animation, $rootScope) => {

      parent.append(element);

      let domOperationFired = false;
      $$animation(element, 'enter', {
        domOperation() {
          domOperationFired = true;
        }
      });

      $rootScope.$digest();

      expect(domOperationFired).toBeFalsy();
      runner.end();
      $rootScope.$digest();

      expect(domOperationFired).toBeTruthy();
    }));

    it('should still apply the `from` and `to` styling even if no driver was detected', () => {
      module(($$animationProvider) => {
        $$animationProvider.drivers.length = 0;
      });
      inject(($$animation, $rootScope) => {
        $$animation(element, 'event', {
          from: { background: 'red' },
          to: { background: 'blue' }
        });

        expect(element.css('background')).toContain('blue');
      });
    });

    it('should still apply the `from` and `to` styling even if the driver does not do the job', () => {
      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', ($q) => function stepFn() {
            return $q.resolve(true);
          });
      });
      inject(($$animation, $rootScope, $animate) => {
        element.addClass('four');
        parent.append(element);

        let completed = false;
        $$animation(element, 'event', {
          from: { height: '100px' },
          to: { height: '200px', 'font-size': '50px' }
        }).then(() => {
          completed = true;
        });

        $rootScope.$digest(); // runs the animation
        $rootScope.$digest(); // flushes the step code
        $animate.flush();
        $rootScope.$digest(); // the runner promise

        expect(completed).toBe(true);
        expect(element.css('height')).toContain('200px');
        expect(element.css('font-size')).toBe('50px');
      });
    });

    it('should still resolve the `addClass` and `removeClass` classes even if no driver was detected', () => {
      module(($$animationProvider) => {
        $$animationProvider.drivers.length = 0;
      });
      inject(($$animation, $rootScope) => {
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

    it('should still resolve the `addClass` and `removeClass` classes even if the driver does not do the job', () => {
      module(($$animationProvider, $provide) => {
        $$animationProvider.drivers[0] = 'dumbDriver';
        $provide.factory('dumbDriver', ($$AnimateRunner) => function initFn() {
            return function stepFn() {
              return new $$AnimateRunner();
            };
          });
      });
      inject(($$animation, $rootScope, $animate) => {
        parent.append(element);
        element.addClass('four');

        let completed = false;
        const runner = $$animation(element, 'event', {
          addClass: 'one two three',
          removeClass: 'four'
        });
        runner.then(() => {
          completed = true;
        });

        $rootScope.$digest(); // runs the animation
        $rootScope.$digest(); // flushes the step code

        runner.end();
        $animate.flush();
        $rootScope.$digest(); // the runner promise

        expect(completed).toBe(true);
        expect(element).toHaveClass('one');
        expect(element).toHaveClass('two');
        expect(element).toHaveClass('three');
        expect(element).not.toHaveClass('four');
      });
    });
  });
});
