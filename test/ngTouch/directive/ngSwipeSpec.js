

// Wrapper to abstract over using touch events or mouse events.
const swipeTests = function(description, restrictBrowsers, startEvent, moveEvent, endEvent) {
  describe(`ngSwipe with ${  description  } events`, () => {
    let element;

    if (restrictBrowsers) {
      // TODO(braden): Once we have other touch-friendly browsers on CI, allow them here.
      // Currently Firefox and IE refuse to fire touch events.
      const chrome = /chrome/.test(window.navigator.userAgent.toLowerCase());
      if (!chrome) {
        return;
      }
    }

    beforeEach(() => {
      module('ngTouch');
    });

    afterEach(() => {
      dealoc(element);
    });

    it('should swipe to the left', inject(($rootScope, $compile) => {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect($rootScope.swiped).toBe(true);
    }));

    it('should swipe to the right', inject(($rootScope, $compile) => {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      expect($rootScope.swiped).toBe(true);
    }));

    it('should only swipe given ng-swipe-disable-mouse attribute for touch events', inject(($rootScope, $compile) => {
      element = $compile('<div ng-swipe-left="swiped = true" ng-swipe-disable-mouse></div>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect(!!$rootScope.swiped).toBe(description !== 'mouse');
    }));

    it('should pass event object', inject(($rootScope, $compile) => {
      element = $compile('<div ng-swipe-left="event = $event"></div>')($rootScope);
      $rootScope.$digest();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect($rootScope.event).toBeDefined();
    }));

    it('should not swipe if you move too far vertically', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      browserTrigger(element, moveEvent, {
        keys: [],
        x: 70,
        y: 200
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if you slide only a short distance', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 90,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 80,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if the swipe leaves the element', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, moveEvent, {
        keys: [],
        x: 40,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should not swipe if the swipe starts outside the element', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();

      browserTrigger(element, moveEvent, {
        keys: [],
        x: 10,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 90,
        y: 20
      });

      expect($rootScope.swiped).toBeUndefined();
    }));

    it('should emit "swipeleft" events for left swipes', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-left="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();
      let eventFired = false;
      element.on('swipeleft', () => {
        eventFired = true;
      });

      browserTrigger(element, startEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      expect(eventFired).toEqual(true);
    }));

    it('should emit "swiperight" events for right swipes', inject(($rootScope, $compile, $rootElement) => {
      element = $compile('<div ng-swipe-right="swiped = true"></div>')($rootScope);
      $rootElement.append(element);
      $rootScope.$digest();

      expect($rootScope.swiped).toBeUndefined();
      let eventFired = false;
      element.on('swiperight', () => {
        eventFired = true;
      });

      browserTrigger(element, startEvent, {
        keys: [],
        x: 20,
        y: 20
      });
      browserTrigger(element, endEvent, {
        keys: [],
        x: 100,
        y: 20
      });
      expect(eventFired).toEqual(true);
    }));
  });
};

swipeTests('touch', /* restrictBrowsers */ true, 'touchstart', 'touchmove', 'touchend');
swipeTests('mouse', /* restrictBrowsers */ false, 'mousedown', 'mousemove', 'mouseup');

