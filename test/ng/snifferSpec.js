

describe('$sniffer', function() {
  function sniffer($window, $document) {
    /* global $SnifferProvider: false */
    $window.navigator = $window.navigator || {};
    $document = jqLite($document || {});
    if (!$document[0].body) {
      $document[0].body = window.document.body;
    }
    return new $SnifferProvider().$get[2]($window, $document);
  }


  describe('history', function() {
    it('should be true if history.pushState defined', function() {
      let mockWindow = {
        history: {
          pushState: noop,
          replaceState: noop
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    it('should be false if history or pushState not defined', function() {
      expect(sniffer({}).history).toBe(false);
      expect(sniffer({history: {}}).history).toBe(false);
    });


    it('should be false on Boxee box with an older version of Webkit', function() {
      let mockWindow = {
        history: {
          pushState: noop
        },
        navigator: {
          userAgent: 'boxee (alpha/Darwin 8.7.1 i386 - 0.9.11.5591)'
        }
      };

      expect(sniffer(mockWindow).history).toBe(false);
    });


    it('should be true on NW.js apps (which look similar to Chrome Packaged Apps)', function() {
      let mockWindow = {
        history: {
          pushState: noop
        },
        chrome: {
          app: {
            runtime: {}
          }
        },
        nw: {
          process: {}
        }
      };

      expect(sniffer(mockWindow).history).toBe(true);
    });


    it('should be false on Chrome Packaged Apps', function() {
      // Chrome Packaged Apps are not allowed to access `window.history.pushState`.
      // In Chrome, `window.app` might be available in "normal" webpages, but `window.app.runtime`
      // only exists in the context of a packaged app.

      expect(sniffer(createMockWindow()).history).toBe(true);
      expect(sniffer(createMockWindow(true)).history).toBe(true);
      expect(sniffer(createMockWindow(true, true)).history).toBe(false);

      function createMockWindow(isChrome, isPackagedApp) {
        let mockWindow = {
          history: {
            pushState: noop
          }
        };

        if (isChrome) {
          let chromeAppObj = isPackagedApp ? {runtime: {}} : {};
          mockWindow.chrome = {app: chromeAppObj};
        }

        return mockWindow;
      }
    });


    it('should not try to access `history.pushState` in Chrome Packaged Apps', function() {
      let pushStateAccessCount = 0;

      let mockHistory = Object.create(Object.prototype, {
        pushState: {get: function() { pushStateAccessCount++; return noop; }}
      });
      let mockWindow = {
        chrome: {
          app: {
            runtime: {}
          }
        },
        history: mockHistory
      };

      sniffer(mockWindow);

      expect(pushStateAccessCount).toBe(0);
    });

    it('should not try to access `history.pushState` in sandboxed Chrome Packaged Apps',
      function() {
        let pushStateAccessCount = 0;

        let mockHistory = Object.create(Object.prototype, {
          pushState: {get: function() { pushStateAccessCount++; return noop; }}
        });
        let mockWindow = {
          chrome: {
            runtime: {
              id: 'x'
            }
          },
          history: mockHistory
        };

        sniffer(mockWindow);

        expect(pushStateAccessCount).toBe(0);
      }
    );
  });


  describe('hasEvent', function() {
    let mockDocument, mockDivElement, $sniffer;

    beforeEach(function() {
      let mockCreateElementFn = function(elm) { if (elm === 'div') return mockDivElement; };
      let createElementSpy = jasmine.createSpy('createElement').and.callFake(mockCreateElementFn);

      mockDocument = {createElement: createElementSpy};
      $sniffer = sniffer({}, mockDocument);
    });


    it('should return true if "onchange" is present in a div element', function() {
      mockDivElement = {onchange: noop};

      expect($sniffer.hasEvent('change')).toBe(true);
    });


    it('should return false if "oninput" is not present in a div element', function() {
      mockDivElement = {};

      expect($sniffer.hasEvent('input')).toBe(false);
    });


    it('should only create the element once', function() {
      mockDivElement = {};

      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');
      $sniffer.hasEvent('change');

      expect(mockDocument.createElement).toHaveBeenCalledOnce();
    });

  });


  describe('csp', function() {
    it('should have all rules set to false by default', function() {
      const csp = sniffer({}).csp;
      forEach(Object.keys(csp), function(key) {
        expect(csp[key]).toEqual(false);
      });
    });
  });


  describe('animations', function() {
    it('should be either true or false', inject(function($sniffer) {
      expect($sniffer.animations).toBeDefined();
    }));


    it('should be false when there is no animation style', function() {
      let mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });


    it('should be true with -webkit-prefixed animations', function() {
      let animationStyle = 'some_animation 2s linear';
      let mockDocument = {
        body: {
          style: {
            webkitAnimation: animationStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    it('should be true with w3c-style animations', function() {
      let mockDocument = {
        body: {
          style: {
            animation: 'some_animation 2s linear'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(true);
    });


    it('should be true on android with older body style properties', function() {
      let mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      let mockDocument = {
        body: {
          style: {
            webkitAnimation: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).animations).toBe(true);
    });


    it('should be true when an older version of Webkit is used', function() {
      let mockDocument = {
        body: {
          style: {
            WebkitOpacity: '0'
          }
        }
      };

      expect(sniffer({}, mockDocument).animations).toBe(false);
    });
  });


  describe('transitions', function() {
    it('should be either true or false', inject(function($sniffer) {
      expect($sniffer.transitions).toBeOneOf(true, false);
    }));


    it('should be false when there is no transition style', function() {
      let mockDocument = {
        body: {
          style: {}
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(false);
    });


    it('should be true with -webkit-prefixed transitions', function() {
      let transitionStyle = '1s linear all';
      let mockDocument = {
        body: {
          style: {
            webkitTransition: transitionStyle
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    it('should be true with w3c-style transitions', function() {
      let mockDocument = {
        body: {
          style: {
            transition: '1s linear all'
          }
        }
      };

      expect(sniffer({}, mockDocument).transitions).toBe(true);
    });


    it('should be true on android with older body style properties', function() {
      let mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };
      let mockDocument = {
        body: {
          style: {
            webkitTransition: ''
          }
        }
      };

      expect(sniffer(mockWindow, mockDocument).transitions).toBe(true);
    });
  });


  describe('android', function() {
    it('should provide the android version', function() {
      let mockWindow = {
        navigator: {
          userAgent: 'android 2'
        }
      };

      expect(sniffer(mockWindow).android).toBe(2);
    });
  });
});
