

describe('$document', () => {


  it('should inject $document', inject(($document) => {
    expect($document).toEqual(jqLite(window.document));
  }));


  it('should be able to mock $document object', () => {
    module({$document: {}});
    inject(($httpBackend, $http) => {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });


  it('should be able to mock $document array', () => {
    module({$document: [{}]});
    inject(($httpBackend, $http) => {
      $httpBackend.expectGET('/dummy').respond('dummy');
      $http.get('/dummy');
      $httpBackend.flush();
    });
  });
});


describe('$$isDocumentHidden', () => {
  it('should listen on the visibilitychange event', () => {
    let doc;

    const spy = spyOn(window.document, 'addEventListener').and.callThrough();

    inject(($$isDocumentHidden, $document) => {
      expect(spy.calls.mostRecent().args[0]).toBe('visibilitychange');
      expect(spy.calls.mostRecent().args[1]).toEqual(jasmine.any(Function));
      expect($$isDocumentHidden()).toBeFalsy(); // undefined in browsers that don't support visibility
    });

  });

  it('should remove the listener when the $rootScope is destroyed', () => {
    const spy = spyOn(window.document, 'removeEventListener').and.callThrough();

    inject(($$isDocumentHidden, $rootScope) => {
      $rootScope.$destroy();
      expect(spy.calls.mostRecent().args[0]).toBe('visibilitychange');
      expect(spy.calls.mostRecent().args[1]).toEqual(jasmine.any(Function));
    });
  });
});
