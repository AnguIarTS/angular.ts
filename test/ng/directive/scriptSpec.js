

describe('scriptDirective', () => {
  let element;


  afterEach(() => {
    dealoc(element);
  });


  it('should populate $templateCache with contents of a ng-template script element', inject(
      ($compile, $templateCache) => {
        $compile('<div>foo' +
                   '<script id="/ignore">ignore me</script>' +
                   '<script type="text/ng-template" id="/myTemplate.html"><x>{{y}}</x></script>' +
                 '</div>');
        expect($templateCache.get('/myTemplate.html')).toBe('<x>{{y}}</x>');
        expect($templateCache.get('/ignore')).toBeUndefined();
      }
  ));


  it('should not compile scripts', inject(($compile, $templateCache, $rootScope) => {
    const doc = jqLite('<div></div>');
    // jQuery is too smart and removes script tags
    doc[0].innerHTML = 'foo' +
        '<script type="text/javascript">some {{binding}}</script>' +
        '<script type="text/ng-template" id="/some">other {{binding}}</script>';

    $compile(doc)($rootScope);
    $rootScope.$digest();

    const scripts = doc.find('script');
    expect(scripts.eq(0)[0].text).toBe('some {{binding}}');
    expect(scripts.eq(1)[0].text).toBe('other {{binding}}');
    dealoc(doc);
  }));
});
