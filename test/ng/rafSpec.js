

describe('$$rAF', function() {
  it('should queue and block animation frames', inject(function($$rAF) {
    if (!$$rAF.supported) return;

    let message;
    $$rAF(function() {
      message = 'yes';
    });

    expect(message).toBeUndefined();
    $$rAF.flush();
    expect(message).toBe('yes');
  }));

  it('should provide a cancellation method', inject(function($$rAF) {
    if (!$$rAF.supported) return;

    let present = true;
    let cancel = $$rAF(function() {
      present = false;
    });

    expect(present).toBe(true);
    cancel();

    try {
      $$rAF.flush();
    } catch (e) { /* empty */ }
    expect(present).toBe(true);
  }));

  describe('$timeout fallback', function() {
    it('it should use a $timeout incase native rAF isn\'t supported', function() {
      let timeoutSpy = jasmine.createSpy('callback');

      //we need to create our own injector to work around the ngMock overrides
      let injector = createInjector(['ng', function($provide) {
        $provide.value('$timeout', timeoutSpy);
        $provide.value('$window', {
          location: window.location
        });
      }]);

      let $$rAF = injector.get('$$rAF');
      expect($$rAF.supported).toBe(false);

      let message;
      $$rAF(function() {
        message = 'on';
      });

      expect(message).toBeUndefined();
      expect(timeoutSpy).toHaveBeenCalled();

      timeoutSpy.calls.mostRecent().args[0]();

      expect(message).toBe('on');
    });
  });

  describe('mocks', function() {
    it('should throw an error if no frames are present', inject(function($$rAF) {
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

  describe('mobile', function() {
    it('should provide a cancellation method for an older version of Android', function() {
      //we need to create our own injector to work around the ngMock overrides
      let injector = createInjector(['ng', function($provide) {
        $provide.value('$window', {
          location: window.location,
          history: window.history,
          webkitRequestAnimationFrame: jasmine.createSpy('$window.webkitRequestAnimationFrame'),
          webkitCancelRequestAnimationFrame: jasmine.createSpy('$window.webkitCancelRequestAnimationFrame')
        });
      }]);

      let $$rAF = injector.get('$$rAF');
      let $window = injector.get('$window');
      let cancel = $$rAF(function() {});

      expect($$rAF.supported).toBe(true);

      try {
        cancel();
      } catch (e) { /* empty */ }

      expect($window.webkitCancelRequestAnimationFrame).toHaveBeenCalled();
    });
  });
});
