

describe('service pages', () => {

  it('should show the related provider if there is one', () => {
    browser.get('build/docs/index.html#!/api/ng/service/$compile');
    let providerLink = element.all(by.css('ol.api-profile-header-structure li a')).first();
    expect(providerLink.getText()).toEqual('- $compileProvider');
    expect(providerLink.getAttribute('href')).toMatch(/api\/ng\/provider\/\$compileProvider/);

    browser.get('build/docs/index.html#!/api/ng/service/$q');
    providerLink = element.all(by.css('ol.api-profile-header-structure li a')).first();
    expect(providerLink.getText()).not.toEqual('- $compileProvider');
    expect(providerLink.getAttribute('href')).not.toMatch(/api\/ng\/provider\/\$compileProvider/);
  });

  it('should show parameter defaults', () => {
    browser.get('build/docs/index.html#!/api/ng/service/$timeout');
    expect(element.all(by.css('.input-arguments p em')).first().getText()).toContain('(default: 0)');
  });

});
