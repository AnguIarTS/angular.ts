

describe('animation option helper functions', () => {

  beforeEach(module('ngAnimate'));

  let element; let applyAnimationClasses;
  beforeEach(inject(($$jqLite) => {
    applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
    element = jqLite('<div></div>');
  }));

  describe('prepareAnimationOptions', () => {
    it('should construct an options wrapper from the provided options',
      inject(() => {

      const options = prepareAnimationOptions({
        value: 'hello'
      });

      expect(options.value).toBe('hello');
    }));

    it('should return the same instance it already instantiated as an options object with the given element',
      inject(() => {

      const options = prepareAnimationOptions({});
      expect(prepareAnimationOptions(options)).toBe(options);

      const options2 = {};
      expect(prepareAnimationOptions(options2)).not.toBe(options);
    }));
  });

  describe('applyAnimationStyles', () => {
    it('should apply the provided `from` styles', inject(() => {
      const options = prepareAnimationOptions({
        from: { color: 'maroon' },
        to: { color: 'blue' }
      });

      applyAnimationFromStyles(element, options);
      expect(element.attr('style')).toContain('maroon');
    }));

    it('should apply the provided `to` styles', inject(() => {
      const options = prepareAnimationOptions({
        from: { color: 'red' },
        to: { color: 'black' }
      });

      applyAnimationToStyles(element, options);
      expect(element.attr('style')).toContain('black');
    }));

    it('should apply the both provided `from` and `to` styles', inject(() => {
      const options = prepareAnimationOptions({
        from: { color: 'red', 'font-size':'50px' },
        to: { color: 'green' }
      });

      applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('green');
      expect(element.css('font-size')).toBe('50px');
    }));

    it('should only apply the options once', inject(() => {
      const options = prepareAnimationOptions({
        from: { color: 'red', 'font-size':'50px' },
        to: { color: 'blue' }
      });

      applyAnimationStyles(element, options);
      expect(element.attr('style')).toContain('blue');

      element.attr('style', '');

      applyAnimationStyles(element, options);
      expect(element.attr('style') || '').toBe('');
    }));
  });

  describe('applyAnimationClasses', () => {
    it('should add/remove the provided CSS classes', inject(() => {
      element.addClass('four six');
      const options = prepareAnimationOptions({
        addClass: 'one two three',
        removeClass: 'four'
      });

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('one two three');
      expect(element).toHaveClass('six');
      expect(element).not.toHaveClass('four');
    }));

    it('should add/remove the provided CSS classes only once', inject(() => {
      element.attr('class', 'blue');
      const options = prepareAnimationOptions({
        addClass: 'black',
        removeClass: 'blue'
      });

      applyAnimationClasses(element, options);
      element.attr('class', 'blue');

      applyAnimationClasses(element, options);
      expect(element).toHaveClass('blue');
      expect(element).not.toHaveClass('black');
    }));
  });

  describe('mergeAnimationDetails', () => {
    it('should merge in new options', inject(() => {
      element.attr('class', 'blue');
      const options = prepareAnimationOptions({
        name: 'matias',
        age: 28,
        addClass: 'black',
        removeClass: 'blue gold'
      });

      const animation1 = { options };
      const animation2 = {
        options: {
          age: 29,
          addClass: 'gold brown',
          removeClass: 'orange'
        }
      };

      mergeAnimationDetails(element, animation1, animation2);

      expect(options.name).toBe('matias');
      expect(options.age).toBe(29);
      expect(options.addClass).toBe('black brown');
      expect(options.removeClass).toBe('blue');
    }));
  });
});
