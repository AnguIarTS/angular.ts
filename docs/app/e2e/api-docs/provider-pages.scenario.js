

describe('provider pages', () => {

  it('should show the related service', () => {
    browser.get('build/docs/index.html#!/api/ng/provider/$compileProvider');
    const serviceLink = element.all(by.css('ol.api-profile-header-structure li a')).first();
    expect(serviceLink.getText()).toEqual('- $compile');
    expect(serviceLink.getAttribute('href')).toMatch(/api\/ng\/service\/\$compile/);
  });

});
