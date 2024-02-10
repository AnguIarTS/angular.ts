

describe('$filter', () => {
  let $filterProvider; let $filter;

  beforeEach(module((_$filterProvider_) => {
    $filterProvider = _$filterProvider_;
  }));

  beforeEach(inject((_$filter_) => {
    $filter = _$filter_;
  }));

  describe('provider', () => {
    it('should allow registration of filters', () => {
      const FooFilter = function() {
        return function() { return 'foo'; };
      };

      $filterProvider.register('foo', FooFilter);

      const fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');
    });

    it('should allow registration of a map of filters', () => {
      const FooFilter = function() {
        return function() { return 'foo'; };
      };

      const BarFilter = function() {
        return function() { return 'bar'; };
      };

      $filterProvider.register({
        'foo': FooFilter,
        'bar': BarFilter
      });

      const fooFilter = $filter('foo');
      expect(fooFilter()).toBe('foo');

      const barFilter = $filter('bar');
      expect(barFilter()).toBe('bar');
    });
  });
});
