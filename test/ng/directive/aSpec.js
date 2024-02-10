

describe('a', () => {
  let element; let $compile; let $rootScope;

  beforeEach(module(($compileProvider) => {
    $compileProvider.
      directive('linkTo', valueFn({
        restrict: 'A',
        template: '<div class="my-link"><a href="{{destination}}">{{destination}}</a></div>',
        replace: true,
        scope: {
          destination: '@linkTo'
        }
      })).
      directive('linkNot', valueFn({
        restrict: 'A',
        template: '<div class="my-link"><a href>{{destination}}</a></div>',
        replace: true,
        scope: {
          destination: '@linkNot'
        }
      }));
  }));

  beforeEach(inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));


  afterEach(() => {
    dealoc(element);
  });


  it('should prevent default action to be executed when href is empty', () => {
    const orgLocation = window.document.location.href;
        let preventDefaultCalled = false;
        let event;

    element = $compile('<a href="">empty link</a>')($rootScope);

    event = window.document.createEvent('MouseEvent');
    event.initMouseEvent(
      'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

    event.preventDefaultOrg = event.preventDefault;
    event.preventDefault = function() {
      preventDefaultCalled = true;
      if (this.preventDefaultOrg) this.preventDefaultOrg();
    };

    element[0].dispatchEvent(event);

    expect(preventDefaultCalled).toEqual(true);

    expect(window.document.location.href).toEqual(orgLocation);
  });


  it('should prevent IE for changing text content when setting attribute', () => {
    // see issue #1949
    element = jqLite('<a href="">hello@you</a>');
    $compile(element);
    element.attr('href', 'bye@me');

    expect(element.text()).toBe('hello@you');
  });


  it('should not link and hookup an event if href is present at compile', () => {
    const jq = jQuery || jqLite;
    element = jq('<a href="//a.com">hello@you</a>');
    const linker = $compile(element);

    spyOn(jq.prototype, 'on');

    linker($rootScope);

    expect(jq.prototype.on).not.toHaveBeenCalled();
  });


  it('should not preventDefault if anchor element is replaced with href-containing element', () => {
    spyOn(jqLite.prototype, 'on').and.callThrough();
    element = $compile('<a link-to="https://www.google.com">')($rootScope);
    $rootScope.$digest();

    const child = element.children('a');
    const preventDefault = jasmine.createSpy('preventDefault');

    child.triggerHandler({
      type: 'click',
      preventDefault
    });

    expect(preventDefault).not.toHaveBeenCalled();
  });


  it('should preventDefault if anchor element is replaced with element without href attribute', () => {
    spyOn(jqLite.prototype, 'on').and.callThrough();
    element = $compile('<a link-not="https://www.google.com">')($rootScope);
    $rootScope.$digest();

    const child = element.children('a');
    const preventDefault = jasmine.createSpy('preventDefault');

    child.triggerHandler({
      type: 'click',
      preventDefault
    });

    expect(preventDefault).toHaveBeenCalled();
  });


  if (isDefined(window.SVGElement)) {
    describe('SVGAElement', () => {
      it('should prevent default action to be executed when href is empty', () => {
        const orgLocation = window.document.location.href;
            let preventDefaultCalled = false;
            let event;
            let child;

        element = $compile('<svg><a xlink:href="">empty link</a></svg>')($rootScope);
        child = element.children('a');

        event = window.document.createEvent('MouseEvent');
        event.initMouseEvent(
          'click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

        event.preventDefaultOrg = event.preventDefault;
        event.preventDefault = function() {
          preventDefaultCalled = true;
          if (this.preventDefaultOrg) this.preventDefaultOrg();
        };

        child[0].dispatchEvent(event);

        expect(preventDefaultCalled).toEqual(true);
        expect(window.document.location.href).toEqual(orgLocation);
      });


      it('should not link and hookup an event if xlink:href is present at compile', () => {
        const jq = jQuery || jqLite;
        element = jq('<svg><a xlink:href="bobby">hello@you</a></svg>');
        const linker = $compile(element);

        spyOn(jq.prototype, 'on');

        linker($rootScope);

        expect(jq.prototype.on).not.toHaveBeenCalled();
      });
    });
  }
});
