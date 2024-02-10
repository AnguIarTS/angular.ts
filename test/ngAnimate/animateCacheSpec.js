

describe('ngAnimate $$animateCache', () => {
  beforeEach(module('ngAnimate'));

  it('should store the details in a lookup', inject(($$animateCache) => {
    const data = { 'hello': 'there' };
    $$animateCache.put('key', data, true);
    expect($$animateCache.get('key')).toBe(data);
  }));

  it('should update existing stored details in a lookup', inject(($$animateCache) => {
    const data = { 'hello': 'there' };
    $$animateCache.put('key', data, true);

    const otherData = { 'hi': 'you' };
    $$animateCache.put('key', otherData, true);
    expect($$animateCache.get('key')).toBe(otherData);
  }));

  it('should create a special cacheKey based on the element/parent and className relationship', inject(($$animateCache) => {
    let cacheKey; const elm = jqLite('<div></div>');
    elm.addClass('one two');

    const parent1 = jqLite('<div></div>');
    parent1.append(elm);

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event');
    expect(cacheKey).toBe('1 event one two');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'add');
    expect(cacheKey).toBe('1 event one two add');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'add', 'remove');
    expect(cacheKey).toBe('1 event one two add remove');

    const parent2 = jqLite('<div></div>');
    parent2.append(elm);

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event');
    expect(cacheKey).toBe('2 event one two');

    cacheKey = $$animateCache.cacheKey(getDomNode(elm), 'event', 'three', 'four');
    expect(cacheKey).toBe('2 event one two three four');
  }));

  it('should keep a count of how many times a cache key has been updated', inject(($$animateCache) => {
    const data = { 'hello': 'there' };
    const key = 'key';
    expect($$animateCache.count(key)).toBe(0);

    $$animateCache.put(key, data, true);
    expect($$animateCache.count(key)).toBe(1);

    const otherData = { 'other': 'data' };
    $$animateCache.put(key, otherData, true);
    expect($$animateCache.count(key)).toBe(2);
  }));

  it('should flush the cache and the counters', inject(($$animateCache) => {
    $$animateCache.put('key1', { data: 'value' }, true);
    $$animateCache.put('key2', { data: 'value' }, true);

    expect($$animateCache.count('key1')).toBe(1);
    expect($$animateCache.count('key2')).toBe(1);

    $$animateCache.flush();

    expect($$animateCache.get('key1')).toBeFalsy();
    expect($$animateCache.get('key2')).toBeFalsy();

    expect($$animateCache.count('key1')).toBe(0);
    expect($$animateCache.count('key2')).toBe(0);
  }));

  describe('containsCachedAnimationWithoutDuration', () => {
    it('should return false if the validity of a key is false', inject(($$animateCache) => {
      const validEntry = { someEssentialProperty: true };
      const invalidEntry = { someEssentialProperty: false };

      $$animateCache.put('key1', validEntry, true);
      $$animateCache.put('key2', invalidEntry, false);

      expect($$animateCache.containsCachedAnimationWithoutDuration('key1')).toBe(false);
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(true);
    }));

    it('should return false if the key does not exist in the cache', inject(($$animateCache) => {
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(false);

      $$animateCache.put('key2', {}, false);
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(true);

      $$animateCache.flush();
      expect($$animateCache.containsCachedAnimationWithoutDuration('key2')).toBe(false);
    }));
  });

});
