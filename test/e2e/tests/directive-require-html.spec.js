

describe('require parent controller on html element', () => {
  it('should not use the html element as the parent element', () => {

    loadFixture('directive-require-html');

    expect(element(by.id('container')).getText()).toContain('Controller \'requireTargetDirective\', required by directive \'requireDirective\', can\'t be found!');
  });
});
