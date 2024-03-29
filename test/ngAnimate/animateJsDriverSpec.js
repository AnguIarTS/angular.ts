

describe('ngAnimate $$animateJsDriver', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  it('should register the $$animateJsDriver into the list of drivers found in $animateProvider',
    module(($animateProvider) => {

    expect($animateProvider.drivers).toContain('$$animateJsDriver');
  }));

  describe('with $$animateJs', () => {
    let capturedAnimation = null;
    const captureLog = [];
    let element;
    let driver;

    beforeEach(module(($provide) => {
      $provide.factory('$$animateJs', ($$AnimateRunner) => function() {
          const runner = new $$AnimateRunner();
          capturedAnimation = arguments;
          captureLog.push({
            args: capturedAnimation,
            runner
          });
          return {
            start() {
              return runner;
            }
          };
        });

      captureLog.length = 0;
      element = jqLite('<div></div>');

      return function($rootElement, $$animateJsDriver) {
        $rootElement.append(element);

        driver = function() {
          return $$animateJsDriver.apply($$animateJsDriver, arguments);
        };
      };
    }));

    it('should trigger a standard animation call to $$animateJs when a regular animation is executed',
      inject(($rootScope) => {

      driver({
        element,
        event: 'enter'
      });
      $rootScope.$digest();

      expect(captureLog.length).toBe(1);

      const args = capturedAnimation;
      expect(args[0]).toBe(element);
      expect(args[1]).toBe('enter');
    }));


    it('should trigger two regular JS animations when a grouped animation is passed in',
      inject(($rootScope) => {

      const child1 = jqLite('<div></div>');
      element.append(child1);
      const child2 = jqLite('<div></div>');
      element.append(child2);

      driver({
        from: {
          structural: true,
          element: child1,
          event: 'leave'
        },
        to: {
          structural: true,
          element: child2,
          event: 'enter'
        }
      });
      $rootScope.$digest();

      expect(captureLog.length).toBe(2);

      const first = captureLog[0].args;
      expect(first[0]).toBe(child1);
      expect(first[1]).toBe('leave');

      const second = captureLog[1].args;
      expect(second[0]).toBe(child2);
      expect(second[1]).toBe('enter');
    }));

    they('should $prop both animations when $prop() is called on the runner', ['end', 'cancel'], (method) => {
      inject(($rootScope, $animate) => {
        const child1 = jqLite('<div></div>');
        element.append(child1);
        const child2 = jqLite('<div></div>');
        element.append(child2);

        const animator = driver({
          from: {
            structural: true,
            element: child1,
            event: 'leave'
          },
          to: {
            structural: true,
            element: child2,
            event: 'enter'
          }
        });

        const runner = animator.start();

        let animationsClosed = false;
        let status;
        runner.done((s) => {
          animationsClosed = true;
          status = s;
        });

        $rootScope.$digest();

        runner[method]();
        $animate.flush();

        expect(animationsClosed).toBe(true);
        expect(status).toBe(method === 'end');
      });
    });

    they('should fully $prop when all inner animations are complete', ['end', 'cancel'], (method) => {
      inject(($rootScope, $animate) => {
        const child1 = jqLite('<div></div>');
        element.append(child1);
        const child2 = jqLite('<div></div>');
        element.append(child2);

        const animator = driver({
          from: {
            structural: true,
            element: child1,
            event: 'leave'
          },
          to: {
            structural: true,
            element: child2,
            event: 'enter'
          }
        });

        const runner = animator.start();

        let animationsClosed = false;
        let status;
        runner.done((s) => {
          animationsClosed = true;
          status = s;
        });

        captureLog[0].runner[method]();
        expect(animationsClosed).toBe(false);

        captureLog[1].runner[method]();
        $animate.flush();

        expect(animationsClosed).toBe(true);

        expect(status).toBe(method === 'end');
      });
    });
  });
});
