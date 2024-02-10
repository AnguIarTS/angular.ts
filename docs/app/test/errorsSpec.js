

describe('errors', () => {
  // Mock `ngSanitize` module
  angular.
    module('ngSanitize', []).
    value('$sanitize', jasmine.createSpy('$sanitize').and.callFake(angular.identity));

  beforeEach(module('errors'));


  describe('errorDisplay', () => {
    let $sanitize;
    let errorLinkFilter;

    beforeEach(inject((_$sanitize_, _errorLinkFilter_) => {
      $sanitize = _$sanitize_;
      errorLinkFilter = _errorLinkFilter_;
    }));


    it('should return empty input unchanged', () => {
      const inputs = [undefined, null, false, 0, ''];
      let remaining = inputs.length;

      inputs.forEach((falsyValue) => {
        expect(errorLinkFilter(falsyValue)).toBe(falsyValue);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should recognize URLs and convert them to `<a>`', () => {
      const urls = [
        ['ftp://foo/bar?baz#qux'],
        ['http://foo/bar?baz#qux'],
        ['https://foo/bar?baz#qux'],
        ['mailto:foo_bar@baz.qux', null, 'foo_bar@baz.qux'],
        ['foo_bar@baz.qux', 'mailto:foo_bar@baz.qux', 'foo_bar@baz.qux']
      ];
      let remaining = urls.length;

      urls.forEach((values) => {
        const actualUrl = values[0];
        const expectedUrl = values[1] || actualUrl;
        const expectedText = values[2] || expectedUrl;
        const anchor = `<a href="${  expectedUrl  }">${  expectedText  }</a>`;

        const input = `start ${  actualUrl  } end`;
        const output = `start ${  anchor  } end`;

        expect(errorLinkFilter(input)).toBe(output);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should not recognize stack-traces as URLs', () => {
      const urls = [
        'ftp://foo/bar?baz#qux:4:2',
        'http://foo/bar?baz#qux:4:2',
        'https://foo/bar?baz#qux:4:2',
        'mailto:foo_bar@baz.qux:4:2',
        'foo_bar@baz.qux:4:2'
      ];
      let remaining = urls.length;

      urls.forEach((url) => {
        const input = `start ${  url  } end`;

        expect(errorLinkFilter(input)).toBe(input);
        remaining--;
      });

      expect(remaining).toBe(0);
    });


    it('should should set `[target]` if specified', () => {
      const url = 'https://foo/bar?baz#qux';
      const target = '_blank';
      const outputWithoutTarget = `<a href="${  url  }">${  url  }</a>`;
      const outputWithTarget = `<a target="${  target  }" href="${  url  }">${  url  }</a>`;

      expect(errorLinkFilter(url)).toBe(outputWithoutTarget);
      expect(errorLinkFilter(url, target)).toBe(outputWithTarget);
    });


    it('should truncate the contents of the generated `<a>` to 60 characters', () => {
      const looongUrl = 'https://foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo';
      const truncatedUrl = 'https://foooooooooooooooooooooooooooooooooooooooooooooooo...';
      const output = `<a href="${  looongUrl  }">${  truncatedUrl  }</a>`;

      expect(looongUrl.length).toBeGreaterThan(60);
      expect(truncatedUrl.length).toBe(60);
      expect(errorLinkFilter(looongUrl)).toBe(output);
    });


    it('should pass the final string through `$sanitize`', () => {
      $sanitize.calls.reset();

      const input = 'start https://foo/bar?baz#qux end';
      const output = errorLinkFilter(input);

      expect($sanitize).toHaveBeenCalledTimes(1);
      expect($sanitize).toHaveBeenCalledWith(output);
    });
  });


  describe('errorDisplay', () => {
    let $compile;
    let $location;
    let $rootScope;
    let errorLinkFilter;

    beforeEach(module(($provide) => {
      $provide.decorator('errorLinkFilter', () => {
        errorLinkFilter = jasmine.createSpy('errorLinkFilter');
        errorLinkFilter.and.callFake(angular.identity);

        return errorLinkFilter;
      });
    }));
    beforeEach(inject((_$compile_, _$location_, _$rootScope_) => {
      $compile = _$compile_;
      $location = _$location_;
      $rootScope = _$rootScope_;
    }));


    it('should set the element\'s HTML', () => {
      const elem = $compile('<span error-display="bar">foo</span>')($rootScope);
      expect(elem.html()).toBe('bar');
    });


    it('should interpolate the contents against `$location.search()`', () => {
      spyOn($location, 'search').and.returnValue({p0: 'foo', p1: 'bar'});

      const elem = $compile('<span error-display="foo = {0}, bar = {1}"></span>')($rootScope);
      expect(elem.html()).toBe('foo = foo, bar = bar');
    });


    it('should pass the interpolated text through `errorLinkFilter`', () => {
      $location.search = jasmine.createSpy('search').and.returnValue({p0: 'foo'});

      $compile('<span error-display="foo = {0}"></span>')($rootScope);
      expect(errorLinkFilter).toHaveBeenCalledTimes(1);
      expect(errorLinkFilter).toHaveBeenCalledWith('foo = foo', '_blank');
    });


    it('should encode `<` and `>`', () => {
      const elem = $compile('<span error-display="&lt;xyz&gt;"></span>')($rootScope);
      expect(elem.text()).toBe('<xyz>');
    });
  });
});
