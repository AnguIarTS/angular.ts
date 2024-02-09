

describe('$filter', function() {
  let $filterProvider, $filter;

  beforeEach(module(function(_$filterProvider_) {
    $filterProvider = _$filterProvider_;
  }));

  beforeEach(inject(function(_$filter_) {
    $filter = _$filter_;
  }));

  describe('provider', function() {
    it('should allow registration of filters', function() {
      let FooFilter = function() {
        return function() { return 'foo'; };
      };

      $filterProvider.register('foo', FooFilter);

      let fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');
    });

    it('should allow registration of a map of filters', function() {
      let FooFilter = function() {
        return function() { return 'foo'; };
      };

      let BarFilter = function() {
        return function() { return 'bar'; };
      };

      $filterProvider.register({
        'foo': FooFilter,
        'bar': BarFilter
      });

      let fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');

      let barFilter = $filter('bar');
      expect(barFilter()).toBe('bar');
    });
  });
});
