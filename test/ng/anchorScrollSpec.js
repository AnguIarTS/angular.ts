

describe('$anchorScroll', () => {

  let elmSpy;

  function createMockWindow() {
    return function() {
      module(($provide) => {
        elmSpy = {};

        const mockedWin = {
          scrollTo: jasmine.createSpy('$window.scrollTo'),
          scrollBy: jasmine.createSpy('$window.scrollBy'),
          document: window.document,
          getComputedStyle(elem) {
            return window.getComputedStyle(elem);
          }
        };

        $provide.value('$window', mockedWin);
      });
    };
  }

  function addElements() {
    const elements = sliceArgs(arguments);

    return function($window) {
      forEach(elements, (identifier) => {
        const match = identifier.match(/(?:(\w*) )?(\w*)=(\w*)/);
            const nodeName = match[1] || 'a';
            const tmpl = `<${  nodeName  } ${  match[2]  }="${  match[3]  }">${ 
                      match[3]    // add some content or else Firefox and IE place the element
                                   // in weird ways that break yOffset-testing.
                   }</${  nodeName  }>`;
            const jqElm = jqLite(tmpl);
            const elm = jqElm[0];
            // Inline elements cause Firefox to report an unexpected value for
            // `getBoundingClientRect().top` on some platforms (depending on the default font and
            // line-height). Using inline-block elements prevents this.
            // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1014738
            elm.style.display = 'inline-block';

        elmSpy[identifier] = spyOn(elm, 'scrollIntoView');
        jqLite($window.document.body).append(jqElm);
      });
    };
  }

  function callAnchorScroll(hash) {
    return function($anchorScroll) {
      $anchorScroll(hash);
    };
  }

  function changeHashAndScroll(hash) {
    return function($location, $anchorScroll) {
      $location.hash(hash);
      $anchorScroll();
    };
  }

  function changeHashTo(hash) {
    return function($anchorScroll, $location, $rootScope) {
      $rootScope.$apply(() => {
        $location.hash(hash);
      });
    };
  }

  function expectNoScrolling() {
    return expectScrollingTo(NaN);
  }

  function expectScrollingTo(identifierCountMap) {
    let map = {};
    if (isString(identifierCountMap)) {
      map[identifierCountMap] = 1;
    } else if (isArray(identifierCountMap)) {
      forEach(identifierCountMap, (identifier) => {
        map[identifier] = 1;
      });
    } else {
      map = identifierCountMap;
    }

    return function($window) {
      forEach(elmSpy, (spy, id) => {
        expect(spy).toHaveBeenCalledTimes(map[id] || 0);
      });
      expect($window.scrollTo).not.toHaveBeenCalled();
    };
  }

  function expectScrollingToTop($window) {
    forEach(elmSpy, (spy, id) => {
      expect(spy).not.toHaveBeenCalled();
    });

    expect($window.scrollTo).toHaveBeenCalledWith(0, 0);
  }

  function spyOnJQLiteDocumentLoaded(fake) {
    return function() {
      spyOn(window, 'jqLiteDocumentLoaded');
      if (fake) {
        window.jqLiteDocumentLoaded.and.callFake(fake);
      }
    };
  }

  function unspyOnJQLiteDocumentLoaded() {
    return function() {
      window.jqLiteDocumentLoaded = window.jqLiteDocumentLoaded.originalValue;
    };
  }

  function simulateDocumentLoaded() {
    return spyOnJQLiteDocumentLoaded((callback) => { callback(); });
  }

  function fireWindowLoadEvent() {
    return function($browser) {
      const callback = window.jqLiteDocumentLoaded.calls.mostRecent().args[0];
      callback();
      $browser.defer.flush();
    };
  }

  afterEach(inject(($browser, $document) => {
    expect($browser.deferredFns.length).toBe(0);
    dealoc($document);
  }));


  describe('when explicitly called', () => {

    beforeEach(createMockWindow());


    describe('and implicitly using `$location.hash()`', () => {

      it('should scroll to top of the window if empty hash', inject(
        changeHashAndScroll(''),
        expectScrollingToTop));


      it('should not scroll if hash does not match any element', inject(
        addElements('id=one', 'id=two'),
        changeHashAndScroll('non-existing'),
        expectNoScrolling()));


      it('should scroll to anchor element with name', inject(
        addElements('a name=abc'),
        changeHashAndScroll('abc'),
        expectScrollingTo('a name=abc')));


      it('should not scroll to other than anchor element with name', inject(
        addElements('input name=xxl', 'select name=xxl', 'form name=xxl'),
        changeHashAndScroll('xxl'),
        expectNoScrolling()));


      it('should scroll to anchor even if other element with given name exist', inject(
        addElements('input name=some', 'a name=some'),
        changeHashAndScroll('some'),
        expectScrollingTo('a name=some')));


      it('should scroll to element with id with precedence over name', inject(
        addElements('name=abc', 'id=abc'),
        changeHashAndScroll('abc'),
        expectScrollingTo('id=abc')));


      it('should scroll to top if hash === "top" and no matching element', inject(
        changeHashAndScroll('top'),
        expectScrollingToTop));


      it('should scroll to element with id "top" if present', inject(
        addElements('id=top'),
        changeHashAndScroll('top'),
        expectScrollingTo('id=top')));
    });


    describe('and specifying a hash', () => {

      it('should ignore the `hash` argument if not a string', inject(
        spyOnJQLiteDocumentLoaded(),
        addElements('id=one', 'id=two'),
        changeHashTo('one'),   // won't scroll since `jqLiteDocumentLoaded()` is spied upon
        callAnchorScroll({}),
        expectScrollingTo('id=one'),
        unspyOnJQLiteDocumentLoaded()));


      it('should ignore `$location.hash()` if `hash` is passed as argument', inject(
        spyOnJQLiteDocumentLoaded(),
        addElements('id=one', 'id=two'),
        changeHashTo('one'),   // won't scroll since `jqLiteDocumentLoaded()` is spied upon
        callAnchorScroll('two'),
        expectScrollingTo('id=two'),
        unspyOnJQLiteDocumentLoaded()));


      it('should scroll to top of the window if empty hash', inject(
        callAnchorScroll(''),
        expectScrollingToTop));


      it('should not scroll if hash does not match any element', inject(
        addElements('id=one', 'id=two'),
        callAnchorScroll('non-existing'),
        expectNoScrolling()));


      it('should scroll to anchor element with name', inject(
        addElements('a name=abc'),
        callAnchorScroll('abc'),
        expectScrollingTo('a name=abc')));


      it('should not scroll to other than anchor element with name', inject(
        addElements('input name=xxl', 'select name=xxl', 'form name=xxl'),
        callAnchorScroll('xxl'),
        expectNoScrolling()));


      it('should scroll to anchor even if other element with given name exist', inject(
        addElements('input name=some', 'a name=some'),
        callAnchorScroll('some'),
        expectScrollingTo('a name=some')));


      it('should scroll to element with id with precedence over name', inject(
        addElements('name=abc', 'id=abc'),
        callAnchorScroll('abc'),
        expectScrollingTo('id=abc')));


      it('should scroll to top if hash === "top" and no matching element', inject(
        callAnchorScroll('top'),
        expectScrollingToTop));


      it('should scroll to element with id "top" if present', inject(
        addElements('id=top'),
        callAnchorScroll('top'),
        expectScrollingTo('id=top')));


      it('should scroll to element with id "7" if present, with a given hash of type number', inject(
        addElements('id=7'),
        callAnchorScroll(7),
        expectScrollingTo('id=7')));


      it('should scroll to element with id "7" if present, with a given hash of type string', inject(
        addElements('id=7'),
        callAnchorScroll('7'),
        expectScrollingTo('id=7')));
    });
  });


  describe('watcher', () => {

    function initLocation(config) {
      return function($provide, $locationProvider) {
        $provide.value('$sniffer', {history: config.historyApi});
        $locationProvider.html5Mode(config.html5Mode);
      };
    }

    function disableAutoScrolling() {
      return function($anchorScrollProvider) {
        $anchorScrollProvider.disableAutoScrolling();
      };
    }


    beforeEach(createMockWindow());

    describe('when document has completed loading', () => {

      beforeEach(simulateDocumentLoaded());
      afterEach(unspyOnJQLiteDocumentLoaded());

      it('should scroll to element when hash change in hashbang mode', () => {
        module(initLocation({html5Mode: false, historyApi: true}));
        inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should scroll to element when hash change in html5 mode with no history api', () => {
        module(initLocation({html5Mode: true, historyApi: false}));
        inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should not scroll to the top if $anchorScroll is initializing and location hash is empty',
        inject(
          expectNoScrolling())
      );


      it('should not scroll when element does not exist', () => {
        module(initLocation({html5Mode: false, historyApi: false}));
        inject(
          addElements('id=some'),
          changeHashTo('other'),
          expectNoScrolling()
        );
      });


      it('should scroll when html5 mode with history api', () => {
        module(initLocation({html5Mode: true, historyApi: true}));
        inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectScrollingTo('id=some')
        );
      });


      it('should not scroll when auto-scrolling is disabled', () => {
        module(
            disableAutoScrolling(),
            initLocation({html5Mode: false, historyApi: false})
        );
        inject(
          addElements('id=fake'),
          changeHashTo('fake'),
          expectNoScrolling()
        );
      });


      it('should scroll when called explicitly (even if auto-scrolling is disabled)', () => {
        module(
            disableAutoScrolling(),
            initLocation({html5Mode: false, historyApi: false})
        );
        inject(
          addElements('id=fake'),
          changeHashTo('fake'),
          expectNoScrolling(),
          callAnchorScroll(),
          expectScrollingTo('id=fake')
        );
      });
    });

    describe('when document has not completed loading', () => {

      beforeEach(spyOnJQLiteDocumentLoaded());
      afterEach(unspyOnJQLiteDocumentLoaded());

      it('should wait for the document to be completely loaded before auto-scrolling', inject(
          addElements('id=some'),
          changeHashTo('some'),
          expectNoScrolling('id=some'),
          fireWindowLoadEvent(),
          expectScrollingTo('id=some')
      ));

    });

  });


  describe('yOffset', () => {

    beforeEach(simulateDocumentLoaded());
    afterEach(unspyOnJQLiteDocumentLoaded);

    function expectScrollingWithOffset(identifierCountMap, offsetList) {
      const list = isArray(offsetList) ? offsetList : [offsetList];

      return function($rootScope, $window) {
        inject(expectScrollingTo(identifierCountMap));
        expect($window.scrollBy).toHaveBeenCalledTimes(list.length);
        forEach(list, (offset, idx) => {
          // Due to sub-pixel rendering, there is a +/-1 error margin in the actual offset
          const args = $window.scrollBy.calls.argsFor(idx);
          expect(args[0]).toBe(0);
          expect(Math.abs(offset + args[1])).toBeLessThan(1);
        });
      };
    }

    function expectScrollingWithoutOffset(identifierCountMap) {
      return expectScrollingWithOffset(identifierCountMap, []);
    }

    function mockBoundingClientRect(childValuesMap) {
      return function($window) {
        const {children} = $window.document.body;
        forEach(childValuesMap, (valuesList, childIdx) => {
          const elem = children[childIdx];
          elem.getBoundingClientRect = function() {
            const val = valuesList.shift();
            return {
              top: val,
              bottom: val
            };
          };
        });
      };
    }

    function setYOffset(yOffset) {
      return function($anchorScroll) {
        $anchorScroll.yOffset = yOffset;
      };
    }

    beforeEach(createMockWindow());


    describe('and body with no border/margin/padding', () => {

      describe('when set as a fixed number', () => {

        const yOffsetNumber = 50;

        beforeEach(inject(setYOffset(yOffsetNumber)));


        it('should scroll with vertical offset', inject(
          addElements('id=some'),
          mockBoundingClientRect({0: [0]}),
          changeHashTo('some'),
          expectScrollingWithOffset('id=some', yOffsetNumber)
        ));


        it('should use the correct vertical offset when changing `yOffset` at runtime', inject(
          addElements('id=some'),
          mockBoundingClientRect({0: [0, 0]}),
          changeHashTo('some'),
          setYOffset(yOffsetNumber - 10),
          callAnchorScroll(),
          expectScrollingWithOffset({'id=some': 2}, [yOffsetNumber, yOffsetNumber - 10])));


        it('should adjust the vertical offset for elements near the end of the page', () => {

          const targetAdjustedOffset = 20;

          inject(
            addElements('id=some1', 'id=some2'),
            mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
            changeHashTo('some2'),
            expectScrollingWithOffset('id=some2', targetAdjustedOffset));
        });
      });


      describe('when set as a function', () => {

        it('should scroll with vertical offset', () => {

          let val = 0;
          const increment = 10;

          function yOffsetFunction() {
            val += increment;
            return val;
          }

          inject(
            addElements('id=id1', 'name=name2'),
            mockBoundingClientRect({
              0: [0, 0, 0],
              1: [0]
            }),
            setYOffset(yOffsetFunction),
            changeHashTo('id1'),
            changeHashTo('name2'),
            changeHashTo('id1'),
            callAnchorScroll(),
            expectScrollingWithOffset({
              'id=id1': 3,
              'name=name2': 1
            }, [
              1 * increment,
              2 * increment,
              3 * increment,
              4 * increment
            ]));
        });
      });


      describe('when set as a jqLite element', () => {

        const elemBottom = 50;

        function createAndSetYOffsetElement(position) {
          const jqElem = jqLite('<div></div>');
          jqElem[0].style.position = position;

          return function($anchorScroll, $window) {
            jqLite($window.document.body).append(jqElem);
            $anchorScroll.yOffset = jqElem;
          };
        }


        it('should scroll with vertical offset when `position === fixed`', inject(
          createAndSetYOffsetElement('fixed'),
          addElements('id=some'),
          mockBoundingClientRect({0: [elemBottom], 1: [0]}),
          changeHashTo('some'),
          expectScrollingWithOffset('id=some', elemBottom)));


        it('should scroll without vertical offset when `position !== fixed`', inject(
          createAndSetYOffsetElement('absolute', elemBottom),
          expectScrollingWithoutOffset('id=some')));
      });
    });


    describe('and body with border/margin/padding', () => {

      const borderWidth = 4;
      const marginWidth = 8;
      const paddingWidth = 16;
      const yOffsetNumber = 50;
      const necessaryYOffset = yOffsetNumber - borderWidth - marginWidth - paddingWidth;

      beforeEach(inject(setYOffset(yOffsetNumber)));


      it('should scroll with vertical offset', inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [yOffsetNumber - necessaryYOffset]}),
        changeHashTo('some'),
        expectScrollingWithOffset('id=some', necessaryYOffset)));


      it('should use the correct vertical offset when changing `yOffset` at runtime', inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [
          yOffsetNumber - necessaryYOffset,
          yOffsetNumber - necessaryYOffset
        ]}),
        changeHashTo('some'),
        setYOffset(yOffsetNumber - 10),
        callAnchorScroll(),
        expectScrollingWithOffset({'id=some': 2}, [necessaryYOffset, necessaryYOffset - 10])));


      it('should adjust the vertical offset for elements near the end of the page', () => {

        const targetAdjustedOffset = 20;

        inject(
          addElements('id=some1', 'id=some2'),
          mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
          changeHashTo('some2'),
          expectScrollingWithOffset('id=some2', targetAdjustedOffset));
      });
    });


    describe('and body with border/margin/padding and boxSizing', () => {

      const borderWidth = 4;
      const marginWidth = 8;
      const paddingWidth = 16;
      const yOffsetNumber = 50;
      const necessaryYOffset = yOffsetNumber - borderWidth - marginWidth - paddingWidth;

      beforeEach(inject(setYOffset(yOffsetNumber)));


      it('should scroll with vertical offset', inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [yOffsetNumber - necessaryYOffset]}),
        changeHashTo('some'),
        expectScrollingWithOffset('id=some', necessaryYOffset)));


      it('should use the correct vertical offset when changing `yOffset` at runtime', inject(
        addElements('id=some'),
        mockBoundingClientRect({0: [
          yOffsetNumber - necessaryYOffset,
          yOffsetNumber - necessaryYOffset
        ]}),
        changeHashTo('some'),
        setYOffset(yOffsetNumber - 10),
        callAnchorScroll(),
        expectScrollingWithOffset({'id=some': 2}, [necessaryYOffset, necessaryYOffset - 10])));


      it('should adjust the vertical offset for elements near the end of the page', () => {

        const targetAdjustedOffset = 20;

        inject(
          addElements('id=some1', 'id=some2'),
          mockBoundingClientRect({1: [yOffsetNumber - targetAdjustedOffset]}),
          changeHashTo('some2'),
          expectScrollingWithOffset('id=some2', targetAdjustedOffset));
      });
    });
  });
});
