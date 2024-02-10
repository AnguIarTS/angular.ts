

describe('$$rAF', () => {
  it('should queue and block animation frames', inject(($$rAF) => {
    if (!$$rAF.supported) return;

    let message;
    $$rAF(() => {
      message = 'yes';
    });

    expect(message).toBeUndefined();
    $$rAF.flush();
    expect(message).toBe('yes');
  }));

  it('should provide a cancellation method', inject(($$rAF) => {
    if (!$$rAF.supported) return;

    let present = true;
    const cancel = $$rAF(() => {
      present = false;
    });

    expect(present).toBe(true);
    cancel();

    try {
      $$rAF.flush();
    } catch (e) { /* empty */ }
    expect(present).toBe(true);
  }));

  describe('$timeout fallback', () => {
    it('it should use a $timeout incase native rAF isn\'t supported', () => {
      const timeoutSpy = jasmine.createSpy('callback');

      // we need to create our own injector to work around the ngMock overrides
      const injector = createInjector(['ng', function($provide) {
        $provide.value('$timeout', timeoutSpy);
        $provide.value('$window', {
          location: window.location
        });
      }]);

      const $$rAF = injector.get('$$rAF');
      expect($$rAF.supported).toBe(false);

      let message;
      $$rAF(() => {
        message = 'on';
      });

      expect(message).toBeUndefined();
      expect(timeoutSpy).toHaveBeenCalled();

      timeoutSpy.calls.mostRecent().args[0]();

      expect(message).toBe('on');
    });
  });

  describe('mocks', () => {
    it('should throw an error if no frames are present', inject(($$rAF) => {
      if ($$rAF.supported) {
        let failed = false;
        try {
          $$rAF.flush();
        } catch (e) {
          failed = true;
        }
        expect(failed).toBe(true);
      }
    }));
  });

  describe('mobile', () => {
    it('should provide a cancellation method for an older version of Android', () => {
      // we need to create our own injector to work around the ngMock overrides
      const injector = createInjector(['ng', function($provide) {
        $provide.value('$window', {
          location: window.location,
          history: window.history,
          webkitRequestAnimationFrame: jasmine.createSpy('$window.webkitRequestAnimationFrame'),
          webkitCancelRequestAnimationFrame: jasmine.createSpy('$window.webkitCancelRequestAnimationFrame')
        });
      }]);

      const $$rAF = injector.get('$$rAF');
      const $window = injector.get('$window');
      const cancel = $$rAF(() => {});

      expect($$rAF.supported).toBe(true);

      try {
        cancel();
      } catch (e) { /* empty */ }

      expect($window.webkitCancelRequestAnimationFrame).toHaveBeenCalled();
    });
  });
});
