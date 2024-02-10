

describe('API pages', () => {

  it('should display links to code on GitHub', () => {
    browser.get('build/docs/index.html#!/api/ng/service/$http');
    expect(element(by.css('.improve-docs')).getAttribute('href')).toMatch(/https?:\/\/github\.com\/angular\/angular\.js\/edit\/.+\/src\/ng\/http\.js/);

    browser.get('build/docs/index.html#!/api/ng/service/$http');
    expect(element(by.css('.view-source')).getAttribute('href')).toMatch(/https?:\/\/github\.com\/angular\/angular\.js\/tree\/.+\/src\/ng\/http\.js#L\d+/);
  });

  it('should change the page content when clicking a link to a service', () => {
    browser.get('build/docs/index.html');

    const ngBindLink = element(by.css('.definition-table td a[href="api/ng/directive/ngClick"]'));
    ngBindLink.click();

    const mainHeader = element(by.css('.main-body h1 '));
    expect(mainHeader.getText()).toEqual('ngClick');
  });


  it('should show the functioning input directive example', () => {
    browser.get('build/docs/index.html#!/api/ng/directive/input');

    // Ensure that the page is loaded before trying to switch frames.
    browser.waitForAngular();

    browser.switchTo().frame('example-input-directive');

    const nameInput = element(by.model('user.name'));
    nameInput.sendKeys('!!!');

    const code = element.all(by.css('tt')).first();
    expect(code.getText()).toContain('guest!!!');
  });

  it('should trim indentation from code blocks', () => {
    browser.get('build/docs/index.html#!/api/ng/type/$rootScope.Scope');

    const codeBlocks = element.all(by.css('pre > code.lang-js'));
    codeBlocks.each((codeBlock) => {
      const firstSpan = codeBlock.all(by.css('span')).first();
      expect(firstSpan.getText()).not.toMatch(/^\W+$/);
    });
  });
});
