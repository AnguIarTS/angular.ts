

/**
 * This scenario checks the presence of the table of contents for a sample of pages - API and guide.
 * The expectations are kept vague so that they can be easily adjusted when the docs change.
 */

describe('table of contents', () => {

  it('on provider pages', () => {
    browser.get('build/docs/index.html#!/api/ng/provider/$controllerProvider');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Methods');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(2);

      expect(match[1].all(by.css('li')).count()).toBe(2);
    });

  });

  it('on service pages', () => {
    browser.get('build/docs/index.html#!/api/ng/service/$controller');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Usage');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(3);

      expect(match[2].all(by.css('li')).count()).toBe(2);
    });
  });

  it('on directive pages', () => {
    browser.get('build/docs/index.html#!/api/ng/directive/input');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Usage');
      expect(text.join('')).toContain('Directive Info');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(4);

      expect(match[2].all(by.css('li')).count()).toBe(1);
    });
  });

  it('on function pages', () => {
    browser.get('build/docs/index.html#!/api/ng/function/angular.bind');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Usage');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(2);

      expect(match[1].all(by.css('li')).count()).toBe(2);
    });
  });

  it('on type pages', () => {
    browser.get('build/docs/index.html#!/api/ng/type/ModelOptions');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Methods');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(2);

      expect(match[1].all(by.css('li')).count()).toBe(2);
    });
  });

  it('on filter pages', () => {
    browser.get('build/docs/index.html#!/api/ng/filter/date');

    const toc = element.all(by.css('toc-container > div > toc-tree'));
    toc.getText().then((text) => {
      expect(text.join('')).toContain('Overview');
      expect(text.join('')).toContain('Usage');
    });

    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(3);

      expect(match[1].all(by.css('li')).count()).toBe(2);
    });
  });

  it('on guide pages', () => {
    browser.get('build/docs/index.html#!/guide/services');
    const tocFirstLevel = element.all(by.css('toc-container > div > toc-tree > ul > li'));

    tocFirstLevel.then((match) => {
      expect(match.length).toBe(5);

      expect(match[1].all(by.css('li')).count()).toBe(3);
    });
  });
});
