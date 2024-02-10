

describe('$swipe', () => {
  let element;
  let events;

  beforeEach(() => {
    module('ngTouch');
    inject(($compile, $rootScope) => {
      element = $compile('<div></div>')($rootScope);
    });
    events = {
      start: jasmine.createSpy('startSpy'),
      move: jasmine.createSpy('moveSpy'),
      cancel: jasmine.createSpy('cancelSpy'),
      end: jasmine.createSpy('endSpy')
    };
  });

  afterEach(() => {
    dealoc(element);
  });

  describe('pointerTypes', () => {
    let usedEvents;
    const MOUSE_EVENTS = ['mousedown','mousemove','mouseup'].sort();
    const TOUCH_EVENTS = ['touchcancel','touchend','touchmove','touchstart'].sort();
    const POINTER_EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].sort();
    const ALL_EVENTS = MOUSE_EVENTS.concat(TOUCH_EVENTS, POINTER_EVENTS).sort();

    beforeEach(() => {
      usedEvents = [];
      spyOn(element, 'on').and.callFake((events) => {
        angular.forEach(events.split(/\s+/), (eventName) => {
          usedEvents.push(eventName);
        });
      });
    });

    it('should use mouse, touch and pointer by default', inject(($swipe) => {
      $swipe.bind(element, events);
      expect(usedEvents.sort()).toEqual(ALL_EVENTS);
    }));

    it('should only use mouse events for pointerType "mouse"', inject(($swipe) => {
      $swipe.bind(element, events, ['mouse']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS);
    }));

    it('should only use touch events for pointerType "touch"', inject(($swipe) => {
      $swipe.bind(element, events, ['touch']);
      expect(usedEvents.sort()).toEqual(TOUCH_EVENTS);
    }));

    it('should only use pointer events for pointerType "pointer"', inject(($swipe) => {
      $swipe.bind(element, events, ['pointer']);
      expect(usedEvents.sort()).toEqual(POINTER_EVENTS);
    }));

    it('should use mouse and touch if both are specified', inject(($swipe) => {
      $swipe.bind(element, events, ['touch', 'mouse']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS.concat(TOUCH_EVENTS).sort());
    }));

    it('should use mouse and pointer if both are specified', inject(($swipe) => {
      $swipe.bind(element, events, ['mouse', 'pointer']);
      expect(usedEvents.sort()).toEqual(MOUSE_EVENTS.concat(POINTER_EVENTS).sort());
    }));

    it('should use touch and pointer if both are specified', inject(($swipe) => {
      $swipe.bind(element, events, ['touch', 'pointer']);
      expect(usedEvents.sort()).toEqual(TOUCH_EVENTS.concat(POINTER_EVENTS).sort());
    }));

    it('should use mouse, touch and pointer if they are specified', inject(($swipe) => {
      $swipe.bind(element, events, ['mouse', 'touch', 'pointer']);
      expect(usedEvents.sort()).toEqual(ALL_EVENTS);
    }));

  });

  swipeTests('touch', /* restrictBrowsers */ true, 'touchstart', 'touchmove', 'touchend');
  swipeTests('pointer', /* restrictBrowsers */ true, 'pointerdown', 'pointermove', 'pointerup');
  swipeTests('mouse', /* restrictBrowsers */ false, 'mousedown',  'mousemove', 'mouseup');

  // Wrapper to abstract over using touch events or mouse events.
  function swipeTests(description, restrictBrowsers, startEvent, moveEvent, endEvent) {
    describe(`$swipe with ${  description  } events`, () => {
      if (restrictBrowsers) {
        // TODO(braden): Once we have other touch-friendly browsers on CI, allow them here.
        // Currently Firefox and IE refuse to fire touch events.
        // Enable iPhone for manual testing.
        if (!/chrome|iphone/i.test(window.navigator.userAgent)) {
          return;
        }
      }

      it('should trigger the "start" event', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should trigger the "move" event after a "start"', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 140,
          y: 20
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should not trigger a "move" without a "start"', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should not trigger an "end" without a "start"', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));

      it('should trigger a "start", many "move"s and an "end"', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 130,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 140,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 150,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 160,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 170,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 180,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(7);

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(7);
        expect(events.end).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
      }));

      it('should not start sending "move"s until enough horizontal motion is accumulated', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 101,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 105,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 110,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 115,
          y: 40
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(3);

        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.move).toHaveBeenCalledTimes(3);
        expect(events.end).toHaveBeenCalled();

        expect(events.cancel).not.toHaveBeenCalled();
      }));

      it('should stop sending anything after vertical motion dominates', inject(($swipe) => {
        $swipe.bind(element, events);

        expect(events.start).not.toHaveBeenCalled();
        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, startEvent,{
          keys: [],
          x: 100,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.cancel).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, moveEvent,{
          keys: [],
          x: 101,
          y: 41
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 105,
          y: 55
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 110,
          y: 60
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 115,
          y: 70
        });
        browserTrigger(element, moveEvent,{
          keys: [],
          x: 120,
          y: 80
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.cancel).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();

        browserTrigger(element, endEvent,{
          keys: [],
          x: 200,
          y: 40
        });

        expect(events.start).toHaveBeenCalled();
        expect(events.cancel).toHaveBeenCalled();

        expect(events.move).not.toHaveBeenCalled();
        expect(events.end).not.toHaveBeenCalled();
      }));
    });
  }

});
