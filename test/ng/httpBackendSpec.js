/* global createHttpBackend: false, createMockXhr: false, MockXhr: false */


describe('$httpBackend', () => {

  let $backend; let $browser; let $jsonpCallbacks;
      let xhr; let fakeDocument; let callback;

  beforeEach(inject(($injector) => {

    $browser = $injector.get('$browser');

    fakeDocument = {
      $$scripts: [],
      createElement: jasmine.createSpy('createElement').and.callFake(function() {
        // Return a proper script element...
        return window.document.createElement(arguments[0]);
      }),
      body: {
        appendChild: jasmine.createSpy('body.appendChild').and.callFake((script) => {
          fakeDocument.$$scripts.push(script);
        }),
        removeChild: jasmine.createSpy('body.removeChild').and.callFake((script) => {
          const index = fakeDocument.$$scripts.indexOf(script);
          if (index !== -1) {
            fakeDocument.$$scripts.splice(index, 1);
          }
        })
      }
    };

    $jsonpCallbacks = {
      createCallback(url) {
        $jsonpCallbacks[url] = function(data) {
          $jsonpCallbacks[url].called = true;
          $jsonpCallbacks[url].data = data;
        };
        return url;
      },
      wasCalled(callbackPath) {
        return $jsonpCallbacks[callbackPath].called;
      },
      getResponse(callbackPath) {
        return $jsonpCallbacks[callbackPath].data;
      },
      removeCallback(callbackPath) {
        delete $jsonpCallbacks[callbackPath];
      }
    };

    $backend = createHttpBackend($browser, createMockXhr, $browser.defer, $jsonpCallbacks, fakeDocument);
    callback = jasmine.createSpy('done');
  }));


  it('should do basics - open async xhr and send data', () => {
    $backend('GET', '/some-url', 'some-data', noop);
    xhr = MockXhr.$$lastInstance;

    expect(xhr.$$method).toBe('GET');
    expect(xhr.$$url).toBe('/some-url');
    expect(xhr.$$data).toBe('some-data');
    expect(xhr.$$async).toBe(true);
  });

  it('should pass null to send if no body is set', () => {
    $backend('GET', '/some-url', undefined, noop);
    xhr = MockXhr.$$lastInstance;

    expect(xhr.$$data).toBe(null);
  });

  it('should pass the correct falsy value to send if falsy body is set (excluding undefined, NaN)',
    () => {
      const values = [false, 0, '', null];
      angular.forEach(values, (value) => {
        $backend('GET', '/some-url', value, noop);
        xhr = MockXhr.$$lastInstance;

        expect(xhr.$$data).toBe(value);
      });
    }
  );

  it('should pass NaN to send if NaN body is set', () => {
    $backend('GET', '/some-url', NaN, noop);
    xhr = MockXhr.$$lastInstance;

    expect(isNaN(xhr.$$data)).toEqual(true);
  });

  it('should call completion function with xhr.statusText if present', () => {
    callback.and.callFake((status, response, headers, statusText) => {
      expect(statusText).toBe('OK');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = MockXhr.$$lastInstance;
    xhr.statusText = 'OK';
    xhr.onload();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should call completion function with empty string if not present', () => {
    callback.and.callFake((status, response, headers, statusText) => {
      expect(statusText).toBe('');
    });

    $backend('GET', '/some-url', null, callback);
    xhr = MockXhr.$$lastInstance;
    xhr.onload();
    expect(callback).toHaveBeenCalledOnce();
  });


  it('should normalize IE\'s 1223 status code into 204', () => {
    callback.and.callFake((status) => {
      expect(status).toBe(204);
    });

    $backend('GET', 'URL', null, callback);
    xhr = MockXhr.$$lastInstance;

    xhr.status = 1223;
    xhr.onload();

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should set only the requested headers', () => {
    $backend('POST', 'URL', null, noop, {'X-header1': 'value1', 'X-header2': 'value2'});
    xhr = MockXhr.$$lastInstance;

    expect(xhr.$$reqHeaders).toEqual({
      'X-header1': 'value1',
      'X-header2': 'value2'
    });
  });

  it('should set requested headers even if they have falsy values', () => {
    $backend('POST', 'URL', null, noop, {
      'X-header1': 0,
      'X-header2': '',
      'X-header3': false,
      'X-header4': undefined
    });

    xhr = MockXhr.$$lastInstance;

    expect(xhr.$$reqHeaders).toEqual({
      'X-header1': 0,
      'X-header2': '',
      'X-header3': false
    });
  });

  it('should not try to read response data when request is aborted', () => {
    callback.and.callFake((status, response, headers, statusText) => {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
    });
    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort');

    $browser.defer.flush();
    expect(xhr.abort).toHaveBeenCalledOnce();

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should complete the request on timeout', () => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('timeout');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.ontimeout();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should complete the request on abort', () => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('abort');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.onabort();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should complete the request on error', () => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(response).toBe(null);
      expect(headers).toBe(null);
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('error');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.onerror();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should complete the request on success', () => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(200);
      expect(response).toBe('response');
      expect(headers).toBe('');
      expect(statusText).toBe('');
      expect(xhrStatus).toBe('complete');
    });
    $backend('GET', '/url', null, callback, {});
    xhr = MockXhr.$$lastInstance;

    expect(callback).not.toHaveBeenCalled();

    xhr.statusText = '';
    xhr.response = 'response';
    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should abort request on numerical timeout', () => {
    callback.and.callFake((status, response) => {
      expect(status).toBe(-1);
    });

    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort');

    expect($browser.deferredFns[0].time).toBe(2000);

    $browser.defer.flush();
    expect(xhr.abort).toHaveBeenCalledOnce();

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledOnce();
  });


  it('should abort request on $timeout promise resolution', inject(($timeout) => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('timeout');
    });

    $backend('GET', '/url', null, callback, {}, $timeout(noop, 2000));
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort');

    $timeout.flush();
    expect(xhr.abort).toHaveBeenCalledOnce();

    xhr.status = 0;
    xhr.onabort();
    expect(callback).toHaveBeenCalledOnce();
  }));


  it('should not abort resolved request on timeout promise resolution', inject(($timeout) => {
    callback.and.callFake((status, response) => {
      expect(status).toBe(200);
    });

    $backend('GET', '/url', null, callback, {}, $timeout(noop, 2000));
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort');

    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledOnce();

    $timeout.flush();
    expect(xhr.abort).not.toHaveBeenCalled();
  }));


  it('should abort request on canceler promise resolution', inject(($q, $browser) => {
    const canceler = $q.defer();

    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('abort');
    });

    $backend('GET', '/url', null, callback, {}, canceler.promise);
    xhr = MockXhr.$$lastInstance;

    canceler.resolve();
    $browser.defer.flush();

    expect(callback).toHaveBeenCalledOnce();
  }));


  it('should cancel timeout on completion', () => {
    callback.and.callFake((status, response) => {
      expect(status).toBe(200);
    });

    $backend('GET', '/url', null, callback, {}, 2000);
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort');

    expect($browser.deferredFns[0].time).toBe(2000);

    xhr.status = 200;
    xhr.onload();
    expect(callback).toHaveBeenCalledOnce();

    expect($browser.deferredFns.length).toBe(0);
    expect(xhr.abort).not.toHaveBeenCalled();
  });


  it('should call callback with xhrStatus "abort" on explicit xhr.abort() when $timeout is set', inject(($timeout) => {
    callback.and.callFake((status, response, headers, statusText, xhrStatus) => {
      expect(status).toBe(-1);
      expect(xhrStatus).toBe('abort');
    });

    $backend('GET', '/url', null, callback, {}, $timeout(noop, 2000));
    xhr = MockXhr.$$lastInstance;
    spyOn(xhr, 'abort').and.callThrough();

    xhr.abort();

    expect(callback).toHaveBeenCalledOnce();
  }));


  it('should set withCredentials', () => {
    $backend('GET', '/some.url', null, callback, {}, null, true);
    expect(MockXhr.$$lastInstance.withCredentials).toBe(true);
  });


  it('should call $xhrFactory with method and url', () => {
    const mockXhrFactory = jasmine.createSpy('mockXhrFactory').and.callFake(createMockXhr);
    $backend = createHttpBackend($browser, mockXhrFactory, $browser.defer, $jsonpCallbacks, fakeDocument);
    $backend('GET', '/some-url', 'some-data', noop);
    expect(mockXhrFactory).toHaveBeenCalledWith('GET', '/some-url');
  });


  it('should set up event listeners', () => {
    const progressFn = function() {};
    const uploadProgressFn = function() {};
    $backend('GET', '/url', null, callback, {}, null, null, null,
        {progress: progressFn}, {progress: uploadProgressFn});
    xhr = MockXhr.$$lastInstance;
    expect(xhr.$$events.progress[0]).toBe(progressFn);
    expect(xhr.upload.$$events.progress[0]).toBe(uploadProgressFn);
  });


  describe('responseType', () => {

    it('should set responseType and return xhr.response', () => {
      $backend('GET', '/whatever', null, callback, {}, null, null, 'blob');

      const xhrInstance = MockXhr.$$lastInstance;
      expect(xhrInstance.responseType).toBe('blob');

      callback.and.callFake((status, response) => {
        expect(response).toBe(xhrInstance.response);
      });

      xhrInstance.response = {some: 'object'};
      xhrInstance.onload();

      expect(callback).toHaveBeenCalledOnce();
    });


    it('should read responseText if response was not defined', () => {
      //  old browsers like IE9, don't support responseType, so they always respond with responseText

      $backend('GET', '/whatever', null, callback, {}, null, null, 'blob');

      const xhrInstance = MockXhr.$$lastInstance;
      const responseText = '{"some": "object"}';
      expect(xhrInstance.responseType).toBe('blob');

      callback.and.callFake((status, response) => {
        expect(response).toBe(responseText);
      });

      xhrInstance.responseText = responseText;
      xhrInstance.onload();

      expect(callback).toHaveBeenCalledOnce();
    });
  });


  describe('JSONP', () => {

    const SCRIPT_URL = /([^?]*)\?cb=(.*)/;


    it('should add script tag for JSONP request', () => {
      callback.and.callFake((status, response) => {
        expect(status).toBe(200);
        expect(response).toBe('some-data');
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);

      const script = fakeDocument.$$scripts.shift();
          const url = script.src.match(SCRIPT_URL);

      expect(url[1]).toBe('http://example.org/path');
      $jsonpCallbacks[url[2]]('some-data');
      browserTrigger(script, 'load');

      expect(callback).toHaveBeenCalledOnce();
    });


    it('should clean up the callback and remove the script', () => {
      spyOn($jsonpCallbacks, 'removeCallback').and.callThrough();

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback);
      expect(fakeDocument.$$scripts.length).toBe(1);


      const script = fakeDocument.$$scripts.shift();
          const callbackId = script.src.match(SCRIPT_URL)[2];

      $jsonpCallbacks[callbackId]('some-data');
      browserTrigger(script, 'load');

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
      expect(fakeDocument.body.removeChild).toHaveBeenCalledOnceWith(script);
    });


    it('should set url to current location if not specified or empty string', () => {
      $backend('JSONP', undefined, null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
      fakeDocument.$$scripts.shift();

      $backend('JSONP', '', null, callback);
      expect(fakeDocument.$$scripts[0].src).toBe($browser.url());
    });


    it('should abort request on timeout and remove JSONP callback', () => {
      spyOn($jsonpCallbacks, 'removeCallback').and.callThrough();

      callback.and.callFake((status, response) => {
        expect(status).toBe(-1);
      });

      $backend('JSONP', 'http://example.org/path?cb=JSON_CALLBACK', null, callback, null, 2000);
      expect(fakeDocument.$$scripts.length).toBe(1);
      expect($browser.deferredFns[0].time).toBe(2000);

      const script = fakeDocument.$$scripts.shift();
        const callbackId = script.src.match(SCRIPT_URL)[2];

      $browser.defer.flush();
      expect(fakeDocument.$$scripts.length).toBe(0);
      expect(callback).toHaveBeenCalledOnce();

      expect($jsonpCallbacks.removeCallback).toHaveBeenCalledOnceWith(callbackId);
    });


    // TODO(vojta): test whether it fires "async-start"
    // TODO(vojta): test whether it fires "async-end" on both success and error
  });


  describe('protocols that return 0 status code', () => {

    function respond(status, content) {
      xhr = MockXhr.$$lastInstance;
      xhr.status = status;
      xhr.responseText = content;
      xhr.onload();
    }

    beforeEach(() => {
      $backend = createHttpBackend($browser, createMockXhr);
    });


    it('should convert 0 to 200 if content and file protocol', () => {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(200);
    });

    it('should convert 0 to 200 if content for protocols other than file', () => {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, 'SOME CONTENT');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(200);
    });

    it('should convert 0 to 404 if no content and file protocol', () => {
      $backend('GET', 'file:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(404);
    });

    it('should not convert 0 to 404 if no content for protocols other than file', () => {
      $backend('GET', 'someProtocol:///whatever/index.html', null, callback);
      respond(0, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(0);
    });

    it('should convert 0 to 404 if no content - relative url', () => {
      /* global urlParsingNode: true */
      const originalUrlParsingNode = urlParsingNode;

      // temporarily overriding the DOM element to pretend that the test runs origin with file:// protocol
      urlParsingNode = {
        hash: '#/C:/',
        host: '',
        hostname: '',
        href: 'file:///C:/base#!/C:/foo',
        pathname: '/C:/foo',
        port: '',
        protocol: 'file:',
        search: '',
        setAttribute: () => {}
      };

      try {

        $backend('GET', '/whatever/index.html', null, callback);
        respond(0, '');

        expect(callback).toHaveBeenCalled();
        expect(callback.calls.mostRecent().args[0]).toBe(404);

      } finally {
        urlParsingNode = originalUrlParsingNode;
      }
    });

    it('should return original backend status code if different from 0', () => {
      // request to http://
      $backend('POST', 'http://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(201);


      // request to file://
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(201, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(201);

      // request to file:// with HTTP status >= 300
      $backend('POST', 'file://rest_api/create_whatever', null, callback);
      respond(503, '');

      expect(callback).toHaveBeenCalled();
      expect(callback.calls.mostRecent().args[0]).toBe(503);
    });
  });
});

