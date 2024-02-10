

describe('ngAnimate $$animateCssDriver', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  function int(x) {
    return parseInt(x, 10);
  }

  function hasAll(array, vals) {
    for (let i = 0; i < vals.length; i++) {
      if (array.indexOf(vals[i]) === -1) return false;
    }
    return true;
  }

  it('should return a noop driver handler if the browser does not support CSS transitions and keyframes', () => {
    module(($provide) => {
      $provide.value('$sniffer', {});
    });
    inject(($$animateCssDriver) => {
      expect($$animateCssDriver).toBe(noop);
    });
  });

  describe('when active', () => {
    if (!browserSupportsCssAnimations()) return;

    let element;
    let ss;
    afterEach(() => {
      dealoc(element);
      if (ss) {
        ss.destroy();
      }
    });

    let capturedAnimation;
    let captureLog;
    let driver;
    let captureFn;
    beforeEach(module(($provide) => {
      capturedAnimation = null;
      captureLog = [];
      captureFn = noop;

      $provide.factory('$animateCss', ($$AnimateRunner) => function() {
          const runner = new $$AnimateRunner();

          capturedAnimation = arguments;
          captureFn.apply(null, arguments);
          captureLog.push({
            element: arguments[0],
            args: arguments,
            runner
          });

          return {
            $$willAnimate: true,
            start() {
              return runner;
            }
          };
        });

      element = jqLite('<div></div>');

      return function($$animateCssDriver, $document) {
        driver = function(details, cb) {
          return $$animateCssDriver(details, cb || noop);
        };
        ss = createMockStyleSheet($document);
      };
    }));

    it('should register the $$animateCssDriver into the list of drivers found in $animateProvider',
      module(($animateProvider) => {

      expect($animateProvider.drivers).toContain('$$animateCssDriver');
    }));

    it('should register the $$animateCssDriver into the list of drivers found in $animateProvider',
      module(($animateProvider) => {

      expect($animateProvider.drivers).toContain('$$animateCssDriver');
    }));

    describe('regular animations', () => {
      it('should render an animation on the given element', inject(() => {
        driver({ element });
        expect(capturedAnimation[0]).toBe(element);
      }));

      it('should return an object with a start function', inject(() => {
        const runner = driver({ element });
        expect(isFunction(runner.start)).toBeTruthy();
      }));

      it('should not signal $animateCss to apply the classes early when animation is structural', inject(() => {
        driver({ element });
        expect(capturedAnimation[1].applyClassesEarly).toBeFalsy();

        driver({ element, structural: true });
        expect(capturedAnimation[1].applyClassesEarly).toBeTruthy();
      }));

      it('should only set the event value if the animation is structural', inject(() => {
        driver({ element, structural: true, event: 'superman' });
        expect(capturedAnimation[1].event).toBe('superman');

        driver({ element, event: 'batman' });
        expect(capturedAnimation[1].event).toBeFalsy();
      }));
    });

    describe('anchored animations', () => {
      let from; let to; let fromAnimation; let toAnimation;

      beforeEach(module(() => function($rootElement, $document) {
          from = element;
          to = jqLite('<div></div>');
          fromAnimation = { element: from, event: 'enter' };
          toAnimation = { element: to, event: 'leave' };
          $rootElement.append(from);
          $rootElement.append(to);

          const doc = $document[0];

          // there is one test in here that expects the rootElement
          // to supersede the body node
          if (!$rootElement[0].contains(doc.body)) {
            // we need to do this so that style detection works
            jqLite(doc.body).append($rootElement);
          }
        }));

      it('should not return anything if no animation is detected', () => {
        module(($provide) => {
          $provide.value('$animateCss', () => ({ $$willAnimate: false }));
        });
        inject(() => {
          const runner = driver({
            from: fromAnimation,
            to: toAnimation
          });
          expect(runner).toBeFalsy();
        });
      });

      it('should return a start method', inject(() => {
        const animator = driver({
          from: fromAnimation,
          to: toAnimation
        });
        expect(isFunction(animator.start)).toBeTruthy();
      }));

      they('should return a runner with a $prop() method which will end the animation',
        ['end', 'cancel'], (method) => {

        let closeAnimation;
        module(($provide) => {
          $provide.factory('$animateCss', ($q, $$AnimateRunner) => function() {
              return {
                $$willAnimate: true,
                start() {
                  return new $$AnimateRunner({
                    end() {
                      closeAnimation();
                    }
                  });
                }
              };
            });
        });

        inject(() => {
          const animator = driver({
            from: fromAnimation,
            to: toAnimation
          });

          let animationClosed = false;
          closeAnimation = function() {
            animationClosed = true;
          };

          const runner = animator.start();

          expect(isFunction(runner[method])).toBe(true);
          runner[method]();
          expect(animationClosed).toBe(true);
        });
      });

      it('should end the animation for each of the from and to elements as well as all the anchors', () => {
        const closeLog = {};
        module(($provide) => {
          $provide.factory('$animateCss', ($q, $$AnimateRunner) => function(element, options) {
              const type = options.event || 'anchor';
              closeLog[type] = closeLog[type] || [];
              return {
                $$willAnimate: true,
                start() {
                  return new $$AnimateRunner({
                    end() {
                      closeLog[type].push(element);
                    }
                  });
                }
              };
            });
        });

        inject(() => {
          // we'll just use one animation to make the test smaller
          const anchorAnimation = {
            'in': jqLite('<div></div>'),
            'out': jqLite('<div></div>')
          };

          fromAnimation.structural = true;
          fromAnimation.element.append(anchorAnimation.out);
          toAnimation.structural = true;
          toAnimation.element.append(anchorAnimation.in);

          const animator = driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [
              anchorAnimation,
              anchorAnimation,
              anchorAnimation
            ]
          });

          const runner = animator.start();
          runner.end();

          expect(closeLog.enter[0]).toEqual(fromAnimation.element);
          expect(closeLog.leave[0]).toEqual(toAnimation.element);
          expect(closeLog.anchor.length).toBe(3);
        });
      });

      it('should render an animation on both the from and to elements', inject(() => {
        captureFn = function(element, details) {
          element.addClass(details.event);
        };

        fromAnimation.structural = true;
        toAnimation.structural = true;

        const runner = driver({
          from: fromAnimation,
          to: toAnimation
        });

        expect(captureLog.length).toBe(2);
        expect(fromAnimation.element).toHaveClass('enter');
        expect(toAnimation.element).toHaveClass('leave');
      }));

      it('should start the animations on the from and to elements in parallel', () => {
        const animationLog = [];
        module(($provide) => {
          $provide.factory('$animateCss', ($$AnimateRunner) => function(element, details) {
              return {
                $$willAnimate: true,
                start() {
                  animationLog.push([element, details.event]);
                  return new $$AnimateRunner();
                }
              };
            });
        });
        inject(() => {
          fromAnimation.structural = true;
          toAnimation.structural = true;

          const runner = driver({
            from: fromAnimation,
            to: toAnimation
          });

          expect(animationLog.length).toBe(0);
          runner.start();
          expect(animationLog).toEqual([
            [fromAnimation.element, 'enter'],
            [toAnimation.element, 'leave']
          ]);
        });
      });

      it('should start an animation for each anchor', inject(() => {
        const o1 = jqLite('<div></div>');
        from.append(o1);
        const o2 = jqLite('<div></div>');
        from.append(o2);
        const o3 = jqLite('<div></div>');
        from.append(o3);

        const i1 = jqLite('<div></div>');
        to.append(i1);
        const i2 = jqLite('<div></div>');
        to.append(i2);
        const i3 = jqLite('<div></div>');
        to.append(i3);

        const anchors = [
          { 'out': o1, 'in': i1, classes: 'red' },
          { 'out': o2, 'in': i2, classes: 'blue' },
          { 'out': o2, 'in': i2, classes: 'green' }
        ];

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors
        });

        expect(captureLog.length).toBe(5);
      }));

      it('should create a clone of the starting element for each anchor animation', inject(() => {
        const o1 = jqLite('<div class="out1"></div>');
        from.append(o1);
        const o2 = jqLite('<div class="out2"></div>');
        from.append(o2);

        const i1 = jqLite('<div class="in1"></div>');
        to.append(i1);
        const i2 = jqLite('<div class="in2"></div>');
        to.append(i2);

        const anchors = [
          { 'out': o1, 'in': i1 },
          { 'out': o2, 'in': i2 }
        ];

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors
        });

        const a2 = captureLog.pop().element;
        const a1 = captureLog.pop().element;

        expect(a1).not.toEqual(o1);
        expect(a1.attr('class')).toMatch(/\bout1\b/);
        expect(a2).not.toEqual(o2);
        expect(a2.attr('class')).toMatch(/\bout2\b/);
      }));

      it('should create a clone of the starting element and place it at the end of the $rootElement container',
        inject(($rootElement) => {

        // stick some garbage into the rootElement
        $rootElement.append(jqLite('<div></div>'));
        $rootElement.append(jqLite('<div></div>'));
        $rootElement.append(jqLite('<div></div>'));

        const fromAnchor = jqLite('<div class="out"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div class="in"></div>');
        to.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'in': fromAnchor,
            'out': toAnchor
          }]
        });

        const anchor = captureLog.pop().element;
        const anchorNode = anchor[0];
        const contents = $rootElement.contents();

        expect(contents.length).toBeGreaterThan(1);
        expect(contents[contents.length - 1]).toEqual(anchorNode);
      }));

      it('should first do an addClass(\'ng-anchor-out\') animation on the cloned anchor', inject(($rootElement) => {
        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        const anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.addClass).toBe('ng-anchor-out');
        expect(anchorDetails.event).toBeFalsy();
      }));

      it('should then do an addClass(\'ng-anchor-in\') animation on the cloned anchor and remove the old class',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        captureLog.pop().runner.end();

        const anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.removeClass.trim()).toBe('ng-anchor-out');
        expect(anchorDetails.addClass.trim()).toBe('ng-anchor-in');
        expect(anchorDetails.event).toBeFalsy();
      }));

      they('should only fire the ng-anchor-$prop animation if only a $prop animation is defined',
        ['out', 'in'], (direction) => {

        const expectedClass = `ng-anchor-${  direction}`;
        let animationStarted;
        let runner;

        module(($provide) => {
          $provide.factory('$animateCss', ($$AnimateRunner) => function(element, options) {
              const addClass = (options.addClass || '').trim();
              return {
                $$willAnimate: addClass === expectedClass,
                start() {
                  animationStarted = addClass;
                  runner = new $$AnimateRunner();
                  return runner;
                }
              };
            });
        });

        inject(($rootElement, $animate) => {
          const fromAnchor = jqLite('<div></div>');
          from.append(fromAnchor);
          const toAnchor = jqLite('<div></div>');
          to.append(toAnchor);

          $rootElement.append(fromAnchor);
          $rootElement.append(toAnchor);

          let complete = false;

          driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [{
              'out': fromAnchor,
              'in': toAnchor
            }]
          }).start().done(() => {
            complete = true;
          });

          expect(animationStarted).toBe(expectedClass);
          runner.end();
          $animate.flush();
          expect(complete).toBe(true);
        });
      });


      it('should provide an explicit delay setting in the options provided to $animateCss for anchor animations',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        expect(capturedAnimation[1].delay).toBeTruthy();
      }));

      it('should begin the anchor animation by seeding the from styles based on where the from anchor element is positioned',
        inject(($rootElement) => {

        ss.addRule('.starting-element', 'width:200px; height:100px; display:block;');

        const fromAnchor = jqLite('<div class="starting-element"' +
                                    ' style="margin-top:500px; margin-left:150px;"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        const anchorAnimation = captureLog.pop();
        const anchorElement = anchorAnimation.element;
        const anchorDetails = anchorAnimation.args[1];

        const fromStyles = anchorDetails.from;
        expect(int(fromStyles.width)).toBe(200);
        expect(int(fromStyles.height)).toBe(100);
        // some browsers have their own body margin defaults
        expect(int(fromStyles.top)).toBeGreaterThan(499);
        expect(int(fromStyles.left)).toBeGreaterThan(149);
      }));

      it('should append a `px` value for all seeded animation styles', inject(($rootElement) => {
        ss.addRule('.starting-element', 'width:10px; height:20px; display:inline-block;');

        const fromAnchor = jqLite('<div class="starting-element"' +
                                    ' style="margin-top:30px; margin-left:40px;"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        const runner = driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        });

        let anchorAnimation = captureLog.pop();
        let anchorDetails = anchorAnimation.args[1];

        forEach(anchorDetails.from, (value) => {
          expect(value.substr(value.length - 2)).toBe('px');
        });

        // the out animation goes first
        anchorAnimation.runner.end();

        anchorAnimation = captureLog.pop();
        anchorDetails = anchorAnimation.args[1];

        forEach(anchorDetails.to, (value) => {
          expect(value.substr(value.length - 2)).toBe('px');
        });
      }));

      it('should then do an removeClass(\'out\') + addClass(\'in\') animation on the cloned anchor',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        const anchorDetails = captureLog.pop().args[1];
        expect(anchorDetails.removeClass).toMatch(/\bout\b/);
        expect(anchorDetails.addClass).toMatch(/\bin\b/);
        expect(anchorDetails.event).toBeFalsy();
      }));

      it('should add the `ng-anchor` class to the cloned anchor element',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        const clonedAnchor = captureLog.pop().element;
        expect(clonedAnchor).toHaveClass('ng-anchor');
      }));

      it('should add and remove the `ng-animate-shim` class on the in anchor element during the animation',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        expect(fromAnchor).toHaveClass('ng-animate-shim');

        // the out animation goes first
        captureLog.pop().runner.end();
        captureLog.pop().runner.end();

        expect(fromAnchor).not.toHaveClass('ng-animate-shim');
      }));

      it('should add and remove the `ng-animate-shim` class on the out anchor element during the animation',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        expect(toAnchor).toHaveClass('ng-animate-shim');

        // the out animation goes first
        captureLog.pop().runner.end();

        expect(toAnchor).toHaveClass('ng-animate-shim');
        captureLog.pop().runner.end();

        expect(toAnchor).not.toHaveClass('ng-animate-shim');
      }));

      it('should create the cloned anchor with all of the classes from the from anchor element',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div class="yes no maybe"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        const addedClasses = captureLog.pop().element.attr('class').split(' ');
        expect(hasAll(addedClasses, ['yes', 'no', 'maybe'])).toBe(true);
      }));

      it('should remove the classes of the starting anchor from the cloned anchor node during the in animation and also add the classes of the destination anchor within the same animation',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div class="yes no maybe"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div class="why ok so-what"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        const anchorDetails = captureLog.pop().args[1];
        const removedClasses = anchorDetails.removeClass.split(' ');
        const addedClasses = anchorDetails.addClass.split(' ');

        expect(hasAll(removedClasses, ['yes', 'no', 'maybe'])).toBe(true);
        expect(hasAll(addedClasses, ['why', 'ok', 'so-what'])).toBe(true);
      }));

      it('should not attempt to add/remove any classes that contain a `ng-` prefix',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div class="ng-yes ng-no sure"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div class="ng-bar ng-foo maybe"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        const inAnimation = captureLog.pop();
        const details = inAnimation.args[1];

        const addedClasses = details.addClass.split(' ');
        const removedClasses = details.removeClass.split(' ');

        expect(addedClasses).not.toContain('ng-foo');
        expect(addedClasses).not.toContain('ng-bar');

        expect(removedClasses).not.toContain('ng-yes');
        expect(removedClasses).not.toContain('ng-no');
      }));

      it('should not remove any shared CSS classes between the starting and destination anchor element during the in animation',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div class="blue green red"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div class="blue brown red black"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        captureLog.pop().runner.end();

        const inAnimation = captureLog.pop();
        const clonedAnchor = inAnimation.element;
        const details = inAnimation.args[1];

        const addedClasses = details.addClass.split(' ');
        const removedClasses = details.removeClass.split(' ');

        expect(hasAll(addedClasses, ['brown', 'black'])).toBe(true);
        expect(hasAll(removedClasses, ['green'])).toBe(true);

        expect(addedClasses).not.toContain('red');
        expect(addedClasses).not.toContain('blue');

        expect(removedClasses).not.toContain('brown');
        expect(removedClasses).not.toContain('black');

        expect(removedClasses).not.toContain('red');
        expect(removedClasses).not.toContain('blue');

        inAnimation.runner.end();

        expect(clonedAnchor).toHaveClass('red');
        expect(clonedAnchor).toHaveClass('blue');
      }));

      it('should continue the anchor animation by seeding the to styles based on where the final anchor element will be positioned',
      inject(($rootElement) => {
        ss.addRule('.ending-element', 'width:9999px; height:6666px; display:inline-block;');

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);

        const toAnchor = jqLite('<div class="ending-element"' +
                                  ' style="margin-top:300px; margin-left:20px;"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        captureLog.pop().runner.end();

        const anchorAnimation = captureLog.pop();
        const anchorElement = anchorAnimation.element;
        const anchorDetails = anchorAnimation.args[1];

        const toStyles = anchorDetails.to;
        expect(int(toStyles.width)).toBe(9999);
        expect(int(toStyles.height)).toBe(6666);
        // some browsers have their own body margin defaults
        expect(int(toStyles.top)).toBeGreaterThan(300);
        expect(int(toStyles.left)).toBeGreaterThan(20);
      }));

      it('should remove the cloned anchor node from the DOM once the \'in\' animation is complete',
        inject(($rootElement) => {

        const fromAnchor = jqLite('<div class="blue green red"></div>');
        from.append(fromAnchor);
        const toAnchor = jqLite('<div class="blue brown red black"></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start();

        // the out animation goes first
        const inAnimation = captureLog.pop();
        const clonedAnchor = inAnimation.element;
        expect(clonedAnchor.parent().length).toBe(1);
        inAnimation.runner.end();

        // now the in animation completes
        expect(clonedAnchor.parent().length).toBe(1);
        captureLog.pop().runner.end();

        expect(clonedAnchor.parent().length).toBe(0);
      }));

      it('should pass the provided domOperation into $animateCss to be run right after the element is animated if a leave animation is present',
        inject(($rootElement) => {

        toAnimation.structural = true;
        toAnimation.event = 'enter';
        toAnimation.options = {};

        fromAnimation.structural = true;
        fromAnimation.event = 'leave';
        fromAnimation.options = {};

        const leaveOp = function() { };
        fromAnimation.options.domOperation = leaveOp;

        driver({
          from: fromAnimation,
          to: toAnimation
        }).start();

        const leaveAnimation = captureLog.shift();
        const enterAnimation = captureLog.shift();

        expect(leaveAnimation.args[1].onDone).toBe(leaveOp);
        expect(enterAnimation.args[1].onDone).toBeUndefined();
      }));

      it('should fire the returned runner promise when the from, to and anchor animations are all complete',
        inject(($rootElement, $rootScope, $animate) => {

        ss.addRule('.ending-element', 'width:9999px; height:6666px; display:inline-block;');

        const fromAnchor = jqLite('<div></div>');
        from.append(fromAnchor);

        const toAnchor = jqLite('<div></div>');
        to.append(toAnchor);

        $rootElement.append(fromAnchor);
        $rootElement.append(toAnchor);

        let completed = false;
        driver({
          from: fromAnimation,
          to: toAnimation,
          anchors: [{
            'out': fromAnchor,
            'in': toAnchor
          }]
        }).start().then(() => {
          completed = true;
        });

        captureLog.pop().runner.end(); // from
        captureLog.pop().runner.end(); // to
        captureLog.pop().runner.end(); // anchor(out)
        captureLog.pop().runner.end(); // anchor(in)

        $animate.flush();
        $rootScope.$digest();

        expect(completed).toBe(true);
      }));

      it('should use <body> as the element container if the rootElement exists outside of the <body> tag', () => {
        module(($provide) => {
          $provide.factory('$rootElement', ($document) => jqLite($document[0].querySelector('html')));
        });
        inject(($rootElement, $rootScope, $animate, $document) => {
          ss.addRule('.ending-element', 'width:9999px; height:6666px; display:inline-block;');

          const fromAnchor = jqLite('<div></div>');
          from.append(fromAnchor);

          const toAnchor = jqLite('<div></div>');
          to.append(toAnchor);

          $rootElement.append(fromAnchor);
          $rootElement.append(toAnchor);

          const completed = false;
          driver({
            from: fromAnimation,
            to: toAnimation,
            anchors: [{
              'out': fromAnchor,
              'in': toAnchor
            }]
          }).start();

          const clone = captureLog[2].element[0];
          expect(clone.parentNode).toBe($document[0].body);
        });
      });
    });
  });
});
