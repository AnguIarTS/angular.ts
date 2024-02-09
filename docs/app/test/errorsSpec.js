

describe('errors', function() {
  // Mock `ngSanitize` module
  angular.
    module('ngSanitize', []).
    value('$sanitize', jasmine.createSpy('$sanitize').and.callFake(angular.identity));

  beforeEach(module('errors'));


  describe('errorDisplay', function() {
    let $sanitize;
    let errorLinkFilter;

    beforeEach(inject(function(_$sanitize_, _errorLinkFilter_) {
      $sanitize = _$sanitize_;
      errorLinkFilter = _errorLinkFilter_;
    }));


    it('should return empty input unchanged', function() {
      let inputs = [undefined, null, false, 0, ''];
      let remaining = inputs.length;

      inputs.forEach(function(falsyValue) {
        expect(errorLinkFilter(falsyValue)).toBe(falsyValue);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should recognize URLs and convert them to `<a>`', function() {
      let urls = [
        ['ftp://foo/bar?baz#qux'],
        ['http://foo/bar?baz#qux'],
        ['https://foo/bar?baz#qux'],
        ['mailto:foo_bar@baz.qux', null, 'foo_bar@baz.qux'],
        ['foo_bar@baz.qux', 'mailto:foo_bar@baz.qux', 'foo_bar@baz.qux']
      ];
      let remaining = urls.length;

      urls.forEach(function(values) {
        let actualUrl = values[0];
        let expectedUrl = values[1] || actualUrl;
        let expectedText = values[2] || expectedUrl;
        let anchor = '<a href="' + expectedUrl + '">' + expectedText + '</a>';

        let input = 'start ' + actualUrl + ' end';
        let output = 'start ' + anchor + ' end';

        expect(errorLinkFilter(input)).toBe(output);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should not recognize stack-traces as URLs', function() {
      let urls = [
        'ftp://foo/bar?baz#qux:4:2',
        'http://foo/bar?baz#qux:4:2',
        'https://foo/bar?baz#qux:4:2',
        'mailto:foo_bar@baz.qux:4:2',
        'foo_bar@baz.qux:4:2'
      ];
      let remaining = urls.length;

      urls.forEach(function(url) {
        let input = 'start ' + url + ' end';

        expect(errorLinkFilter(input)).toBe(input);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should should set `[target]` if specified', function() {
      let url = 'https://foo/bar?baz#qux';
      let target = '_blank';
      let outputWithoutTarget = '<a href="' + url + '">' + url + '</a>';
      let outputWithTarget = '<a target="' + target + '" href="' + url + '">' + url + '</a>';

      expect(errorLinkFilter(url)).toBe(outputWithoutTarget);
      expect(errorLinkFilter(url, target)).toBe(outputWithTarget);
    });


    it('should truncate the contents of the generated `<a>` to 60 characters', function() {
      let looongUrl = 'https://foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo';
      let truncatedUrl = 'https://foooooooooooooooooooooooooooooooooooooooooooooooo...';
      let output = '<a href="' + looongUrl + '">' + truncatedUrl + '</a>';

      expect(looongUrl.length).toBeGreaterThan(60);
      expect(truncatedUrl.length).toBe(60);
      expect(errorLinkFilter(looongUrl)).toBe(output);
    });


    it('should pass the final string through `$sanitize`', function() {
      $sanitize.calls.reset();

      let input = 'start https://foo/bar?baz#qux end';
      let output = errorLinkFilter(input);

      expect($sanitize).toHaveBeenCalledTimes(1);
      expect($sanitize).toHaveBeenCalledWith(output);
    });
  });


  describe('errorDisplay', function() {
    let $compile;
    let $location;
    let $rootScope;
    let errorLinkFilter;

    beforeEach(module(function($provide) {
      $provide.decorator('errorLinkFilter', function() {
        errorLinkFilter = jasmine.createSpy('errorLinkFilter');
        errorLinkFilter.and.callFake(angular.identity);

        return errorLinkFilter;
      });
    }));
    beforeEach(inject(function(_$compile_, _$location_, _$rootScope_) {
      $compile = _$compile_;
      $location = _$location_;
      $rootScope = _$rootScope_;
    }));


    it('should set the element\'s HTML', function() {
      let elem = $compile('<span error-display="bar">foo</span>')($rootScope);
      expect(elem.html()).toBe('bar');
    });


    it('should interpolate the contents against `$location.search()`', function() {
      spyOn($location, 'search').and.returnValue({p0: 'foo', p1: 'bar'});

      let elem = $compile('<span error-display="foo = {0}, bar = {1}"></span>')($rootScope);
      expect(elem.html()).toBe('foo = foo, bar = bar');
    });


    it('should pass the interpolated text through `errorLinkFilter`', function() {
      $location.search = jasmine.createSpy('search').and.returnValue({p0: 'foo'});

      $compile('<span error-display="foo = {0}"></span>')($rootScope);
      expect(errorLinkFilter).toHaveBeenCalledTimes(1);
      expect(errorLinkFilter).toHaveBeenCalledWith('foo = foo', '_blank');
    });


    it('should encode `<` and `>`', function() {
      let elem = $compile('<span error-display="&lt;xyz&gt;"></span>')($rootScope);
      expect(elem.text()).toBe('<xyz>');
    });
  });
});
