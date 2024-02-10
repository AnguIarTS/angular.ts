

/* global getHash:true, stripHash:true */

let historyEntriesLength;
let sniffer = {};

function MockWindow(options) {
  if (typeof options !== 'object') {
    options = {};
  }
  const events = {};
  const timeouts = this.timeouts = [];
  const locationHref = window.document.createElement('a');
  const committedHref = window.document.createElement('a');
  locationHref.href = committedHref.href = 'http://server/';
  const mockWindow = this;
  const {msie} = options;
  let ieState;

  historyEntriesLength = 1;

  function replaceHash(href, hash) {
    // replace the hash with the new one (stripping off a leading hash if there is one)
    // See hash setter spec: https://url.spec.whatwg.org/#urlutils-and-urlutilsreadonly-members
    return `${stripHash(href)  }#${  hash.replace(/^#/,'')}`;
  }


  this.setTimeout = function(fn) {
    return timeouts.push(fn) - 1;
  };

  this.clearTimeout = function(id) {
    timeouts[id] = noop;
  };

  this.setTimeout.flush = function(count) {
    count = count || timeouts.length;
    while (count-- > 0) timeouts.shift()();
  };

  this.addEventListener = function(name, listener) {
    if (angular.isUndefined(events[name])) events[name] = [];
    events[name].push(listener);
  };

  this.removeEventListener = noop;

  this.fire = function(name) {
    forEach(events[name], (fn) => {
      // type/target to make jQuery happy
      fn({
        type: name,
        target: {
          nodeType: 1
        }
      });
    });
  };

  this.location = {
    get href() {
      return committedHref.href;
    },
    set href(value) {
      locationHref.href = value;
      mockWindow.history.state = null;
      historyEntriesLength++;
      if (!options.updateAsync) this.flushHref();
    },
    get hash() {
      return getHash(committedHref.href);
    },
    set hash(value) {
      locationHref.href = replaceHash(locationHref.href, value);
      if (!options.updateAsync) this.flushHref();
    },
    replace(url) {
      locationHref.href = url;
      mockWindow.history.state = null;
      if (!options.updateAsync) this.flushHref();
    },
    flushHref() {
      committedHref.href = locationHref.href;
    }
  };

  this.history = {
    pushState() {
      this.replaceState.apply(this, arguments);
      historyEntriesLength++;
    },
    replaceState(state, title, url) {
      locationHref.href = url;
      if (!options.updateAsync) committedHref.href = locationHref.href;
      mockWindow.history.state = copy(state);
      if (!options.updateAsync) this.flushHref();
    },
    flushHref() {
      committedHref.href = locationHref.href;
    }
  };
  // IE 10-11 deserialize history.state on each read making subsequent reads
  // different object.
  if (!msie) {
    this.history.state = null;
  } else {
    ieState = null;
    Object.defineProperty(this.history, 'state', {
      get() {
        return copy(ieState);
      },
      set(value) {
        ieState = value;
      },
      configurable: true,
      enumerable: true
    });
  }
}

function MockDocument() {
  const self = this;

  this[0] = window.document;
  this.basePath = '/';

  this.find = function(name) {
    if (name === 'base') {
      return {
        attr(name) {
          if (name === 'href') {
            return self.basePath;
          } 
            throw new Error(name);
          
        }
      };
    } 
      throw new Error(name);
    
  };
}

describe('browser', () => {
  /* global Browser: false, TaskTracker: false */
  let browser; let fakeWindow; let fakeDocument; let fakeLog; let logs; let taskTrackerFactory;

  beforeEach(() => {
    sniffer = {history: true};
    fakeWindow = new MockWindow();
    fakeDocument = new MockDocument();
    taskTrackerFactory = function(log) { return new TaskTracker(log); };

    logs = {log:[], warn:[], info:[], error:[]};

    fakeLog = {
      log() { logs.log.push(slice.call(arguments)); },
      warn() { logs.warn.push(slice.call(arguments)); },
      info() { logs.info.push(slice.call(arguments)); },
      error() { logs.error.push(slice.call(arguments)); }
    };


    browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
  });

  describe('MockBrowser', () => {
    describe('historyEntriesLength', () => {
      it('should increment historyEntriesLength when setting location.href', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.href = '/foo';
        expect(historyEntriesLength).toBe(2);
      });

      it('should not increment historyEntriesLength when using location.replace', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.location.replace('/foo');
        expect(historyEntriesLength).toBe(1);
      });

      it('should increment historyEntriesLength when using history.pushState', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.pushState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(2);
      });

      it('should not increment historyEntriesLength when using history.replaceState', () => {
        expect(historyEntriesLength).toBe(1);
        fakeWindow.history.replaceState({a: 2}, 'foo', '/bar');
        expect(historyEntriesLength).toBe(1);
      });
    });

    describe('in IE', runTests({msie: true}));
    describe('not in IE', runTests({msie: false}));

    function runTests(options) {
      return function() {
        it('should return the same state object on every read', () => {
          const {msie} = options;

          fakeWindow = new MockWindow({msie});
          fakeWindow.location.state = {prop: 'val'};
          browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

          browser.url(fakeWindow.location.href, false, {prop: 'val'});
          if (msie) {
            expect(fakeWindow.history.state).not.toBe(fakeWindow.history.state);
            expect(fakeWindow.history.state).toEqual(fakeWindow.history.state);
          } else {
            expect(fakeWindow.history.state).toBe(fakeWindow.history.state);
          }
        });
      };
    }
  });


  describe('notifyWhenNoOutstandingRequests', () => {
    it('should invoke callbacks immediately if there are no pending tasks', () => {
      const callback = jasmine.createSpy('callback');
      browser.notifyWhenNoOutstandingRequests(callback);
      expect(callback).toHaveBeenCalled();
    });


    it('should invoke callbacks immediately if there are no pending tasks (for specific task-type)',
      () => {
        const callbackAll = jasmine.createSpy('callbackAll');
        const callbackFoo = jasmine.createSpy('callbackFoo');

        browser.$$incOutstandingRequestCount();
        browser.notifyWhenNoOutstandingRequests(callbackAll);
        browser.notifyWhenNoOutstandingRequests(callbackFoo, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).toHaveBeenCalled();
      }
    );


    it('should invoke callbacks as soon as there are no pending tasks', () => {
      const callback = jasmine.createSpy('callback');

      browser.$$incOutstandingRequestCount();
      browser.notifyWhenNoOutstandingRequests(callback);
      expect(callback).not.toHaveBeenCalled();

      browser.$$completeOutstandingRequest(noop);
      expect(callback).toHaveBeenCalled();
    });


    it('should invoke callbacks as soon as there are no pending tasks (for specific task-type)',
      () => {
        const callbackAll = jasmine.createSpy('callbackAll');
        const callbackFoo = jasmine.createSpy('callbackFoo');

        browser.$$incOutstandingRequestCount();
        browser.$$incOutstandingRequestCount('foo');
        browser.notifyWhenNoOutstandingRequests(callbackAll);
        browser.notifyWhenNoOutstandingRequests(callbackFoo, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).not.toHaveBeenCalled();

        browser.$$completeOutstandingRequest(noop, 'foo');

        expect(callbackAll).not.toHaveBeenCalled();
        expect(callbackFoo).toHaveBeenCalledOnce();

        browser.$$completeOutstandingRequest(noop);

        expect(callbackAll).toHaveBeenCalledOnce();
        expect(callbackFoo).toHaveBeenCalledOnce();
      }
    );
  });


  describe('defer', () => {
    it('should execute fn asynchronously via setTimeout', () => {
      const callback = jasmine.createSpy('deferred');

      browser.defer(callback);
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledOnce();
    });


    it('should update outstandingRequests counter', () => {
      const noPendingTasksSpy = jasmine.createSpy('noPendingTasks');

      browser.defer(noop);
      browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush();
      expect(noPendingTasksSpy).toHaveBeenCalledOnce();
    });


    it('should update outstandingRequests counter (for specific task-type)', () => {
      const noPendingFooTasksSpy = jasmine.createSpy('noPendingFooTasks');
      const noPendingTasksSpy = jasmine.createSpy('noPendingTasks');

      browser.defer(noop, 0, 'foo');
      browser.defer(noop, 0, 'bar');

      browser.notifyWhenNoOutstandingRequests(noPendingFooTasksSpy, 'foo');
      browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
      expect(noPendingFooTasksSpy).not.toHaveBeenCalled();
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush(1);
      expect(noPendingFooTasksSpy).toHaveBeenCalledOnce();
      expect(noPendingTasksSpy).not.toHaveBeenCalled();

      fakeWindow.setTimeout.flush(1);
      expect(noPendingFooTasksSpy).toHaveBeenCalledOnce();
      expect(noPendingTasksSpy).toHaveBeenCalledOnce();
    });


    it('should return unique deferId', () => {
      const deferId1 = browser.defer(noop);
          const deferId2 = browser.defer(noop);

      expect(deferId1).toBeDefined();
      expect(deferId2).toBeDefined();
      expect(deferId1).not.toEqual(deferId2);
    });


    describe('cancel', () => {
      it('should allow tasks to be canceled with returned deferId', () => {
        const log = [];
            const deferId1 = browser.defer(() => { log.push('cancel me'); });
            const deferId2 = browser.defer(() => { log.push('ok'); });
            const deferId3 = browser.defer(() => { log.push('cancel me, now!'); });

        expect(log).toEqual([]);
        expect(browser.defer.cancel(deferId1)).toBe(true);
        expect(browser.defer.cancel(deferId3)).toBe(true);
        fakeWindow.setTimeout.flush();
        expect(log).toEqual(['ok']);
        expect(browser.defer.cancel(deferId2)).toBe(false);
      });


      it('should update outstandingRequests counter', () => {
        const noPendingTasksSpy = jasmine.createSpy('noPendingTasks');
        const deferId = browser.defer(noop);

        browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId);
        expect(noPendingTasksSpy).toHaveBeenCalledOnce();
      });


      it('should update outstandingRequests counter (for specific task-type)', () => {
        const noPendingFooTasksSpy = jasmine.createSpy('noPendingFooTasks');
        const noPendingTasksSpy = jasmine.createSpy('noPendingTasks');

        const deferId1 = browser.defer(noop, 0, 'foo');
        const deferId2 = browser.defer(noop, 0, 'bar');

        browser.notifyWhenNoOutstandingRequests(noPendingFooTasksSpy, 'foo');
        browser.notifyWhenNoOutstandingRequests(noPendingTasksSpy);
        expect(noPendingFooTasksSpy).not.toHaveBeenCalled();
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId1);
        expect(noPendingFooTasksSpy).toHaveBeenCalledOnce();
        expect(noPendingTasksSpy).not.toHaveBeenCalled();

        browser.defer.cancel(deferId2);
        expect(noPendingFooTasksSpy).toHaveBeenCalledOnce();
        expect(noPendingTasksSpy).toHaveBeenCalledOnce();
      });
    });
  });


  describe('url', () => {
    let pushState; let replaceState; let locationReplace;

    beforeEach(() => {
      pushState = spyOn(fakeWindow.history, 'pushState');
      replaceState = spyOn(fakeWindow.history, 'replaceState');
      locationReplace = spyOn(fakeWindow.location, 'replace');
    });

    it('should return current location.href', () => {
      fakeWindow.location.href = 'http://test.com';
      expect(browser.url()).toEqual('http://test.com/');

      fakeWindow.location.href = 'https://another.com';
      expect(browser.url()).toEqual('https://another.com/');
    });

    it('should strip an empty hash fragment', () => {
      fakeWindow.location.href = 'http://test.com/#';
      expect(browser.url()).toEqual('http://test.com/');

      fakeWindow.location.href = 'https://another.com/#foo';
      expect(browser.url()).toEqual('https://another.com/#foo');
    });

    it('should use history.pushState when available', () => {
      sniffer.history = true;
      browser.url('http://new.org');

      expect(pushState).toHaveBeenCalledOnce();
      expect(pushState.calls.argsFor(0)[2]).toEqual('http://new.org/');

      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    it('should use history.replaceState when available', () => {
      sniffer.history = true;
      browser.url('http://new.org', true);

      expect(replaceState).toHaveBeenCalledOnce();
      expect(replaceState.calls.argsFor(0)[2]).toEqual('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });

    it('should set location.href when pushState not available', () => {
      sniffer.history = false;
      browser.url('http://new.org');

      expect(fakeWindow.location.href).toEqual('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    it('should set location.href and not use pushState when the url only changed in the hash fragment to please IE10/11', () => {
      sniffer.history = true;
      browser.url('http://server/#123');

      expect(fakeWindow.location.href).toEqual('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(locationReplace).not.toHaveBeenCalled();
    });

    it('should retain the # character when the only change is clearing the hash fragment, to prevent page reload', () => {
      sniffer.history = true;

      browser.url('http://server/#123');
      expect(fakeWindow.location.href).toEqual('http://server/#123');

      browser.url('http://server/');
      expect(fakeWindow.location.href).toEqual('http://server/#');

    });

    it('should use location.replace when history.replaceState not available', () => {
      sniffer.history = false;
      browser.url('http://new.org', true);

      expect(locationReplace).toHaveBeenCalledWith('http://new.org/');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    it('should use location.replace and not use replaceState when the url only changed in the hash fragment to please IE10/11', () => {
      sniffer.history = true;
      browser.url('http://server/#123', true);

      expect(locationReplace).toHaveBeenCalledWith('http://server/#123');

      expect(pushState).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
      expect(fakeWindow.location.href).toEqual('http://server/');
    });


    it('should return $browser to allow chaining', () => {
      expect(browser.url('http://any.com')).toBe(browser);
    });

    it('should return $browser to allow chaining even if the previous and current URLs and states match', () => {
      expect(browser.url('http://any.com').url('http://any.com')).toBe(browser);
      const state = { any: 'foo' };
      expect(browser.url('http://any.com', false, state).url('http://any.com', false, state)).toBe(browser);
      expect(browser.url('http://any.com', true, state).url('http://any.com', true, state)).toBe(browser);
    });

    it('should not set URL when the URL is already set', () => {
      const current = fakeWindow.location.href;
      sniffer.history = false;
      fakeWindow.location.href = 'http://dontchange/';
      browser.url(current);
      expect(fakeWindow.location.href).toBe('http://dontchange/');
    });

    it('should not read out location.href if a reload was triggered but still allow to change the url', () => {
      sniffer.history = false;
      browser.url('http://server/someOtherUrlThatCausesReload');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrlThatCausesReload');

      fakeWindow.location.href = 'http://someNewUrl';
      expect(browser.url()).toBe('http://server/someOtherUrlThatCausesReload');

      browser.url('http://server/someOtherUrl');
      expect(browser.url()).toBe('http://server/someOtherUrl');
      expect(fakeWindow.location.href).toBe('http://server/someOtherUrl');
    });

    it('assumes that changes to location.hash occur in sync', (done) => {
      // This is an asynchronous integration test that changes the
      // hash in all possible ways and checks
      // - whether the change to the hash can be read out in sync
      // - whether the change to the hash can be read out in the hashchange event
      const realWin = window;
          const $realWin = jqLite(realWin);
          const hashInHashChangeEvent = [];

      const job = createAsync(done);
      job.runs(() => {
        $realWin.on('hashchange', hashListener);

        realWin.location.hash = '1';
        realWin.location.href += '2';
        realWin.location.replace(`${realWin.location.href  }3`);
        realWin.location.assign(`${realWin.location.href  }4`);

        expect(realWin.location.hash).toBe('#1234');
      })
      .waitsFor(() => hashInHashChangeEvent.length > 3)
      .runs(() => {
        $realWin.off('hashchange', hashListener);

        forEach(hashInHashChangeEvent, (hash) => {
          expect(hash).toBe('#1234');
        });
      }).done();
      job.start();

      function hashListener() {
        hashInHashChangeEvent.push(realWin.location.hash);
      }
    });

  });

  describe('url (with ie 11 weirdnesses)', () => {

    it('url() should actually set the url, even if IE 11 is weird and replaces HTML entities in the URL', () => {
      // this test can not be expressed with the Jasmine spies in the previous describe block, because $browser.url()
      // needs to observe the change to location.href during its invocation to enter the failing code path, but the spies
      // are not callThrough

      sniffer.history = true;
      const originalReplace = fakeWindow.location.replace;
      fakeWindow.location.replace = function(url) {
        url = url.replace('&not', '¬');
        // I really don't know why IE 11 (sometimes) does this, but I am not the only one to notice:
        // https://connect.microsoft.com/IE/feedback/details/1040980/bug-in-ie-which-interprets-document-location-href-as-html
        originalReplace.call(this, url);
      };

      // the initial URL contains a lengthy oauth token in the hash
      const initialUrl = 'http://test.com/oauthcallback#state=xxx%3D&not-before-policy=0';
      fakeWindow.location.href = initialUrl;
      browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

      // somehow, $location gets a version of this url where the = is no longer escaped, and tells the browser:
      const initialUrlFixedByLocation = initialUrl.replace('%3D', '=');
      browser.url(initialUrlFixedByLocation, true, null);
      expect(browser.url()).toEqual(initialUrlFixedByLocation);

      // a little later (but in the same digest cycle) the view asks $location to replace the url, which tells $browser
      const secondUrl = 'http://test.com/otherView';
      browser.url(secondUrl, true, null);
      expect(browser.url()).toEqual(secondUrl);
    });

  });

  describe('url (when state passed)', () => {
    let currentHref; let pushState; let replaceState; let locationReplace;

    beforeEach(() => {
    });

    describe('in IE', runTests({msie: true}));
    describe('not in IE', runTests({msie: false}));

    function runTests(options) {
      return function() {
        beforeEach(() => {
          sniffer = {history: true};

          fakeWindow = new MockWindow({msie: options.msie});
          currentHref = fakeWindow.location.href;
          pushState = spyOn(fakeWindow.history, 'pushState').and.callThrough();
          replaceState = spyOn(fakeWindow.history, 'replaceState').and.callThrough();
          locationReplace = spyOn(fakeWindow.location, 'replace').and.callThrough();

          browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
          browser.onUrlChange(() => {});
        });

        it('should change state', () => {
          browser.url(currentHref, false, {prop: 'val1'});
          expect(fakeWindow.history.state).toEqual({prop: 'val1'});
          browser.url(`${currentHref  }/something`, false, {prop: 'val2'});
          expect(fakeWindow.history.state).toEqual({prop: 'val2'});
        });

        it('should allow to set falsy states (except `undefined`)', () => {
          fakeWindow.history.state = {prop: 'val1'};
          fakeWindow.fire('popstate');

          browser.url(currentHref, false, null);
          expect(fakeWindow.history.state).toBe(null);

          browser.url(currentHref, false, false);
          expect(fakeWindow.history.state).toBe(false);

          browser.url(currentHref, false, '');
          expect(fakeWindow.history.state).toBe('');

          browser.url(currentHref, false, 0);
          expect(fakeWindow.history.state).toBe(0);
        });

        it('should treat `undefined` state as `null`', () => {
          fakeWindow.history.state = {prop: 'val1'};
          fakeWindow.fire('popstate');

          browser.url(currentHref, false, undefined);
          expect(fakeWindow.history.state).toBe(null);
        });

        it('should do pushState with the same URL and a different state', () => {
          browser.url(currentHref, false, {prop: 'val1'});
          expect(fakeWindow.history.state).toEqual({prop: 'val1'});

          browser.url(currentHref, false, null);
          expect(fakeWindow.history.state).toBe(null);

          browser.url(currentHref, false, {prop: 'val2'});
          browser.url(currentHref, false, {prop: 'val3'});
          expect(fakeWindow.history.state).toEqual({prop: 'val3'});
        });

        it('should do pushState with the same URL and deep equal but referentially different state', () => {
          fakeWindow.history.state = {prop: 'val'};
          fakeWindow.fire('popstate');
          expect(historyEntriesLength).toBe(1);

          browser.url(currentHref, false, {prop: 'val'});
          expect(fakeWindow.history.state).toEqual({prop: 'val'});
          expect(historyEntriesLength).toBe(2);
        });

        it('should not do pushState with the same URL and state from $browser.state()', () => {
          browser.url(currentHref, false, {prop: 'val'});

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          browser.url(currentHref, false, browser.state());
          expect(pushState).not.toHaveBeenCalled();
          expect(replaceState).not.toHaveBeenCalled();
          expect(locationReplace).not.toHaveBeenCalled();
        });

        it('should not do pushState with a URL using relative protocol', () => {
          browser.url('http://server/');

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          browser.url('//server');
          expect(pushState).not.toHaveBeenCalled();
          expect(replaceState).not.toHaveBeenCalled();
          expect(locationReplace).not.toHaveBeenCalled();
        });

        it('should not do pushState with a URL only adding a trailing slash after domain', () => {
          // A domain without a trailing /
          browser.url('http://server');

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          // A domain from something such as window.location.href with a trailing slash
          browser.url('http://server/');
          expect(pushState).not.toHaveBeenCalled();
          expect(replaceState).not.toHaveBeenCalled();
          expect(locationReplace).not.toHaveBeenCalled();
        });

        it('should not do pushState with a URL only removing a trailing slash after domain', () => {
          // A domain from something such as window.location.href with a trailing slash
          browser.url('http://server/');

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          // A domain without a trailing /
          browser.url('http://server');
          expect(pushState).not.toHaveBeenCalled();
          expect(replaceState).not.toHaveBeenCalled();
          expect(locationReplace).not.toHaveBeenCalled();
        });

        it('should do pushState with a URL only adding a trailing slash after the path', () => {
          browser.url('http://server/foo');

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          browser.url('http://server/foo/');
          expect(pushState).toHaveBeenCalledOnce();
          expect(fakeWindow.location.href).toEqual('http://server/foo/');
        });

        it('should do pushState with a URL only removing a trailing slash after the path', () => {
          browser.url('http://server/foo/');

          pushState.calls.reset();
          replaceState.calls.reset();
          locationReplace.calls.reset();

          browser.url('http://server/foo');
          expect(pushState).toHaveBeenCalledOnce();
          expect(fakeWindow.location.href).toEqual('http://server/foo');
        });
      };
    }
  });

  describe('state', () => {
    let currentHref;

    beforeEach(() => {
      sniffer = {history: true};
      currentHref = fakeWindow.location.href;
    });

    it('should not access `history.state` when `$sniffer.history` is false', () => {
      // In the context of a Chrome Packaged App, although `history.state` is present, accessing it
      // is not allowed and logs an error in the console. We should not try to access
      // `history.state` in contexts where `$sniffer.history` is false.

      let historyStateAccessed = false;
      const mockSniffer = {history: false};
      const mockWindow = new MockWindow();

      const _state = mockWindow.history.state;
      Object.defineProperty(mockWindow.history, 'state', {
        get() {
          historyStateAccessed = true;
          return _state;
        }
      });

      const browser = new Browser(mockWindow, fakeDocument, fakeLog, mockSniffer, taskTrackerFactory);

      expect(historyStateAccessed).toBe(false);
    });

    describe('in IE', runTests({msie: true}));
    describe('not in IE', runTests({msie: false}));


    function runTests(options) {
      return function() {
        beforeEach(() => {
          fakeWindow = new MockWindow({msie: options.msie});
          browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
        });

        it('should return history.state', () => {
          browser.url(currentHref, false, {prop: 'val'});
          expect(browser.state()).toEqual({prop: 'val'});
          browser.url(currentHref, false, 2);
          expect(browser.state()).toEqual(2);
          browser.url(currentHref, false, null);
          expect(browser.state()).toEqual(null);
        });

        it('should return null if history.state is undefined', () => {
          browser.url(currentHref, false, undefined);
          expect(browser.state()).toBe(null);
        });

        it('should return the same state object in subsequent invocations in IE', () => {
          browser.url(currentHref, false, {prop: 'val'});
          expect(browser.state()).toBe(browser.state());
        });
      };
    }
  });

  describe('urlChange', () => {
    let callback;

    beforeEach(() => {
      callback = jasmine.createSpy('onUrlChange');
    });

    afterEach(() => {
      if (!jQuery) jqLiteDealoc(fakeWindow);
    });

    it('should return registered callback', () => {
      expect(browser.onUrlChange(callback)).toBe(callback);
    });

    it('should forward popstate event with new url when history supported', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should forward only popstate event when history supported', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('popstate');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should forward hashchange event with new url when history not supported', () => {
      sniffer.history = false;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      fakeWindow.fire('hashchange');
      expect(callback).toHaveBeenCalledWith('http://server/new', null);

      fakeWindow.fire('popstate');
      fakeWindow.setTimeout.flush();
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should not fire urlChange if changed by browser.url method', () => {
      sniffer.history = false;
      browser.onUrlChange(callback);
      browser.url('http://new.com/');

      fakeWindow.fire('hashchange');
      expect(callback).not.toHaveBeenCalled();
    });

    describe('state handling', () => {
      let currentHref;

      beforeEach(() => {
        sniffer = {history: true};
        currentHref = fakeWindow.location.href;
      });

      describe('in IE', runTests({msie: true}));
      describe('not in IE', runTests({msie: false}));

      function runTests(options) {
        return function() {
          beforeEach(() => {
            fakeWindow = new MockWindow({msie: options.msie});
            browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);
          });

          it('should fire onUrlChange listeners only once if both popstate and hashchange triggered', () => {
            fakeWindow.history.state = {prop: 'val'};
            browser.onUrlChange(callback);

            fakeWindow.fire('hashchange');
            fakeWindow.fire('popstate');
            expect(callback).toHaveBeenCalledOnce();
          });
        };
      }
    });


    it('should stop calling callbacks when application has been torn down', () => {
      sniffer.history = true;
      browser.onUrlChange(callback);
      fakeWindow.location.href = 'http://server/new';

      browser.$$applicationDestroyed();

      fakeWindow.fire('popstate');
      expect(callback).not.toHaveBeenCalled();

      fakeWindow.fire('hashchange');
      fakeWindow.setTimeout.flush();
      expect(callback).not.toHaveBeenCalled();
    });

  });


  describe('baseHref', () => {
    let jqDocHead;

    beforeEach(() => {
      jqDocHead = jqLite(window.document).find('head');
    });

    it('should return value from <base href>', () => {
      fakeDocument.basePath = '/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });

    it('should return \'\' (empty string) if no <base href>', () => {
      fakeDocument.basePath = undefined;
      expect(browser.baseHref()).toEqual('');
    });

    it('should remove domain from <base href>', () => {
      fakeDocument.basePath = 'http://host.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');

      fakeDocument.basePath = 'http://host.com/base/path/index.html';
      expect(browser.baseHref()).toEqual('/base/path/index.html');
    });

    it('should remove domain from <base href> beginning with \'//\'', () => {
      fakeDocument.basePath = '//google.com/base/path/';
      expect(browser.baseHref()).toEqual('/base/path/');
    });
  });

  describe('integration tests with $location', () => {

    function setup(options) {
      fakeWindow = new MockWindow(options);
      browser = new Browser(fakeWindow, fakeDocument, fakeLog, sniffer, taskTrackerFactory);

      module(($provide, $locationProvider) => {

        spyOn(fakeWindow.history, 'pushState').and.callFake((stateObj, title, newUrl) => {
          fakeWindow.location.href = newUrl;
        });
        spyOn(fakeWindow.location, 'replace').and.callFake((newUrl) => {
          fakeWindow.location.href = newUrl;
        });
        $provide.value('$browser', browser);

        sniffer.history = options.history;
        $provide.value('$sniffer', sniffer);

        $locationProvider.html5Mode(options.html5Mode);
      });
    }

    describe('update $location when it was changed outside of AngularJS in sync ' +
       'before $digest was called', () => {

      it('should work with no history support, no html5Mode', () => {
        setup({
          history: false,
          html5Mode: false
        });
        inject(($rootScope, $location) => {
          $rootScope.$apply(() => {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      it('should work with history support, no html5Mode', () => {
        setup({
          history: true,
          html5Mode: false
        });
        inject(($rootScope, $location) => {
          $rootScope.$apply(() => {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      it('should work with no history support, with html5Mode', () => {
        setup({
          history: false,
          html5Mode: true
        });
        inject(($rootScope, $location) => {
          $rootScope.$apply(() => {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/#!/initialPath');

          fakeWindow.location.href = 'http://server/#!/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

      it('should work with history support, with html5Mode', () => {
        setup({
          history: true,
          html5Mode: true
        });
        inject(($rootScope, $location) => {
          $rootScope.$apply(() => {
            $location.path('/initialPath');
          });
          expect(fakeWindow.location.href).toBe('http://server/initialPath');

          fakeWindow.location.href = 'http://server/someTestHash';

          $rootScope.$digest();

          expect($location.path()).toBe('/someTestHash');
        });
      });

    });

    it('should not reload the page on every $digest when the page will be reloaded due to url rewrite on load', () => {
      setup({
        history: false,
        html5Mode: true
      });
      fakeWindow.location.href = 'http://server/some/deep/path';
      let changeUrlCount = 0;
      const _url = browser.url;
      browser.url = function(newUrl, replace, state) {
        if (newUrl) {
          changeUrlCount++;
        }
        return _url.call(this, newUrl, replace);
      };
      spyOn(browser, 'url').and.callThrough();
      inject(($rootScope, $location) => {
        $rootScope.$digest();
        $rootScope.$digest();
        $rootScope.$digest();
        $rootScope.$digest();

        // from $location for rewriting the initial url into a hash url
        expect(browser.url).toHaveBeenCalledWith('http://server/#!/some/deep/path', true);
        expect(changeUrlCount).toBe(1);
      });

    });

    // issue #12241
    it('should not infinite digest if the browser does not synchronously update the location properties', () => {
      setup({
        history: true,
        html5Mode: true,
        updateAsync: true // Simulate a browser that doesn't update the href synchronously
      });

      inject(($location, $rootScope) => {

        // Change the hash within AngularJS and check that we don't infinitely digest
        $location.hash('newHash');
        expect(() => { $rootScope.$digest(); }).not.toThrow();
        expect($location.absUrl()).toEqual('http://server/#newHash');

        // Now change the hash from outside AngularJS and check that $location updates correctly
        fakeWindow.location.hash = '#otherHash';

        // simulate next tick - since this browser doesn't update synchronously
        fakeWindow.location.flushHref();
        fakeWindow.fire('hashchange');

        expect($location.absUrl()).toEqual('http://server/#otherHash');
      });
    });

    // issue #16632
    it('should not trigger `$locationChangeStart` more than once due to trailing `#`', () => {
      setup({
        history: true,
        html5Mode: true
      });

      inject(($flushPendingTasks, $location, $rootScope) => {
        $rootScope.$digest();

        const spy = jasmine.createSpy('$locationChangeStart');
        $rootScope.$on('$locationChangeStart', spy);

        $rootScope.$evalAsync(() => {
          fakeWindow.location.href += '#';
        });
        $rootScope.$digest();

        expect(fakeWindow.location.href).toBe('http://server/#');
        expect($location.absUrl()).toBe('http://server/');

        expect(spy.calls.count()).toBe(0);
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('integration test with $rootScope', () => {

    beforeEach(module(($provide, $locationProvider) => {
      $provide.value('$browser', browser);
    }));

    it('should not interfere with legacy browser url replace behavior', () => {
      inject(($rootScope) => {
        const current = fakeWindow.location.href;
        const newUrl = 'http://notyet/';
        sniffer.history = false;
        expect(historyEntriesLength).toBe(1);
        browser.url(newUrl, true);
        expect(browser.url()).toBe(newUrl);
        expect(historyEntriesLength).toBe(1);
        $rootScope.$digest();
        expect(browser.url()).toBe(newUrl);
        expect(historyEntriesLength).toBe(1);
      });
    });

  });

});
