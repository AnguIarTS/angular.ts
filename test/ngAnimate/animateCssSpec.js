

describe('ngAnimate $animateCss', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  function assertAnimationRunning(element, not) {
    const className = element.attr('class');
    const regex = /\b\w+-active\b/;
    if (not) {
      expect(className).toMatch(regex);
    } else {
      expect(className).not.toMatch(regex);
    }
  }

  function getPossiblyPrefixedStyleValue(element, styleProp) {
    let value = element.css(styleProp);
    if (isUndefined(value)) value = element.css(`-webkit-${  styleProp}`);

    return value;
  }

  function keyframeProgress(element, duration, delay) {
    browserTrigger(element, 'animationend',
      { timeStamp: Date.now() + ((delay || 1) * 1000), elapsedTime: duration });
  }

  function transitionProgress(element, duration, delay) {
    browserTrigger(element, 'transitionend',
      { timeStamp: Date.now() + ((delay || 1) * 1000), elapsedTime: duration });
  }

  function isPromiseLike(p) {
    return !!(p && p.then);
  }

  const fakeStyle = {
    color: 'blue'
  };

  let ss; let triggerAnimationStartFrame;
  beforeEach(module(() => function($document, $sniffer, $$rAF, $animate) {
      ss = createMockStyleSheet($document);

      $animate.enabled(true);
      triggerAnimationStartFrame = function() {
        $$rAF.flush();
      };
    }));

  afterEach(() => {
    if (ss) {
      ss.destroy();
    }
  });

  it('should return false if neither transitions or keyframes are supported by the browser',
    inject(($animateCss, $sniffer, $rootElement, $document) => {

    let animator;
    const element = angular.element('<div></div>');
    $rootElement.append(element);
    angular.element($document[0].body).append($rootElement);

    $sniffer.transitions = $sniffer.animations = false;
    animator = $animateCss(element, {
      duration: 10,
      to: { 'background': 'red' }
    });
    expect(animator.$$willAnimate).toBeFalsy();
  }));

  describe('when active', () => {
    if (!browserSupportsCssAnimations()) return;

    it('should not attempt an animation if animations are globally disabled',
      inject(($animateCss, $animate, $rootElement, $document) => {

      $animate.enabled(false);

      let animator; const element = angular.element('<div></div>');
      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      animator = $animateCss(element, {
        duration: 10,
        to: { 'height': '100px' }
      });

      expect(animator.$$willAnimate).toBeFalsy();
    }));

    it('should silently quit the animation and not throw when an element has no parent during preparation',
      inject(($animateCss, $rootScope, $document, $rootElement) => {

      const element = angular.element('<div></div>');
      expect(() => {
        $animateCss(element, {
          duration: 1000,
          event: 'fake',
          to: fakeStyle
        }).start();
      }).not.toThrow();

      expect(element).not.toHaveClass('fake');
      triggerAnimationStartFrame();
      expect(element).not.toHaveClass('fake-active');
    }));

    it('should silently quit the animation and not throw when an element has no parent before starting',
      inject(($animateCss, $$rAF, $rootScope, $document, $rootElement) => {

      const element = angular.element('<div></div>');
      angular.element($document[0].body).append($rootElement);
      $rootElement.append(element);

      $animateCss(element, {
        duration: 1000,
        addClass: 'wait-for-it',
        to: fakeStyle
      }).start();

      element.remove();

      expect(() => {
        triggerAnimationStartFrame();
      }).not.toThrow();
    }));

    describe('rAF usage', () => {
      it('should buffer all requests into a single requestAnimationFrame call',
        inject(($animateCss, $$rAF, $rootScope, $document, $rootElement) => {

        angular.element($document[0].body).append($rootElement);

        let count = 0;
        const runners = [];
        function makeRequest() {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          const runner = $animateCss(element, { duration: 5, to: fakeStyle }).start();
          runner.then(() => {
            count++;
          });
          runners.push(runner);
        }

        makeRequest();
        makeRequest();
        makeRequest();

        expect(count).toBe(0);

        triggerAnimationStartFrame();
        forEach(runners, (runner) => {
          runner.end();
        });

        $rootScope.$digest();
        expect(count).toBe(3);
      }));

      it('should cancel previous requests to rAF to avoid premature flushing', () => {
        let count = 0;
        module(($provide) => {
          $provide.value('$$rAF', () => function cancellationFn() {
              count++;
            });
        });
        inject(($animateCss, $$rAF, $document, $rootElement) => {
          angular.element($document[0].body).append($rootElement);

          function makeRequest() {
            const element = angular.element('<div></div>');
            $rootElement.append(element);
            $animateCss(element, { duration: 5, to: fakeStyle }).start();
          }

          makeRequest();
          makeRequest();
          makeRequest();
          expect(count).toBe(2);
        });
      });
    });

    describe('animator and runner', () => {
      const animationDuration = 5;
      let element; let animator;
      beforeEach(inject(($animateCss, $rootElement, $document) => {
        element = angular.element('<div></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        animator = $animateCss(element, {
          event: 'enter',
          structural: true,
          duration: animationDuration,
          to: fakeStyle
        });
      }));

      it('should expose start and end functions for the animator object', inject(() => {
        expect(typeof animator.start).toBe('function');
        expect(typeof animator.end).toBe('function');
      }));

      it('should expose end, cancel, resume and pause methods on the runner object', inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();

        expect(typeof runner.end).toBe('function');
        expect(typeof runner.cancel).toBe('function');
        expect(typeof runner.resume).toBe('function');
        expect(typeof runner.pause).toBe('function');
      }));

      it('should start the animation', inject(() => {
        expect(element).not.toHaveClass('ng-enter-active');
        animator.start();
        triggerAnimationStartFrame();

        expect(element).toHaveClass('ng-enter-active');
      }));

      it('should end the animation when called from the animator object', inject(() => {
        animator.start();
        triggerAnimationStartFrame();

        animator.end();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should end the animation when called from the runner object', inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();
        runner.end();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should permanently close the animation if closed before the next rAF runs', inject(() => {
        const runner = animator.start();
        runner.end();

        triggerAnimationStartFrame();
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should return a runner object at the start of the animation that contains a `then` method',
        inject(($rootScope) => {

        const runner = animator.start();
        triggerAnimationStartFrame();

        expect(isPromiseLike(runner)).toBeTruthy();

        let resolved;
        runner.then(() => {
          resolved = true;
        });

        runner.end();
        $rootScope.$digest();
        expect(resolved).toBeTruthy();
      }));

      it('should cancel the animation and reject', inject(($rootScope) => {
        let rejected;
        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.then(noop, () => {
          rejected = true;
        });

        runner.cancel();
        $rootScope.$digest();
        expect(rejected).toBeTruthy();
      }));

      it('should run pause, but not effect the transition animation', inject(() => {
        const blockingDelay = `-${  animationDuration  }s`;

        expect(element.css('transition-delay')).toEqual(blockingDelay);
        const runner = animator.start();
        triggerAnimationStartFrame();

        expect(element.css('transition-delay')).not.toEqual(blockingDelay);
        runner.pause();
        expect(element.css('transition-delay')).not.toEqual(blockingDelay);
      }));

      it('should pause the transition, have no effect, but not end it', inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.pause();

        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now(), elapsedTime: 5 });

        expect(element).toHaveClass('ng-enter-active');
      }));

      it('should resume the animation', inject(() => {
        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.pause();

        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now(), elapsedTime: 5 });

        expect(element).toHaveClass('ng-enter-active');
        runner.resume();

        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should pause and resume a keyframe animation using animation-play-state',
        inject(($animateCss) => {

        element.attr('style', '');
        ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

        animator = $animateCss(element, {
          event: 'enter',
          structural: true
        });

        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.pause();
        expect(getPossiblyPrefixedStyleValue(element, 'animation-play-state')).toEqual('paused');
        runner.resume();
        expect(element.attr('style')).toBeFalsy();
      }));

      it('should remove the animation-play-state style if the animation is closed',
        inject(($animateCss) => {

        element.attr('style', '');
        ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

        animator = $animateCss(element, {
          event: 'enter',
          structural: true
        });

        const runner = animator.start();
        triggerAnimationStartFrame();

        runner.pause();
        expect(getPossiblyPrefixedStyleValue(element, 'animation-play-state')).toEqual('paused');
        runner.end();
        expect(element.attr('style')).toBeFalsy();
      }));
    });

    describe('CSS', () => {
      describe('detected styles', () => {
        let element; let options;

        function assertAnimationComplete(bool) {
          let assert = expect(element);
          if (bool) {
            assert = assert.not;
          }
          assert.toHaveClass('ng-enter');
          assert.toHaveClass('ng-enter-active');
        }

        beforeEach(inject(($rootElement, $document) => {
          element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);
          options = { event: 'enter', structural: true };
        }));

        it('should always return an object even if no animation is detected',
          inject(($animateCss) => {

          ss.addRule('.some-animation', 'background:red;');

          element.addClass('some-animation');
          const animator = $animateCss(element, options);

          expect(animator).toBeTruthy();
          expect(isFunction(animator.start)).toBeTruthy();
          expect(animator.end).toBeTruthy();
          expect(animator.$$willAnimate).toBe(false);
        }));

        it('should close the animation immediately, but still return an animator object if no animation is detected',
          inject(($animateCss) => {

          ss.addRule('.another-fake-animation', 'background:blue;');

          element.addClass('another-fake-animation');
          const animator = $animateCss(element, {
            event: 'enter',
            structural: true
          });

          expect(element).not.toHaveClass('ng-enter');
          expect(isFunction(animator.start)).toBeTruthy();
        }));

        they('should close the animation, but still accept $prop callbacks if no animation is detected',
          ['done', 'then'], (method) => {

          inject(($animateCss, $animate, $rootScope) => {
            ss.addRule('.the-third-fake-animation', 'background:green;');

            element.addClass('another-fake-animation');
            const animator = $animateCss(element, {
              event: 'enter',
              structural: true
            });

            let done = false;
            animator.start()[method](() => {
              done = true;
            });

            expect(done).toBe(false);
            $animate.flush();

            if (method === 'then') {
              $rootScope.$digest();
            }
            expect(done).toBe(true);
          });
        });

        they('should close the animation, but still accept recognize runner.$prop if no animation is detected',
          ['done(cancel)', 'catch'], (method) => {

          inject(($animateCss, $rootScope) => {
            ss.addRule('.the-third-fake-animation', 'background:green;');

            element.addClass('another-fake-animation');
            const animator = $animateCss(element, {
              event: 'enter',
              structural: true
            });

            let cancelled = false;
            const runner = animator.start();

            if (method === 'catch') {
              runner.catch(() => {
                cancelled = true;
              });
            } else {
              runner.done((status) => {
                cancelled = status === false;
              });
            }

            expect(cancelled).toBe(false);
            runner.cancel();

            if (method === 'catch') {
              $rootScope.$digest();
            }
            expect(cancelled).toBe(true);
          });
        });

        it('should use the highest transition duration value detected in the CSS class', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-duration:10s, 15s, 20s;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          transitionProgress(element, 10);
          assertAnimationComplete(false);

          transitionProgress(element, 15);
          assertAnimationComplete(false);

          transitionProgress(element, 20);
          assertAnimationComplete(true);
        }));

        it('should use the highest transition delay value detected in the CSS class', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-delay:10s, 15s, 20s;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          transitionProgress(element, 1, 10);
          assertAnimationComplete(false);

          transitionProgress(element, 1, 15);
          assertAnimationComplete(false);

          transitionProgress(element, 1, 20);
          assertAnimationComplete(true);
        }));

        it('should only close when both the animation delay and duration have passed',
          inject(($animateCss) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s 5s linear all;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          transitionProgress(element, 10, 2);
          assertAnimationComplete(false);

          transitionProgress(element, 9, 6);
          assertAnimationComplete(false);

          transitionProgress(element, 10, 5);
          assertAnimationComplete(true);
        }));

        it('should not close a transition when a child element fires the transitionend event',
          inject(($animateCss) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:4s linear all;');
          ss.addPossiblyPrefixedRule('.non-angular-animation', 'transition:5s linear all;');

          const child = angular.element('<div class="non-angular-animation"></div>');
          element.append(child);

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          browserTrigger(child, 'transitionend', {
            timeStamp: Date.now(),
            elapsedTime: 5,
            bubbles: true
          });

          transitionProgress(element, 1);

          assertAnimationComplete(false);

          transitionProgress(element, 4);
          assertAnimationComplete(true);
        }));

        it('should not close a keyframe animation when a child element fires the animationend event',
          inject(($animateCss) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:animation 4s;');
          ss.addPossiblyPrefixedRule('.non-angular-animation', 'animation:animation 5s;');

          const child = angular.element('<div class="non-angular-animation"></div>');
          element.append(child);

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          browserTrigger(child, 'animationend', {
            timeStamp: Date.now(),
            elapsedTime: 5,
            bubbles: true
          });

          keyframeProgress(element, 1);

          assertAnimationComplete(false);

          keyframeProgress(element, 4);
          assertAnimationComplete(true);
        }));

        it('should use the highest keyframe duration value detected in the CSS class', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:animation 1s, animation 2s, animation 3s;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          keyframeProgress(element, 1);
          assertAnimationComplete(false);

          keyframeProgress(element, 2);
          assertAnimationComplete(false);

          keyframeProgress(element, 3);
          assertAnimationComplete(true);
        }));

        it('should use the highest keyframe delay value detected in the CSS class', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:animation 1s 2s, animation 1s 10s, animation 1s 1000ms;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          keyframeProgress(element, 1, 1);
          assertAnimationComplete(false);

          keyframeProgress(element, 1, 2);
          assertAnimationComplete(false);

          keyframeProgress(element, 1, 10);
          assertAnimationComplete(true);
        }));

        it('should use the highest keyframe duration value detected in the CSS class with respect to the animation-iteration-count property', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter',
                    'animation:animation 1s 2s 3, animation 1s 10s 2, animation 1s 1000ms infinite;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          keyframeProgress(element, 1, 1);
          assertAnimationComplete(false);

          keyframeProgress(element, 1, 2);
          assertAnimationComplete(false);

          keyframeProgress(element, 3, 10);
          assertAnimationComplete(true);
        }));

        it('should use the highest duration value when both transitions and keyframes are used', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-duration:10s, 15s, 20s;' +
                                                  'animation:animation 1s, animation 2s, animation 3s 0s 7;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          transitionProgress(element, 10);
          keyframeProgress(element, 10);
          assertAnimationComplete(false);

          transitionProgress(element, 15);
          keyframeProgress(element, 15);
          assertAnimationComplete(false);

          transitionProgress(element, 20);
          keyframeProgress(element, 20);
          assertAnimationComplete(false);

          // 7 * 3 = 21
          transitionProgress(element, 21);
          keyframeProgress(element, 21);
          assertAnimationComplete(true);
        }));

        it('should use the highest delay value when both transitions and keyframes are used', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-delay:10s, 15s, 20s;' +
                                                  'animation:animation 1s 2s, animation 1s 16s, animation 1s 19s;');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          transitionProgress(element, 1, 10);
          keyframeProgress(element, 1, 10);
          assertAnimationComplete(false);

          transitionProgress(element, 1, 16);
          keyframeProgress(element, 1, 16);
          assertAnimationComplete(false);

          transitionProgress(element, 1, 19);
          keyframeProgress(element, 1, 19);
          assertAnimationComplete(false);

          transitionProgress(element, 1, 20);
          keyframeProgress(element, 1, 20);
          assertAnimationComplete(true);
        }));
      });

      describe('staggering', () => {
        it('should apply a stagger based when an active ng-EVENT-stagger class with a transition-delay is detected',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:0.2s');
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:2s linear all');

          const elements = [];
          let i;
          let elm;

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            elements.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, { event: 'enter', structural: true }).start();
            expect(elm).not.toHaveClass('ng-enter-stagger');
            expect(elm).toHaveClass('ng-enter');
          }

          triggerAnimationStartFrame();

          expect(elements[0]).toHaveClass('ng-enter-active');
          for (i = 1; i < 5; i++) {
            elm = elements[i];

            expect(elm).not.toHaveClass('ng-enter-active');
            $timeout.flush(200);
            expect(elm).toHaveClass('ng-enter-active');

            browserTrigger(elm, 'transitionend',
              { timeStamp: Date.now() + 1000, elapsedTime: 2 });

            expect(elm).not.toHaveClass('ng-enter');
            expect(elm).not.toHaveClass('ng-enter-active');
            expect(elm).not.toHaveClass('ng-enter-stagger');
          }
        }));

        it('should apply a stagger based when for all provided addClass/removeClass CSS classes',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.red-add-stagger,' +
                                     '.blue-remove-stagger,' +
                                     '.green-add-stagger', 'transition-delay:0.2s');

          ss.addPossiblyPrefixedRule('.red-add,' +
                                     '.blue-remove,' +
                                     '.green-add', 'transition:2s linear all');

          const elements = [];
          let i;
          let elm;

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div class="blue"></div>');
            elements.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, {
              addClass: 'red green',
              removeClass: 'blue'
            }).start();
          }

          triggerAnimationStartFrame();
          for (i = 0; i < 5; i++) {
            elm = elements[i];

            expect(elm).not.toHaveClass('red-add-stagger');
            expect(elm).not.toHaveClass('green-add-stagger');
            expect(elm).not.toHaveClass('blue-remove-stagger');

            expect(elm).toHaveClass('red-add');
            expect(elm).toHaveClass('green-add');
            expect(elm).toHaveClass('blue-remove');
          }

          expect(elements[0]).toHaveClass('red-add-active');
          expect(elements[0]).toHaveClass('green-add-active');
          expect(elements[0]).toHaveClass('blue-remove-active');
          for (i = 1; i < 5; i++) {
            elm = elements[i];

            expect(elm).not.toHaveClass('red-add-active');
            expect(elm).not.toHaveClass('green-add-active');
            expect(elm).not.toHaveClass('blue-remove-active');

            $timeout.flush(200);

            expect(elm).toHaveClass('red-add-active');
            expect(elm).toHaveClass('green-add-active');
            expect(elm).toHaveClass('blue-remove-active');

            browserTrigger(elm, 'transitionend',
              { timeStamp: Date.now() + 1000, elapsedTime: 2 });

            expect(elm).not.toHaveClass('red-add-active');
            expect(elm).not.toHaveClass('green-add-active');
            expect(elm).not.toHaveClass('blue-remove-active');

            expect(elm).not.toHaveClass('red-add-stagger');
            expect(elm).not.toHaveClass('green-add-stagger');
            expect(elm).not.toHaveClass('blue-remove-stagger');
          }
        }));

        it('should block the transition animation between start and animate when staggered',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:0.2s');
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:2s linear all;');

          let element;
          let i;
          const elms = [];

          for (i = 0; i < 5; i++) {
            element = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(element);

            $animateCss(element, { event: 'enter', structural: true }).start();
            elms.push(element);
          }

          triggerAnimationStartFrame();
          for (i = 0; i < 5; i++) {
            element = elms[i];
            if (i === 0) {
              expect(element.attr('style')).toBeFalsy();
            } else {
              expect(element.css('transition-delay')).toContain('-2s');
            }
          }
        }));

        it('should block (pause) the keyframe animation between start and animate when staggered',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'animation-delay:0.2s');
          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:my_animation 2s;');

          let i; let element; const elements = [];
          for (i = 0; i < 5; i++) {
            element = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(element);

            $animateCss(element, { event: 'enter', structural: true }).start();
            elements.push(element);
          }

          triggerAnimationStartFrame();

          for (i = 0; i < 5; i++) {
            element = elements[i];
            if (i === 0) { // the first element is always run right away
              expect(element.attr('style')).toBeFalsy();
            } else {
              expect(getPossiblyPrefixedStyleValue(element, 'animation-play-state')).toBe('paused');
            }
          }
        }));

        it('should not apply a stagger if the transition delay value is inherited from a earlier CSS class',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.transition-animation', 'transition:2s 5s linear all;');

          for (let i = 0; i < 5; i++) {
            const element = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(element);

            $animateCss(element, { event: 'enter', structural: true }).start();
            triggerAnimationStartFrame();


            expect(element).toHaveClass('ng-enter-active');
          }
        }));

        it('should apply a stagger only if the transition duration value is zero when inherited from a earlier CSS class',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.transition-animation', 'transition:2s 5s linear all;');
          ss.addPossiblyPrefixedRule('.transition-animation.ng-enter-stagger',
            'transition-duration:0s; transition-delay:0.2s;');

          let element; let i; const elms = [];
          for (i = 0; i < 5; i++) {
            element = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(element);

            elms.push(element);
            $animateCss(element, { event: 'enter', structural: true }).start();
          }

          triggerAnimationStartFrame();
          for (i = 1; i < 5; i++) {
            element = elms[i];
            expect(element).not.toHaveClass('ng-enter-active');
          }
        }));


        it('should ignore animation staggers if only transition animations were detected',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'animation-delay:0.2s');
          ss.addPossiblyPrefixedRule('.transition-animation', 'transition:2s 5s linear all;');

          for (let i = 0; i < 5; i++) {
            const element = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(element);

            $animateCss(element, { event: 'enter', structural: true }).start();
            triggerAnimationStartFrame();


            expect(element).toHaveClass('ng-enter-active');
          }
        }));

        it('should ignore transition staggers if only keyframe animations were detected',
          inject(($animateCss, $document, $rootElement) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:0.2s');
          ss.addPossiblyPrefixedRule('.transition-animation', 'animation: 2s 5s my_animation;');

          for (let i = 0; i < 5; i++) {
            const elm = angular.element('<div class="transition-animation"></div>');
            $rootElement.append(elm);

            const animator = $animateCss(elm, { event: 'enter', structural: true }).start();
            triggerAnimationStartFrame();


            expect(elm).toHaveClass('ng-enter-active');
          }
        }));

        it('should start on the highest stagger value if both transition and keyframe staggers are used together',
          inject(($animateCss, $document, $rootElement, $timeout, $browser) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay: 0.5s; ' +
                                                          'animation-delay: 1s');

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition: 10s linear all; ' +
                                                  'animation: 20s my_animation');

          let i; let elm; const elements = [];
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            elements.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, { event: 'enter', structural: true }).start();

            expect(elm).toHaveClass('ng-enter');
          }

          triggerAnimationStartFrame();

          expect(elements[0]).toHaveClass('ng-enter-active');
          for (i = 1; i < 5; i++) {
            elm = elements[i];

            expect(elm).not.toHaveClass('ng-enter-active');

            $timeout.flush(500);
            expect(elm).not.toHaveClass('ng-enter-active');

            $timeout.flush(500);
            expect(elm).toHaveClass('ng-enter-active');
          }
        }));

        it('should apply the closing timeout ontop of the stagger timeout',
          inject(($animateCss, $document, $rootElement, $timeout, $browser) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:1s;');
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

          let elm; let i; const elms = [];
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            elms.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, { event: 'enter', structural: true }).start();
            triggerAnimationStartFrame();
          }

          for (i = 1; i < 2; i++) {
            elm = elms[i];
            expect(elm).toHaveClass('ng-enter');
            $timeout.flush(1000);
            $timeout.flush(15000);
            expect(elm).not.toHaveClass('ng-enter');
          }
        }));

        it('should apply the closing timeout ontop of the stagger timeout with an added delay',
          inject(($animateCss, $document, $rootElement, $timeout, $browser) => {

          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.ng-enter-stagger', 'transition-delay:1s;');
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all; transition-delay:50s;');

          let elm; let i; const elms = [];
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            elms.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, { event: 'enter', structural: true }).start();
            triggerAnimationStartFrame();
          }

          for (i = 1; i < 2; i++) {
            elm = elms[i];
            expect(elm).toHaveClass('ng-enter');
            $timeout.flush(1000);
            $timeout.flush(65000);
            expect(elm).not.toHaveClass('ng-enter');
          }
        }));

        it('should issue a stagger if a stagger value is provided in the options',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          angular.element($document[0].body).append($rootElement);
          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:2s linear all');

          let elm; let i; const elements = [];
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            elements.push(elm);
            $rootElement.append(elm);

            $animateCss(elm, {
              event: 'enter',
              structural: true,
              stagger: 0.5
            }).start();
            expect(elm).toHaveClass('ng-enter');
          }

          triggerAnimationStartFrame();

          expect(elements[0]).toHaveClass('ng-enter-active');
          for (i = 1; i < 5; i++) {
            elm = elements[i];

            expect(elm).not.toHaveClass('ng-enter-active');
            $timeout.flush(500);
            expect(elm).toHaveClass('ng-enter-active');

            browserTrigger(elm, 'transitionend',
              { timeStamp: Date.now() + 1000, elapsedTime: 2 });

            expect(elm).not.toHaveClass('ng-enter');
            expect(elm).not.toHaveClass('ng-enter-active');
            expect(elm).not.toHaveClass('ng-enter-stagger');
          }
        }));

        it('should only add/remove classes once the stagger timeout has passed',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          angular.element($document[0].body).append($rootElement);

          const element = angular.element('<div class="green"></div>');
          $rootElement.append(element);

          $animateCss(element, {
            addClass: 'red',
            removeClass: 'green',
            duration: 5,
            stagger: 0.5,
            staggerIndex: 3
          }).start();

          triggerAnimationStartFrame();
          expect(element).toHaveClass('green');
          expect(element).not.toHaveClass('red');

          $timeout.flush(1500);
          expect(element).not.toHaveClass('green');
          expect(element).toHaveClass('red');
        }));
      });

      describe('closing timeout', () => {
        it('should close off the animation after 150% of the animation time has passed',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, { event: 'enter', structural: true });
          animator.start();
          triggerAnimationStartFrame();


          expect(element).toHaveClass('ng-enter');
          expect(element).toHaveClass('ng-enter-active');

          $timeout.flush(15000);

          expect(element).not.toHaveClass('ng-enter');
          expect(element).not.toHaveClass('ng-enter-active');
        }));

        it('should close off the animation after 150% of the animation time has passed and consider the detected delay value',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all; transition-delay:30s;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, { event: 'enter', structural: true });
          animator.start();
          triggerAnimationStartFrame();


          expect(element).toHaveClass('ng-enter');
          expect(element).toHaveClass('ng-enter-active');

          $timeout.flush(45000);

          expect(element).not.toHaveClass('ng-enter');
          expect(element).not.toHaveClass('ng-enter-active');
        }));

        it('should still resolve the animation once expired',
          inject(($animateCss, $document, $rootElement, $timeout, $animate, $rootScope) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, { event: 'enter', structural: true });

          let failed; let passed;
          animator.start().then(() => {
              passed = true;
            }, () => {
              failed = true;
            });

          triggerAnimationStartFrame();
          $timeout.flush(15000);
          $animate.flush();
          $rootScope.$digest();
          expect(passed).toBe(true);
        }));

        it('should not resolve/reject after passing if the animation completed successfully',
          inject(($animateCss, $document, $rootElement, $timeout, $rootScope, $animate) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, { event: 'enter', structural: true });

          let failed; let passed;
          animator.start().then(
            () => {
              passed = true;
            },
            () => {
              failed = true;
            }
          );
          triggerAnimationStartFrame();

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 1000, elapsedTime: 10 });

          $animate.flush();
          $rootScope.$digest();

          expect(passed).toBe(true);
          expect(failed).not.toBe(true);

          $timeout.flush(15000);

          expect(passed).toBe(true);
          expect(failed).not.toBe(true);
        }));

        it('should close all stacked animations after the last timeout runs on the same element',
          inject(($animateCss, $document, $rootElement, $timeout, $animate) => {

          let now = 0;
          spyOn(Date, 'now').and.callFake(() => now);

          const cancelSpy = spyOn($timeout, 'cancel').and.callThrough();
          const doneSpy = jasmine.createSpy();

          ss.addPossiblyPrefixedRule('.elm', 'transition:1s linear all;');
          ss.addRule('.elm.red', 'background:red;');
          ss.addPossiblyPrefixedRule('.elm.blue', 'transition:2s linear all; background:blue;');
          ss.addRule('.elm.green', 'background:green;');

          const element = angular.element('<div class="elm"></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          // timeout will be at 1500s
          animate(element, 'red', doneSpy);
          expect(doneSpy).not.toHaveBeenCalled();

          fastForwardClock(500); // 1000s left to go

          // timeout will not be at 500 + 3000s = 3500s
          animate(element, 'blue', doneSpy);
          expect(doneSpy).not.toHaveBeenCalled();
          expect(cancelSpy).toHaveBeenCalled();

          cancelSpy.calls.reset();

          // timeout will not be set again since the former animation is longer
          animate(element, 'green', doneSpy);
          expect(doneSpy).not.toHaveBeenCalled();
          expect(cancelSpy).not.toHaveBeenCalled();

          // this will close the animations fully
          fastForwardClock(3500);
          $animate.flush();

          expect(doneSpy).toHaveBeenCalled();
          expect(doneSpy).toHaveBeenCalledTimes(3);

          function fastForwardClock(time) {
            now += time;
            $timeout.flush(time);
          }

          function animate(element, klass, onDone) {
            const animator = $animateCss(element, { addClass: klass }).start();
            animator.done(onDone);
            triggerAnimationStartFrame();
            return animator;
          }
        }));

        it('should not throw an error any pending timeout requests resolve after the element has already been removed',
          inject(($animateCss, $document, $rootElement, $timeout, $animate) => {

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.red', 'transition:1s linear all;');

          $animateCss(element, { addClass: 'red' }).start();
          triggerAnimationStartFrame();
          element.remove();

          expect(() => {
            $timeout.flush();
          }).not.toThrow();
        }));

        it('should consider a positive options.delay value for the closing timeout',
          inject(($animateCss, $rootElement, $timeout, $document) => {

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const options = {
            delay: 3,
            duration: 3,
            to: {
              height: '100px'
            }
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          // At this point, the animation should still be running (closing timeout is 7500ms ... duration * 1.5 + delay => 7.5)
          $timeout.flush(7000);

          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).toBe('3s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).toBe('3s');

          // Let's flush the remaining amount of time for the timeout timer to kick in
          $timeout.flush(500);

          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).toBeOneOf('', '0s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).toBeOneOf('', '0s');
        }));

        it('should ignore a boolean options.delay value for the closing timeout',
          inject(($animateCss, $rootElement, $timeout, $document) => {

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const options = {
            delay: true,
            duration: 3,
            to: {
              height: '100px'
            }
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          // At this point, the animation should still be running (closing timeout is 4500ms ... duration * 1.5 => 4.5)
          $timeout.flush(4000);

          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).toBeOneOf('initial', '0s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).toBe('3s');

          // Let's flush the remaining amount of time for the timeout timer to kick in
          $timeout.flush(500);

          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).toBeOneOf('', '0s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).toBeOneOf('', '0s');
        }));


        it('should cancel the timeout when the animation is ended normally',
          inject(($animateCss, $document, $rootElement, $timeout) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:10s linear all;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, { event: 'enter', structural: true });
          animator.start();
          triggerAnimationStartFrame();

          expect(element).toHaveClass('ng-enter');
          expect(element).toHaveClass('ng-enter-active');

          animator.end();

          expect(element.data(ANIMATE_TIMER_KEY)).toBeUndefined();
          $timeout.verifyNoPendingTasks();
        }));

      });

      describe('getComputedStyle', () => {
        let count;
        const acceptableTimingsData = {
          transitionDuration: '10s'
        };

        beforeEach(module(($provide) => {
          count = {};
          $provide.value('$window', extend({}, window, {
            document: angular.element(window.document),
            getComputedStyle(node) {
              const key = node.className.indexOf('stagger') >= 0
                  ? 'stagger' : 'normal';
              count[key] = count[key] || 0;
              count[key]++;
              return acceptableTimingsData;
            }
          }));

          return function($document, $rootElement) {
            angular.element($document[0].body).append($rootElement);
          };
        }));

        it('should cache frequent calls to getComputedStyle before the next animation frame kicks in',
          inject(($animateCss, $document, $rootElement) => {

          let i; let elm; let animator;
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            const runner = animator.start();
          }

          expect(count.normal).toBe(1);

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            animator.start();
          }

          expect(count.normal).toBe(1);
          triggerAnimationStartFrame();

          expect(count.normal).toBe(2);

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            animator.start();
          }

          expect(count.normal).toBe(3);
        }));

        it('should cache frequent calls to getComputedStyle for stagger animations before the next animation frame kicks in',
          inject(($animateCss, $document, $rootElement, $$rAF) => {

          const element = angular.element('<div></div>');
          $rootElement.append(element);
          let animator = $animateCss(element, { event: 'enter', structural: true });
          animator.start();
          triggerAnimationStartFrame();

          expect(count.stagger).toBeUndefined();

          let i; let elm;
          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            animator.start();
          }

          expect(count.stagger).toBe(1);

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            animator.start();
          }

          expect(count.stagger).toBe(1);
          $$rAF.flush();

          for (i = 0; i < 5; i++) {
            elm = angular.element('<div></div>');
            $rootElement.append(elm);
            animator = $animateCss(elm, { event: 'enter', structural: true });
            animator.start();
          }

          triggerAnimationStartFrame();
          expect(count.stagger).toBe(2);
        }));
      });

      describe('transitionend/animationend event listeners', () => {
        let element; let elementOnSpy; let elementOffSpy; let progress;

        function setStyles(event) {
          switch (event) {
            case TRANSITIONEND_EVENT:
              ss.addPossiblyPrefixedRule('.ng-enter', 'transition: 10s linear all;');
              progress = transitionProgress;
              break;
            case ANIMATIONEND_EVENT:
              ss.addPossiblyPrefixedRule('.ng-enter', 'animation: animation 10s;');
              progress = keyframeProgress;
              break;
          }
        }

        beforeEach(inject(($rootElement, $document) => {
          element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          elementOnSpy = spyOn(element, 'on').and.callThrough();
          elementOffSpy = spyOn(element, 'off').and.callThrough();
        }));

        they('should remove the $prop event listeners on cancel',
          [TRANSITIONEND_EVENT, ANIMATIONEND_EVENT], (event) => {
            inject(($animateCss) => {

              setStyles(event);

              const animator = $animateCss(element, {
                event: 'enter',
                structural: true
              });

              const runner = animator.start();
              triggerAnimationStartFrame();

              expect(elementOnSpy).toHaveBeenCalledOnce();
              expect(elementOnSpy.calls.mostRecent().args[0]).toBe(event);

              runner.cancel();

              expect(elementOffSpy).toHaveBeenCalledOnce();
              expect(elementOffSpy.calls.mostRecent().args[0]).toBe(event);
            });
        });

        they('should remove the $prop event listener when the animation is closed',
          [TRANSITIONEND_EVENT, ANIMATIONEND_EVENT], (event) => {
            inject(($animateCss) => {

              setStyles(event);

              const animator = $animateCss(element, {
                event: 'enter',
                structural: true
              });

              const runner = animator.start();
              triggerAnimationStartFrame();

              expect(elementOnSpy).toHaveBeenCalledOnce();
              expect(elementOnSpy.calls.mostRecent().args[0]).toBe(event);

              progress(element, 10);

              expect(elementOffSpy).toHaveBeenCalledOnce();
              expect(elementOffSpy.calls.mostRecent().args[0]).toBe(event);
            });
        });

        they('should remove the $prop event listener when the closing timeout occurs',
          [TRANSITIONEND_EVENT, ANIMATIONEND_EVENT], (event) => {
            inject(($animateCss, $timeout) => {

              setStyles(event);

              const animator = $animateCss(element, {
                event: 'enter',
                structural: true
              });

              animator.start();
              triggerAnimationStartFrame();

              expect(elementOnSpy).toHaveBeenCalledOnce();
              expect(elementOnSpy.calls.mostRecent().args[0]).toBe(event);

              $timeout.flush(15000);

              expect(elementOffSpy).toHaveBeenCalledOnce();
              expect(elementOffSpy.calls.mostRecent().args[0]).toBe(event);
            });
        });

        they('should not add or remove $prop event listeners when no animation styles are detected',
          [TRANSITIONEND_EVENT, ANIMATIONEND_EVENT], (event) => {
            inject(($animateCss, $timeout) => {

              progress = event === TRANSITIONEND_EVENT ? transitionProgress : keyframeProgress;

              // Make sure other event listeners are not affected
              const otherEndSpy = jasmine.createSpy('otherEndSpy');
              element.on(event, otherEndSpy);

              expect(elementOnSpy).toHaveBeenCalledOnce();
              elementOnSpy.calls.reset();

              const animator = $animateCss(element, {
                event: 'enter',
                structural: true
              });

              expect(animator.$$willAnimate).toBeFalsy();

              // This will close the animation because no styles have been detected
              const runner = animator.start();
              triggerAnimationStartFrame();

              expect(elementOnSpy).not.toHaveBeenCalled();
              expect(elementOffSpy).not.toHaveBeenCalled();

              progress(element, 10);
              expect(otherEndSpy).toHaveBeenCalledOnce();
            });
        });

      });
    });

    it('should avoid applying the same cache to an element a follow-up animation is run on the same element',
      inject(($animateCss, $rootElement, $document) => {

      function endTransition(element, elapsedTime) {
        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now(), elapsedTime });
      }

      function startAnimation(element, duration, color) {
        $animateCss(element, {
          duration,
          to: { background: color }
        }).start();
        triggerAnimationStartFrame();
      }

      const element = angular.element('<div></div>');
      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      startAnimation(element, 0.5, 'red');
      expect(element.attr('style')).toContain('transition');

      endTransition(element, 0.5);
      expect(element.attr('style')).not.toContain('transition');

      startAnimation(element, 0.8, 'blue');
      expect(element.attr('style')).toContain('transition');

      // Trigger an extra transitionend event that matches the original transition
      endTransition(element, 0.5);
      expect(element.attr('style')).toContain('transition');

      endTransition(element, 0.8);
      expect(element.attr('style')).not.toContain('transition');
    }));

    it('should clear cache if no animation so follow-up animation on the same element will not be from cache',
      inject(($animateCss, $rootElement, $document, $$rAF) => {
        const element = angular.element('<div class="rclass"></div>');
        const options = {
          event: 'enter',
          structural: true
        };
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);
        let animator = $animateCss(element, options);
        expect(animator.$$willAnimate).toBeFalsy();

        $$rAF.flush();
        ss.addPossiblyPrefixedRule('.ng-enter', 'animation:3.5s keyframe_animation;');
        animator = $animateCss(element, options);
        expect(animator.$$willAnimate).toBeTruthy();
    }));

    it('should apply a custom temporary class when a non-structural animation is used',
      inject(($animateCss, $rootElement, $document) => {

      const element = angular.element('<div></div>');
      $rootElement.append(element);
      angular.element($document[0].body).append($rootElement);

      $animateCss(element, {
        event: 'super',
        duration: 1000,
        to: fakeStyle
      }).start();
      expect(element).toHaveClass('super');

      triggerAnimationStartFrame();
      expect(element).toHaveClass('super-active');
    }));

    describe('structural animations', () => {
      they('should decorate the element with the ng-$prop CSS class',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          $animateCss(element, {
            event,
            structural: true,
            duration: 1000,
            to: fakeStyle
          });
          expect(element).toHaveClass(`ng-${  event}`);
        });
      });

      they('should decorate the element with the ng-$prop-active CSS class',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, {
            event,
            structural: true,
            duration: 1000,
            to: fakeStyle
          });

          animator.start();
          triggerAnimationStartFrame();

          expect(element).toHaveClass(`ng-${  event  }-active`);
        });
      });

      they('should remove the ng-$prop and ng-$prop-active CSS classes from the element once the animation is done',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const animator = $animateCss(element, {
            event,
            structural: true,
            duration: 1,
            to: fakeStyle
          });

          animator.start();
          triggerAnimationStartFrame();


          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 1000, elapsedTime: 1 });

          expect(element).not.toHaveClass(`ng-${  event}`);
          expect(element).not.toHaveClass(`ng-${  event  }-active`);
        });
      });

      they('should allow additional CSS classes to be added and removed alongside the $prop animation',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement) => {
          const element = angular.element('<div class="green"></div>');
          $rootElement.append(element);
          const animator = $animateCss(element, {
            event,
            structural: true,
            duration: 1,
            to: fakeStyle,
            addClass: 'red',
            removeClass: 'green'
          });

          animator.start();
          triggerAnimationStartFrame();

          expect(element).toHaveClass(`ng-${  event}`);
          expect(element).toHaveClass(`ng-${  event  }-active`);

          expect(element).toHaveClass('red');
          expect(element).toHaveClass('red-add');
          expect(element).toHaveClass('red-add-active');

          expect(element).not.toHaveClass('green');
          expect(element).toHaveClass('green-remove');
          expect(element).toHaveClass('green-remove-active');
        });
      });

      they('should place a CSS transition block after the preparation function to block accidental style changes',
        ['enter', 'leave', 'move', 'addClass', 'removeClass'], (event) => {

        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.cool-animation', 'transition:1.5s linear all;');
          element.addClass('cool-animation');

          const data = {};
          if (event === 'addClass') {
            data.addClass = 'green';
          } else if (event === 'removeClass') {
            element.addClass('red');
            data.removeClass = 'red';
          } else {
            data.event = event;
          }

          const animator = $animateCss(element, data);
          expect(element.css('transition-delay')).toMatch('-1.5s');
          animator.start();
          triggerAnimationStartFrame();

          expect(element.attr('style')).toBeFalsy();
        });
      });

      they('should not place a CSS transition block if options.skipBlocking is provided',
        ['enter', 'leave', 'move', 'addClass', 'removeClass'], (event) => {

        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.cool-animation', 'transition:1.5s linear all;');
          element.addClass('cool-animation');

          const data = {};
          if (event === 'addClass') {
            data.addClass = 'green';
          } else if (event === 'removeClass') {
            element.addClass('red');
            data.removeClass = 'red';
          } else {
            data.event = event;
          }

          const blockSpy = spyOn(helpers, 'blockTransitions').and.callThrough();

          data.skipBlocking = true;
          const animator = $animateCss(element, data);

          expect(blockSpy).not.toHaveBeenCalled();

          expect(element.attr('style')).toBeFalsy();
          animator.start();
          triggerAnimationStartFrame();

          expect(element.attr('style')).toBeFalsy();

          // just to prove it works
          data.skipBlocking = false;
          $animateCss(element, { addClass: 'test' });
          expect(blockSpy).toHaveBeenCalled();
        });
      });

      they('should place a CSS transition block after the preparation function even if a duration is provided',
        ['enter', 'leave', 'move', 'addClass', 'removeClass'], (event) => {

        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          ss.addPossiblyPrefixedRule('.cool-animation', 'transition:1.5s linear all;');
          element.addClass('cool-animation');

          const data = {};
          if (event === 'addClass') {
            data.addClass = 'green';
          } else if (event === 'removeClass') {
            element.addClass('red');
            data.removeClass = 'red';
          } else {
            data.event = event;
          }

          data.duration = 10;
          const animator = $animateCss(element, data);

          expect(element.css('transition-delay')).toMatch('-10s');
          expect(element.css('transition-duration')).toMatch('');
          animator.start();
          triggerAnimationStartFrame();


          expect(element.attr('style')).not.toContain('transition-delay');
          expect(element.css('transition-property')).toContain('all');
          expect(element.css('transition-duration')).toContain('10s');
        });
      });

      it('should allow multiple events to be animated at the same time',
        inject(($animateCss, $rootElement, $document) => {

        const element = angular.element('<div></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);

        $animateCss(element, {
          event: ['enter', 'leave', 'move'],
          structural: true,
          duration: 1,
          to: fakeStyle
        }).start();
        triggerAnimationStartFrame();


        expect(element).toHaveClass('ng-enter');
        expect(element).toHaveClass('ng-leave');
        expect(element).toHaveClass('ng-move');

        expect(element).toHaveClass('ng-enter-active');
        expect(element).toHaveClass('ng-leave-active');
        expect(element).toHaveClass('ng-move-active');

        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now() + 1000, elapsedTime: 1 });

        expect(element).not.toHaveClass('ng-enter');
        expect(element).not.toHaveClass('ng-leave');
        expect(element).not.toHaveClass('ng-move');
        expect(element).not.toHaveClass('ng-enter-active');
        expect(element).not.toHaveClass('ng-leave-active');
        expect(element).not.toHaveClass('ng-move-active');
      }));

      it('should not break when running anchored animations without duration',
        inject(($animate, $document, $rootElement) => {
          const element1 = angular.element('<div class="item" ng-animate-ref="test">Item 1</div>');
          const element2 = angular.element('<div class="item" ng-animate-ref="test">Item 2</div>');

          angular.element($document[0].body).append($rootElement);
          $rootElement.append(element1);

          expect($rootElement.text()).toBe('Item 1');

          $animate.leave(element1);
          $animate.enter(element2, $rootElement);
          $animate.flush();

          expect($rootElement.text()).toBe('Item 2');
        })
      );
    });

    describe('class-based animations', () => {
      they('should decorate the element with the class-$prop CSS class',
        ['add', 'remove'], (event) => {
        inject(($animateCss, $rootElement) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {};
          options[`${event  }Class`] = 'class';
          options.duration = 1000;
          options.to = fakeStyle;
          $animateCss(element, options);
          expect(element).toHaveClass(`class-${  event}`);
        });
      });

      they('should decorate the element with the class-$prop-active CSS class',
        ['add', 'remove'], (event) => {
        inject(($animateCss, $rootElement) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {};
          options[`${event  }Class`] = 'class';
          options.duration = 1000;
          options.to = fakeStyle;
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(element).toHaveClass(`class-${  event  }-active`);
        });
      });

      they('should remove the class-$prop-add and class-$prop-active CSS classes from the element once the animation is done',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement, $document) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const options = {};
          options.event = event;
          options.duration = 10;
          options.to = fakeStyle;

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 1000, elapsedTime: 10 });

          expect(element).not.toHaveClass(`ng-${  event}`);
          expect(element).not.toHaveClass(`ng-${  event  }-active`);
        });
      });

      they('should allow the class duration styles to be recalculated once started if the CSS classes being applied result new transition styles',
        ['add', 'remove'], (event) => {
        inject(($animateCss, $rootElement, $document) => {

          const element = angular.element('<div></div>');

          if (event === 'add') {
            ss.addPossiblyPrefixedRule('.natural-class', 'transition:1s linear all;');
          } else {
            ss.addPossiblyPrefixedRule('.natural-class', 'transition:0s linear none;');
            ss.addPossiblyPrefixedRule('.base-class', 'transition:1s linear none;');

            element.addClass('base-class');
            element.addClass('natural-class');
          }

          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const options = {};
          options[`${event  }Class`] = 'natural-class';
          const runner = $animateCss(element, options);
          runner.start();
          triggerAnimationStartFrame();

          expect(element).toHaveClass(`natural-class-${  event}`);
          expect(element).toHaveClass(`natural-class-${  event  }-active`);

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now(), elapsedTime: 1 });

          expect(element).not.toHaveClass(`natural-class-${  event}`);
          expect(element).not.toHaveClass(`natural-class-${  event  }-active`);
        });
      });

      they('should force the class-based values to be applied early if no options.applyClassEarly is used as an option',
        ['enter', 'leave', 'move'], (event) => {
        inject(($animateCss, $rootElement, $document) => {

          ss.addPossiblyPrefixedRule(`.blue.ng-${  event}`, 'transition:2s linear all;');

          const element = angular.element('<div class="red"></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);

          const runner = $animateCss(element, {
            addClass: 'blue',
            applyClassesEarly: true,
            removeClass: 'red',
            event,
            structural: true
          });

          runner.start();
          expect(element).toHaveClass(`ng-${  event}`);
          expect(element).toHaveClass('blue');
          expect(element).not.toHaveClass('red');

          triggerAnimationStartFrame();
          expect(element).toHaveClass(`ng-${  event}`);
          expect(element).toHaveClass(`ng-${  event  }-active`);
          expect(element).toHaveClass('blue');
          expect(element).not.toHaveClass('red');

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now(), elapsedTime: 2 });

          expect(element).not.toHaveClass(`ng-${  event}`);
          expect(element).not.toHaveClass(`ng-${  event  }-active`);
          expect(element).toHaveClass('blue');
          expect(element).not.toHaveClass('red');
        });
      });
    });

    describe('options', () => {
      let element;
      beforeEach(module(() => function($rootElement, $document) {
          angular.element($document[0].body).append($rootElement);

          element = angular.element('<div></div>');
          $rootElement.append(element);
        }));

      it('should not alter the provided options input in any way throughout the animation', inject(($animateCss) => {
        const initialOptions = {
          from: { height: '50px' },
          to: { width: '50px' },
          addClass: 'one',
          removeClass: 'two',
          duration: 10,
          delay: 10,
          structural: true,
          keyframeStyle: '1s rotate',
          transitionStyle: '1s linear',
          stagger: 0.5,
          staggerIndex: 3
        };

        const copiedOptions = copy(initialOptions);
        expect(copiedOptions).toEqual(initialOptions);

        const animator = $animateCss(element, copiedOptions);
        expect(copiedOptions).toEqual(initialOptions);

        const runner = animator.start();
        expect(copiedOptions).toEqual(initialOptions);

        triggerAnimationStartFrame();
        expect(copiedOptions).toEqual(initialOptions);

        runner.end();
        expect(copiedOptions).toEqual(initialOptions);
      }));

      it('should not create a copy of the provided options if they have already been prepared earlier',
        inject(($animate, $animateCss) => {

        const options = {
          from: { height: '50px' },
          to: { width: '50px' },
          addClass: 'one',
          removeClass: 'two'
        };

        options.$$prepared = true;
        const runner = $animateCss(element, options).start();
        runner.end();

        $animate.flush();

        expect(options.addClass).toBeFalsy();
        expect(options.removeClass).toBeFalsy();
        expect(options.to).toBeFalsy();
        expect(options.from).toBeFalsy();
      }));

      describe('[$$skipPreparationClasses]', () => {
        it('should not apply and remove the preparation classes to the element when true',
          inject(($animateCss) => {

          const options = {
            duration: 3000,
            to: fakeStyle,
            event: 'event',
            structural: true,
            addClass: 'klass',
            $$skipPreparationClasses: true
          };

          const animator = $animateCss(element, options);

          expect(element).not.toHaveClass('klass-add');
          expect(element).not.toHaveClass('ng-event');

          const runner = animator.start();
          triggerAnimationStartFrame();

          expect(element).not.toHaveClass('klass-add');
          expect(element).not.toHaveClass('ng-event');

          expect(element).toHaveClass('klass-add-active');
          expect(element).toHaveClass('ng-event-active');

          element.addClass('klass-add ng-event');

          runner.end();

          expect(element).toHaveClass('klass-add');
          expect(element).toHaveClass('ng-event');

          expect(element).not.toHaveClass('klass-add-active');
          expect(element).not.toHaveClass('ng-event-active');
        }));
      });

      describe('[duration]', () => {
        it('should be applied for a transition directly', inject(($animateCss, $rootElement) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            duration: 3000,
            to: fakeStyle,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(style).toContain('3000s');
          expect(style).toContain('linear');
        }));

        it('should be applied to a CSS keyframe animation directly if keyframes are detected within the CSS class',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

          const options = {
            duration: 5,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(getPossiblyPrefixedStyleValue(element, 'animation-duration')).toEqual('5s');
        }));

        it('should remove all inline keyframe styling when an animation completes if a custom duration was applied',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

          const options = {
            duration: 5,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          browserTrigger(element, 'animationend',
            { timeStamp: Date.now() + 5000, elapsedTime: 5 });

          expect(element.attr('style')).toBeFalsy();
        }));

        it('should remove all inline keyframe delay styling when an animation completes if a custom duration was applied',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

          const options = {
            delay: 5,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('5s');

          browserTrigger(element, 'animationend',
            { timeStamp: Date.now() + 5000, elapsedTime: 1.5 });

          expect(element.attr('style')).toBeFalsy();
        }));

        it('should not prepare the animation at all if a duration of zero is provided',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;');

          const options = {
            duration: 0,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          expect(animator.$$willAnimate).toBeFalsy();
        }));

        it('should apply a transition and keyframe duration directly if both transitions and keyframe classes are detected',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:3s keyframe_animation;' +
                                                  'transition:5s linear all;');

          const options = {
            duration: 4,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(style).toMatch(/animation(?:-duration)?:\s*4s/);
          expect(element.css('transition-duration')).toMatch('4s');
          expect(element.css('transition-property')).toMatch('all');
          expect(style).toContain('linear');
        }));
      });

      describe('[delay]', () => {
        it('should be applied for a transition directly', inject(($animateCss, $rootElement) => {
          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            duration: 3000,
            delay: 500,
            to: fakeStyle,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          const prop = element.css('transition-delay');
          expect(prop).toEqual('500s');
        }));

        it('should return false for the animator if a delay is provided but not a duration',
          inject(($animateCss, $rootElement) => {

          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            delay: 500,
            to: fakeStyle,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);
          expect(animator.$$willAnimate).toBeFalsy();
        }));

        it('should override the delay value present in the CSS class',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-delay:10s;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            delay: 500,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          const prop = element.css('transition-delay');
          expect(prop).toEqual('500s');
        }));

        it('should allow the delay value to zero if provided',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:1s linear all;' +
                                                  'transition-delay:10s;');

          const element = angular.element('<div></div>');
          $rootElement.append(element);

          const options = {
            delay: 0,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          const prop = element.css('transition-delay');
          expect(prop).toEqual('0s');
        }));

        it('should be applied to a CSS keyframe animation if detected within the CSS class',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:1.5s keyframe_animation;');

          const options = {
            delay: 400,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('400s');
          expect(element.attr('style')).not.toContain('transition-delay');
        }));

        it('should apply a transition and keyframe delay if both transitions and keyframe classes are detected',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:3s keyframe_animation;' +
                                                  'transition:5s linear all;');

          const options = {
            delay: 10,
            event: 'enter',
            structural: true
          };
          const animator = $animateCss(element, options);

          expect(element.css('transition-delay')).toContain('-5s');
          expect(element.attr('style')).not.toContain('animation-delay');
          animator.start();
          triggerAnimationStartFrame();


          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('10s');
          expect(element.css('transition-delay')).toEqual('10s');
        }));

        it('should apply the keyframe and transition duration value before the CSS classes are applied', () => {
          let classSpy = jasmine.createSpy();
          module(($provide) => {
            $provide.value('$$jqLite', {
              addClass() {
                classSpy();
              },
              removeClass() {
                classSpy();
              }
            });
          });
          inject(($animateCss, $rootElement) => {
            element.addClass('element');
            ss.addPossiblyPrefixedRule('.element', 'animation:3s keyframe_animation;' +
                                                   'transition:5s linear all;');

            const options = {
              delay: 2,
              duration: 2,
              addClass: 'superman',
              $$skipPreparationClasses: true,
              structural: true
            };
            const animator = $animateCss(element, options);

            expect(element.attr('style') || '').not.toContain('animation-delay');
            expect(element.attr('style') || '').not.toContain('transition-delay');
            expect(classSpy).not.toHaveBeenCalled();

            // redefine the classSpy to assert that the delay values have been
            // applied before the classes are added
            let assertionsRun = false;
            classSpy = function() {
              assertionsRun = true;
              expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('2s');
              expect(element.css('transition-delay')).toEqual('2s');
              expect(element).not.toHaveClass('superman');
            };

            animator.start();
            triggerAnimationStartFrame();
            expect(assertionsRun).toBe(true);
          });
        });

        it('should apply blocking before the animation starts, but then apply the detected delay when options.delay is true',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition:2s linear all; transition-delay: 1s;');

          const options = {
            delay: true,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);
          expect(element.css('transition-delay')).toEqual('-2s');

          animator.start();
          triggerAnimationStartFrame();

          expect(element.attr('style') || '').not.toContain('transition-delay');
        }));

        it('should consider a negative value when delay:true is used with a keyframe animation',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation: 2s keyframe_animation; ' +
                                                  'animation-delay: -1s;');

          const options = {
            delay: true,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toContain('-1s');
        }));

        they('should consider a negative value when a negative option delay is provided for a $prop animation', {
          'transition': function() {
            return {
              prop: 'transition-delay',
              css: 'transition:2s linear all'
            };
          },
          'keyframe': function() {
            return {
              prop: 'animation-delay',
              css: 'animation: 2s keyframe_animation'
            };
          }
        }, (testDetailsFactory) => {
          inject(($animateCss, $rootElement) => {
            const testDetails = testDetailsFactory();

            ss.addPossiblyPrefixedRule('.ng-enter', testDetails.css);
            const options = {
              delay: -2,
              event: 'enter',
              structural: true
            };

            const animator = $animateCss(element, options);

            animator.start();
            triggerAnimationStartFrame();

            expect(getPossiblyPrefixedStyleValue(element, testDetails.prop)).toContain('-2s');
          });
        });

        they('should expect the $propend event to always return the full duration even when negative values are used', {
          'transition': function() {
            return {
              event: 'transitionend',
              css: 'transition:5s linear all; transition-delay: -2s'
            };
          },
          'animation': function() {
            return {
              event: 'animationend',
              css: 'animation: 5s keyframe_animation; animation-delay: -2s;'
            };
          }
        }, (testDetailsFactory) => {
          inject(($animateCss, $rootElement) => {
            const testDetails = testDetailsFactory();
            const {event} = testDetails;

            ss.addPossiblyPrefixedRule('.ng-enter', testDetails.css);
            const options = { event: 'enter', structural: true };

            const animator = $animateCss(element, options);
            animator.start();
            triggerAnimationStartFrame();

            // 5 + (-2s) = 3
            browserTrigger(element, event, { timeStamp: Date.now(), elapsedTime: 3 });

            assertAnimationRunning(element, true);

            // 5 seconds is the full animation
            browserTrigger(element, event, { timeStamp: Date.now(), elapsedTime: 5 });

            assertAnimationRunning(element);
          });
        });
      });

      describe('[transitionStyle]', () => {
        it('should apply the transition directly onto the element and animate accordingly',
          inject(($animateCss, $rootElement) => {

          const options = {
            transitionStyle: '5.5s linear all',
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();


          const style = element.attr('style');
          expect(element.css('transition-duration')).toMatch('5.5s');
          expect(element.css('transition-property')).toMatch('all');
          expect(style).toContain('linear');

          expect(element).toHaveClass('ng-enter');
          expect(element).toHaveClass('ng-enter-active');

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 10000, elapsedTime: 5.5 });

          expect(element).not.toHaveClass('ng-enter');
          expect(element).not.toHaveClass('ng-enter-active');

          expect(element.attr('style')).toBeFalsy();
        }));

        it('should give priority to the provided duration value, but only update the duration style itself',
          inject(($animateCss, $rootElement) => {

          const options = {
            transitionStyle: '5.5s ease-in color',
            duration: 4,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(element.css('transition-duration')).toMatch('4s');
          expect(element.css('transition-property')).toMatch('color');
          expect(style).toContain('ease-in');
        }));

        it('should give priority to the provided delay value, but only update the delay style itself',
          inject(($animateCss, $rootElement) => {

          const options = {
            transitionStyle: '5.5s 4s ease-in color',
            delay: 20,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(element.css('transition-delay')).toMatch('20s');
          expect(element.css('transition-duration')).toMatch('5.5s');
          expect(element.css('transition-property')).toMatch('color');
          expect(style).toContain('ease-in');
        }));

        it('should execute the animation only if there is any provided CSS styling to go with the transition',
          inject(($animateCss, $rootElement) => {

          const options = {
            transitionStyle: '6s 4s ease-out all'
          };

          $animateCss(element, options).start();
          triggerAnimationStartFrame();

          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).not.toEqual('4s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).not.toEqual('6s');

          options.to = { color: 'brown' };
          $animateCss(element, options).start();
          triggerAnimationStartFrame();

          expect(getPossiblyPrefixedStyleValue(element, 'transition-delay')).toEqual('4s');
          expect(getPossiblyPrefixedStyleValue(element, 'transition-duration')).toEqual('6s');
        }));
      });

      describe('[keyframeStyle]', () => {
        it('should apply the keyframe animation directly onto the element and animate accordingly',
          inject(($animateCss, $rootElement) => {

          const options = {
            keyframeStyle: 'my_animation 5.5s',
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();


          const detectedStyle = element.attr('style');
          expect(detectedStyle).toContain('5.5s');
          expect(detectedStyle).toContain('my_animation');

          expect(element).toHaveClass('ng-enter');
          expect(element).toHaveClass('ng-enter-active');

          browserTrigger(element, 'animationend',
            { timeStamp: Date.now() + 10000, elapsedTime: 5.5 });

          expect(element).not.toHaveClass('ng-enter');
          expect(element).not.toHaveClass('ng-enter-active');

          expect(element.attr('style')).toBeFalsy();
        }));

        it('should give priority to the provided duration value, but only update the duration style itself',
          inject(($animateCss, $rootElement) => {

          const options = {
            keyframeStyle: 'my_animation 5.5s',
            duration: 50,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();


          const detectedStyle = element.attr('style');
          expect(detectedStyle).toContain('50s');
          expect(detectedStyle).toContain('my_animation');
        }));

        it('should give priority to the provided delay value, but only update the duration style itself',
          inject(($animateCss, $rootElement) => {

          const options = {
            keyframeStyle: 'my_animation 5.5s 10s',
            delay: 50,
            event: 'enter',
            structural: true
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();


          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('50s');
          expect(getPossiblyPrefixedStyleValue(element, 'animation-duration')).toEqual('5.5s');
          expect(getPossiblyPrefixedStyleValue(element, 'animation-name')).toEqual('my_animation');
        }));

        it('should be able to execute the animation if it is the only provided value',
          inject(($animateCss, $rootElement) => {

          const options = {
            keyframeStyle: 'my_animation 5.5s 10s'
          };

          const animator = $animateCss(element, options);

          animator.start();
          triggerAnimationStartFrame();

          expect(getPossiblyPrefixedStyleValue(element, 'animation-delay')).toEqual('10s');
          expect(getPossiblyPrefixedStyleValue(element, 'animation-duration')).toEqual('5.5s');
          expect(getPossiblyPrefixedStyleValue(element, 'animation-name')).toEqual('my_animation');
        }));
      });

      describe('[from] and [to]', () => {
        it('should apply from styles to an element during the preparation phase',
          inject(($animateCss, $rootElement) => {

          const options = {
            duration: 2.5,
            event: 'enter',
            structural: true,
            from: { width: '50px' },
            to: { width: '100px' }
          };

          const animator = $animateCss(element, options);
          expect(element.attr('style')).toMatch(/width:\s*50px/);
        }));

        it('should apply to styles to an element during the animation phase',
          inject(($animateCss, $rootElement) => {

          const options = {
            duration: 2.5,
            event: 'enter',
            structural: true,
            from: { width: '15px' },
            to: { width: '25px' }
          };

          const animator = $animateCss(element, options);
          const runner = animator.start();
          triggerAnimationStartFrame();
          runner.end();

          expect(element.css('width')).toBe('25px');
        }));

        it('should apply the union of from and to styles to the element if no animation will be run',
          inject(($animateCss, $rootElement) => {

          const options = {
            event: 'enter',
            structural: true,
            from: { 'width': '10px', height: '50px' },
            to: { 'width': '15px' }
          };

          const animator = $animateCss(element, options);

          expect(animator.$$willAnimate).toBeFalsy();
          animator.start();

          expect(element.css('width')).toBe('15px');
          expect(element.css('height')).toBe('50px');
        }));

        it('should retain to and from styles on an element after an animation completes',
          inject(($animateCss, $rootElement) => {

          const options = {
            event: 'enter',
            structural: true,
            duration: 10,
            from: { 'width': '10px', height: '66px' },
            to: { 'width': '5px' }
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 10000, elapsedTime: 10 });

          expect(element).not.toHaveClass('ng-enter');
          expect(element.css('width')).toBe('5px');
          expect(element.css('height')).toBe('66px');
        }));

        it('should always apply the from styles before the start function is called even if no transition is detected when started',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.my-class', 'transition: 0s linear color');

          const options = {
            addClass: 'my-class',
            from: { height: '26px' },
            to: { height: '500px' }
          };

          const animator = $animateCss(element, options);
          expect(element.css('height')).toBe('26px');

          animator.start();
          triggerAnimationStartFrame();

          expect(element.css('height')).toBe('500px');
        }));

        it('should apply an inline transition if [to] styles and a duration are provided',
          inject(($animateCss, $rootElement) => {

          const options = {
            event: 'enter',
            structural: true,
            duration: 2.5,
            to: { background: 'red' }
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          const style = element.attr('style');
          expect(element.css('transition-duration')).toMatch('2.5s');
          expect(element.css('transition-property')).toMatch('all');
          expect(style).toContain('linear');
        }));

        it('should remove all inline transition styling when an animation completes',
          inject(($animateCss, $rootElement) => {

          const options = {
            event: 'enter',
            structural: true,
            duration: 2.5,
            to: { background: 'red' }
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          let style = element.attr('style');
          expect(style).toContain('transition');

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 2500, elapsedTime: 2.5 });

          style = element.attr('style');
          expect(style).not.toContain('transition');
        }));

        it('should retain existing styles when an inline styled animation completes',
          inject(($animateCss, $rootElement) => {

          const options = {
            event: 'enter',
            structural: true,
            duration: 2.5
          };

          element.css('font-size', '20px');
          element.css('opacity', '0.5');

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();

          let style = element.attr('style');
          expect(style).toContain('transition');
          animator.end();

          style = element.attr('style');
          expect(element.attr('style')).not.toContain('transition');
          expect(element.css('opacity')).toEqual('0.5');
        }));

        it('should remove all inline transition delay styling when an animation completes',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition: 1s linear color');

          const options = {
            event: 'enter',
            structural: true,
            delay: 5
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(element.css('transition-delay')).toEqual('5s');

          browserTrigger(element, 'transitionend',
            { timeStamp: Date.now() + 5000, elapsedTime: 1 });

          expect(element.attr('style') || '').not.toContain('transition');
        }));

        it('should not apply an inline transition if only [from] styles and a duration are provided',
          inject(($animateCss, $rootElement) => {

          const options = {
            duration: 3,
            from: { background: 'blue' }
          };

          const animator = $animateCss(element, options);
          expect(animator.$$willAnimate).toBeFalsy();
        }));

        it('should apply a transition if [from] styles are provided with a class that is added',
          inject(($animateCss, $rootElement) => {

          const options = {
            addClass: 'superb',
            from: { background: 'blue' }
          };

          const animator = $animateCss(element, options);
          expect(isFunction(animator.start)).toBe(true);
        }));

        it('should apply an inline transition if only [from] styles, but classes are added or removed and a duration is provided',
          inject(($animateCss, $rootElement) => {

          const options = {
            duration: 3,
            addClass: 'sugar',
            from: { background: 'yellow' }
          };

          const animator = $animateCss(element, options);
          expect(animator.$$willAnimate).toBeTruthy();
        }));

        it('should not apply an inline transition if no styles are provided',
          inject(($animateCss, $rootElement) => {

          const emptyObject = {};
          const options = {
            duration: 3,
            to: emptyObject,
            from: emptyObject
          };

          const animator = $animateCss(element, options);
          expect(animator.$$willAnimate).toBeFalsy();
        }));

        it('should apply a transition duration if the existing transition duration\'s property value is not \'all\'',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'transition: 1s linear color');

          const emptyObject = {};
          const options = {
            event: 'enter',
            structural: true,
            to: { background: 'blue' }
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          const style = element.attr('style');
          expect(element.css('transition-duration')).toMatch('1s');
          expect(element.css('transition-property')).toMatch('all');
          expect(style).toContain('linear');
        }));

        it('should apply a transition duration and an animation duration if duration + styles options are provided for a matching keyframe animation',
          inject(($animateCss, $rootElement) => {

          ss.addPossiblyPrefixedRule('.ng-enter', 'animation:3.5s keyframe_animation;');

          const emptyObject = {};
          const options = {
            event: 'enter',
            structural: true,
            duration: 10,
            to: {
              background: 'blue'
            }
          };

          const animator = $animateCss(element, options);
          animator.start();
          triggerAnimationStartFrame();


          expect(element.css('transition-duration')).toMatch('10s');
          expect(getPossiblyPrefixedStyleValue(element, 'animation-duration')).toEqual('10s');
        }));
      });

      describe('[easing]', () => {

        let element;
        beforeEach(inject(($document, $rootElement) => {
          element = angular.element('<div></div>');
          $rootElement.append(element);
          angular.element($document[0].body).append($rootElement);
        }));

        it('should apply easing to a transition animation if it exists', inject(($animateCss) => {
          ss.addPossiblyPrefixedRule('.red', 'transition:1s linear all;');
          const easing = 'ease-out';
          const animator = $animateCss(element, { addClass: 'red', easing });
          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(style).toContain('ease-out');
        }));

        it('should not apply easing to transitions nor keyframes on an element animation if nothing is detected',
          inject(($animateCss) => {

          ss.addRule('.red', ';');
          const easing = 'ease-out';
          const animator = $animateCss(element, { addClass: 'red', easing });
          animator.start();
          triggerAnimationStartFrame();

          expect(element.attr('style')).toBeFalsy();
        }));

        it('should apply easing to both keyframes and transition animations if detected',
          inject(($animateCss) => {

          ss.addPossiblyPrefixedRule('.red', 'transition: 1s linear all;');
          ss.addPossiblyPrefixedRule('.blue', 'animation: 1s my_keyframe;');
          const easing = 'ease-out';
          const animator = $animateCss(element, { addClass: 'red blue', easing });
          animator.start();
          triggerAnimationStartFrame();

          const style = element.attr('style');
          expect(style).toMatch(/animation(?:-timing-function)?:\s*ease-out/);
          expect(style).toMatch(/transition(?:-timing-function)?:\s*ease-out/);
        }));
      });

      describe('[cleanupStyles]', () => {
        it('should cleanup [from] and [to] styles that have been applied for the animation when true',
          inject(($animateCss) => {

          const runner = $animateCss(element, {
            duration: 1,
            from: { background: 'gold' },
            to: { color: 'brown' },
            cleanupStyles: true
          }).start();

          assertStyleIsPresent(element, 'background', true);
          assertStyleIsPresent(element, 'color', false);

          triggerAnimationStartFrame();

          assertStyleIsPresent(element, 'background', true);
          assertStyleIsPresent(element, 'color', true);

          runner.end();

          assertStyleIsPresent(element, 'background', false);
          assertStyleIsPresent(element, 'color', false);

          function assertStyleIsPresent(element, style, bool) {
            expect(element[0].style[style])[bool ? 'toBeTruthy' : 'toBeFalsy']();
          }
        }));

        it('should restore existing overidden styles already present on the element when true',
          inject(($animateCss) => {

          element.css('height', '100px');
          element.css('width', '111px');

          const runner = $animateCss(element, {
            duration: 1,
            from: { height: '200px', 'font-size':'66px' },
            to: { height: '300px', 'font-size': '99px', width: '222px' },
            cleanupStyles: true
          }).start();

          assertStyle(element, 'height', '200px');
          assertStyle(element, 'font-size', '66px');
          assertStyle(element, 'width', '111px');

          triggerAnimationStartFrame();

          assertStyle(element, 'height', '300px');
          assertStyle(element, 'width', '222px');
          assertStyle(element, 'font-size', '99px');

          runner.end();

          assertStyle(element, 'width', '111px');
          assertStyle(element, 'height', '100px');

          expect(element[0].style.getPropertyValue('font-size')).not.toBe('66px');

          function assertStyle(element, prop, value) {
            expect(element[0].style.getPropertyValue(prop)).toBe(value);
          }
        }));
      });

      it('should round up long elapsedTime values to close off a CSS3 animation',
        inject(($animateCss) => {

        ss.addPossiblyPrefixedRule('.millisecond-transition.ng-leave', 'transition:510ms linear all;');

        element.addClass('millisecond-transition');
        const animator = $animateCss(element, {
          event: 'leave',
          structural: true
        });

        animator.start();
        triggerAnimationStartFrame();

        expect(element).toHaveClass('ng-leave-active');

        browserTrigger(element, 'transitionend',
          { timeStamp: Date.now() + 1000, elapsedTime: 0.50999999991 });

        expect(element).not.toHaveClass('ng-leave-active');
      }));
    });

    describe('SVG', () => {
      it('should properly apply transitions on an SVG element',
        inject(($animateCss, $rootScope, $compile, $document, $rootElement) => {

        const element = $compile('<svg width="500" height="500">' +
                                 '<circle cx="15" cy="5" r="100" fill="orange" />' +
                               '</svg>')($rootScope);

        angular.element($document[0].body).append($rootElement);
        $rootElement.append(element);

        $animateCss(element, {
          event: 'enter',
          structural: true,
          duration: 10
        }).start();

        triggerAnimationStartFrame();

        expect(element).toHaveClass('ng-enter');
        expect(element).toHaveClass('ng-enter-active');

        browserTrigger(element, 'transitionend', { timeStamp: Date.now() + 1000, elapsedTime: 10 });

        expect(element).not.toHaveClass('ng-enter');
        expect(element).not.toHaveClass('ng-enter-active');
      }));

      it('should properly remove classes from SVG elements', inject(($animateCss) => {
        const element = angular.element('<svg width="500" height="500">' +
                                '<rect class="class-of-doom"></rect>' +
                             '</svg>');
        const child = element.find('rect');

        const animator = $animateCss(child, {
          removeClass: 'class-of-doom',
          duration: 0
        });
        animator.start();

        const className = child[0].getAttribute('class');
        expect(className).toBe('');
      }));
    });
  });
});
