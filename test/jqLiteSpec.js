

describe('jqLite', () => {
  let scope; let a; let b; let c; let document;

  // Checks if jQuery 2.1 is used.
  function isJQuery21() {
    if (_jqLiteMode) return false;
    const jQueryVersionParts = _jQuery.fn.jquery.split('.');
    return `${jQueryVersionParts[0]  }.${  jQueryVersionParts[1]}` === '2.1';
  }

  // Checks if jQuery 2.x is used.
  function isJQuery2x() {
    if (_jqLiteMode) return false;
    const jQueryVersionParts = _jQuery.fn.jquery.split('.');
    return jQueryVersionParts[0] === '2';
  }

  beforeEach(module(provideLog));

  beforeEach(() => {
    a = jqLite('<div>A</div>')[0];
    b = jqLite('<div>B</div>')[0];
    c = jqLite('<div>C</div>')[0];
  });


  beforeEach(inject(($rootScope) => {
    document = window.document;
    scope = $rootScope;
    jasmine.addMatchers({
      toJqEqual() {
        return {
          compare(_actual_, expected) {
            let msg = 'Unequal length';
            const message = function() {return msg;};

            let value = _actual_ && expected && _actual_.length === expected.length;
            for (let i = 0; value && i < expected.length; i++) {
              const actual = jqLite(_actual_[i])[0];
              const expect = jqLite(expected[i])[0];
              value = value && equals(expect, actual);
              msg = `Not equal at index: ${  i
                   } - Expected: ${  expect
                   } - Actual: ${  actual}`;
            }
            return { pass: value, message };
          }
        };
      }
    });
  }));


  afterEach(() => {
    dealoc(a);
    dealoc(b);
    dealoc(c);
  });


  it('should be jqLite when jqLiteMode is on, otherwise jQuery', () => {
    expect(jqLite).toBe(_jqLiteMode ? JQLite : _jQuery);
  });


  describe('construction', () => {
    it('should allow construction with text node', () => {
      const text = a.firstChild;
      const selected = jqLite(text);
      expect(selected.length).toEqual(1);
      expect(selected[0]).toEqual(text);
    });


    it('should allow construction with html', () => {
      const nodes = jqLite('<div>1</div><span>2</span>');
      expect(nodes[0].parentNode).toBeDefined();
      expect(nodes[0].parentNode.nodeType).toBe(11); /** Document Fragment * */
      expect(nodes[0].parentNode).toBe(nodes[1].parentNode);
      expect(nodes.length).toEqual(2);
      expect(nodes[0].innerHTML).toEqual('1');
      expect(nodes[1].innerHTML).toEqual('2');
    });


    it('should allow construction of html with leading whitespace', () => {
      const nodes = jqLite('  \n\r   \r\n<div>1</div><span>2</span>');
      expect(nodes[0].parentNode).toBeDefined();
      expect(nodes[0].parentNode.nodeType).toBe(11); /** Document Fragment * */
      expect(nodes[0].parentNode).toBe(nodes[1].parentNode);
      expect(nodes.length).toBe(2);
      expect(nodes[0].innerHTML).toBe('1');
      expect(nodes[1].innerHTML).toBe('2');
    });


    // This is not working correctly in jQuery prior to v2.2.
    // See https://github.com/jquery/jquery/issues/1987 for details.
    it('should properly handle dash-delimited node names', () => {
      if (isJQuery21()) return;

      const nodeNames = 'thead tbody tfoot colgroup caption tr th td div kung'.split(' ');
      let nodeNamesTested = 0;
      let nodes; let customNodeName;

      forEach(nodeNames, (nodeName) => {
        const customNodeName = `${nodeName  }-foo`;
        const nodes = jqLite(`<${  customNodeName  }>Hello, world !</${  customNodeName  }>`);

        expect(nodes.length).toBe(1);
        expect(nodeName_(nodes)).toBe(customNodeName);
        expect(nodes.html()).toBe('Hello, world !');

        nodeNamesTested++;
      });

      expect(nodeNamesTested).toBe(10);
    });


    it('should allow creation of comment tags', () => {
      const nodes = jqLite('<!-- foo -->');
      expect(nodes.length).toBe(1);
      expect(nodes[0].nodeType).toBe(8);
    });


    it('should allow creation of script tags', () => {
      const nodes = jqLite('<script></script>');
      expect(nodes.length).toBe(1);
      expect(nodes[0].tagName.toUpperCase()).toBe('SCRIPT');
    });


    it('should wrap document fragment', () => {
      const fragment = jqLite(document.createDocumentFragment());
      expect(fragment.length).toBe(1);
      expect(fragment[0].nodeType).toBe(11);
    });


    it('should allow construction of <option> elements', () => {
      const nodes = jqLite('<option>');
      expect(nodes.length).toBe(1);
      expect(nodes[0].nodeName.toLowerCase()).toBe('option');
    });

    it('should allow construction of multiple <option> elements', () => {
      const nodes = jqLite('<option></option><option></option>');
      expect(nodes.length).toBe(2);
      expect(nodes[0].nodeName.toLowerCase()).toBe('option');
      expect(nodes[1].nodeName.toLowerCase()).toBe('option');
    });


    // Special tests for the construction of elements which are restricted (in the HTML5 spec) to
    // being children of specific nodes.
    forEach([
      'caption',
      'colgroup',
      'col',
      'optgroup',
      'opt',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'tr'
    ], (name) => {
      it('should allow construction of <$NAME$> elements'.replace('$NAME$', name), () => {
        const nodes = jqLite('<$NAME$>'.replace('$NAME$', name));
        expect(nodes.length).toBe(1);
        expect(nodes[0].nodeName.toLowerCase()).toBe(name);
      });
    });

    describe('security', () => {
      it('shouldn\'t crash at attempts to close the table wrapper', () => {
        // jQuery doesn't pass this test yet.
        if (!_jqLiteMode) return;

        // Support: IE <10
        // In IE 9 we still need to use the old-style innerHTML assignment
        // as that's the only one that works.
        if (msie < 10) return;

        expect(() => {
          // This test case attempts to close the tags which wrap input
          // based on matching done in wrapMap, escaping the wrapper & thus
          // triggering an error when descending.
          const el = jqLite('<td></td></tr></tbody></table><td></td>');
          expect(el.length).toBe(2);
          expect(el[0].nodeName.toLowerCase()).toBe('td');
          expect(el[1].nodeName.toLowerCase()).toBe('td');
        }).not.toThrow();
      });

      it('shouldn\'t unsanitize sanitized code', (done) => {
        // jQuery <3.5.0 fail those tests.
        if (isJQuery2x()) {
          done();
          return;
        }

        let counter = 0;
          const assertCount = 13;
          const container = jqLite('<div></div>');

        function donePartial() {
          counter++;
          if (counter === assertCount) {
            container.remove();
            delete window.xss;
            done();
          }
        }

        jqLite(document.body).append(container);
        window.xss = jasmine.createSpy('xss');

        // Thanks to Masato Kinugawa from Cure53 for providing the following test cases.
        // Note: below test cases need to invoke the xss function with consecutive
        // decimal parameters for the assertions to be correct.
        forEach([
          '<img alt="<x" title="/><img src=url404 onerror=xss(0)>">',
          '<img alt="\n<x" title="/>\n<img src=url404 onerror=xss(1)>">',
          '<style><style/><img src=url404 onerror=xss(2)>',
          '<xmp><xmp/><img src=url404 onerror=xss(3)>',
          '<title><title /><img src=url404 onerror=xss(4)>',
          '<iframe><iframe/><img src=url404 onerror=xss(5)>',
          '<noframes><noframes/><img src=url404 onerror=xss(6)>',
          '<noscript><noscript/><img src=url404 onerror=xss(7)>',
          '<foo" alt="" title="/><img src=url404 onerror=xss(8)>">',
          '<img alt="<x" title="" src="/><img src=url404 onerror=xss(9)>">',
          '<noscript/><img src=url404 onerror=xss(10)>',
          '<noembed><noembed/><img src=url404 onerror=xss(11)>',

          '<option><style></option></select><img src=url404 onerror=xss(12)></style>'
        ], (htmlString, index) => {
          const element = jqLite('<div></div>');

          container.append(element);
          element.append(jqLite(htmlString));

          window.setTimeout(() => {
            expect(window.xss).not.toHaveBeenCalledWith(index);
            donePartial();
          }, 1000);
        });
      });

      it('should allow to restore legacy insecure behavior', () => {
        // jQuery doesn't have this API.
        if (!_jqLiteMode) return;

        // eslint-disable-next-line new-cap
        angular.UNSAFE_restoreLegacyJqLiteXHTMLReplacement();

        const elem = jqLite('<div/><span/>');
        expect(elem.length).toBe(2);
        expect(elem[0].nodeName.toLowerCase()).toBe('div');
        expect(elem[1].nodeName.toLowerCase()).toBe('span');
      });
    });
  });

  describe('_data', () => {
    it('should provide access to the events present on the element', () => {
      const element = jqLite('<i>foo</i>');
      expect(angular.element._data(element[0]).events).toBeUndefined();

      element.on('click', () => { });
      expect(angular.element._data(element[0]).events.click).toBeDefined();
    });
  });

  describe('inheritedData', () => {

    it('should retrieve data attached to the current element', () => {
      const element = jqLite('<i>foo</i>');
      element.data('myData', 'abc');
      expect(element.inheritedData('myData')).toBe('abc');
      dealoc(element);
    });


    it('should walk up the dom to find data', () => {
      const element = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
      const deepChild = jqLite(element[0].getElementsByTagName('b')[0]);
      element.data('myData', 'abc');
      expect(deepChild.inheritedData('myData')).toBe('abc');
      dealoc(element);
    });


    it('should return undefined when no data was found', () => {
      const element = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
      const deepChild = jqLite(element[0].getElementsByTagName('b')[0]);
      expect(deepChild.inheritedData('myData')).toBeFalsy();
      dealoc(element);
    });


    it('should work with the child html element instead if the current element is the document obj',
      () => {
        const item = {};
            const doc = jqLite(document);
            const html = doc.find('html');

        html.data('item', item);
        expect(doc.inheritedData('item')).toBe(item);
        expect(html.inheritedData('item')).toBe(item);
        dealoc(doc);
      }
    );

    it('should return null values', () => {
      const ul = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
          const li = ul.find('li');
          const b = li.find('b');

      ul.data('foo', 'bar');
      li.data('foo', null);
      expect(b.inheritedData('foo')).toBe(null);
      expect(li.inheritedData('foo')).toBe(null);
      expect(ul.inheritedData('foo')).toBe('bar');

      dealoc(ul);
    });

    it('should pass through DocumentFragment boundaries via host', () => {
      const host = jqLite('<div></div>');
          const frag = document.createDocumentFragment();
          const $frag = jqLite(frag);
      frag.host = host[0];
      host.data('foo', 123);
      host.append($frag);
      expect($frag.inheritedData('foo')).toBe(123);

      dealoc(host);
      dealoc($frag);
    });
  });


  describe('scope', () => {
    it('should retrieve scope attached to the current element', () => {
      const element = jqLite('<i>foo</i>');
      element.data('$scope', scope);
      expect(element.scope()).toBe(scope);
      dealoc(element);
    });

    it('should retrieve isolate scope attached to the current element', () => {
      const element = jqLite('<i>foo</i>');
      element.data('$isolateScope', scope);
      expect(element.isolateScope()).toBe(scope);
      dealoc(element);
    });

    it('should retrieve scope attached to the html element if it\'s requested on the document',
        () => {
      const doc = jqLite(document);
          const html = doc.find('html');
          const scope = {};

      html.data('$scope', scope);

      expect(doc.scope()).toBe(scope);
      expect(html.scope()).toBe(scope);
      dealoc(doc);
    });

    it('should walk up the dom to find scope', () => {
      const element = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
      const deepChild = jqLite(element[0].getElementsByTagName('b')[0]);
      element.data('$scope', scope);
      expect(deepChild.scope()).toBe(scope);
      dealoc(element);
    });


    it('should return undefined when no scope was found', () => {
      const element = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
      const deepChild = jqLite(element[0].getElementsByTagName('b')[0]);
      expect(deepChild.scope()).toBeFalsy();
      dealoc(element);
    });
  });


  describe('isolateScope', () => {

    it('should retrieve isolate scope attached to the current element', () => {
      const element = jqLite('<i>foo</i>');
      element.data('$isolateScope', scope);
      expect(element.isolateScope()).toBe(scope);
      dealoc(element);
    });


    it('should not walk up the dom to find scope', () => {
      const element = jqLite('<ul><li><p><b>deep deep</b><p></li></ul>');
      const deepChild = jqLite(element[0].getElementsByTagName('b')[0]);
      element.data('$isolateScope', scope);
      expect(deepChild.isolateScope()).toBeUndefined();
      dealoc(element);
    });


    it('should return undefined when no scope was found', () => {
      const element = jqLite('<div></div>');
      expect(element.isolateScope()).toBeFalsy();
      dealoc(element);
    });
  });


  describe('injector', () => {
    it('should retrieve injector attached to the current element or its parent', () => {
      const template = jqLite('<div><span></span></div>');
        const span = template.children().eq(0);
        const injector = angular.bootstrap(template);


      expect(span.injector()).toBe(injector);
      dealoc(template);
    });


    it('should retrieve injector attached to the html element if it\'s requested on document',
        () => {
      const doc = jqLite(document);
          const html = doc.find('html');
          const injector = {};

      html.data('$injector', injector);

      expect(doc.injector()).toBe(injector);
      expect(html.injector()).toBe(injector);
      dealoc(doc);
    });


    it('should do nothing with a noncompiled template', () => {
      const template = jqLite('<div><span></span></div>');
      expect(template.injector()).toBeUndefined();
      dealoc(template);
    });
  });


  describe('controller', () => {
    it('should retrieve controller attached to the current element or its parent', () => {
      const div = jqLite('<div><span></span></div>');
          const span = div.find('span');

      div.data('$ngControllerController', 'ngController');
      span.data('$otherController', 'other');

      expect(span.controller()).toBe('ngController');
      expect(span.controller('ngController')).toBe('ngController');
      expect(span.controller('other')).toBe('other');

      expect(div.controller()).toBe('ngController');
      expect(div.controller('ngController')).toBe('ngController');
      expect(div.controller('other')).toBeUndefined();

      dealoc(div);
    });
  });


  describe('data', () => {
    it('should set and get and remove data', () => {
      const selected = jqLite([a, b, c]);

      expect(selected.data('prop')).toBeUndefined();
      expect(selected.data('prop', 'value')).toBe(selected);
      expect(selected.data('prop')).toBe('value');
      expect(jqLite(a).data('prop')).toBe('value');
      expect(jqLite(b).data('prop')).toBe('value');
      expect(jqLite(c).data('prop')).toBe('value');

      jqLite(a).data('prop', 'new value');
      expect(jqLite(a).data('prop')).toBe('new value');
      expect(selected.data('prop')).toBe('new value');
      expect(jqLite(b).data('prop')).toBe('value');
      expect(jqLite(c).data('prop')).toBe('value');

      expect(selected.removeData('prop')).toBe(selected);
      expect(jqLite(a).data('prop')).toBeUndefined();
      expect(jqLite(b).data('prop')).toBeUndefined();
      expect(jqLite(c).data('prop')).toBeUndefined();
    });

    it('should only remove the specified value when providing a property name to removeData', () => {
      const selected = jqLite(a);

      expect(selected.data('prop1')).toBeUndefined();

      selected.data('prop1', 'value');
      selected.data('prop2', 'doublevalue');

      expect(selected.data('prop1')).toBe('value');
      expect(selected.data('prop2')).toBe('doublevalue');

      selected.removeData('prop1');

      expect(selected.data('prop1')).toBeUndefined();
      expect(selected.data('prop2')).toBe('doublevalue');

      selected.removeData('prop2');
    });

    it('should not remove event handlers on removeData()', () => {
      let log = '';
      const elm = jqLite(a);
      elm.on('click', () => {
        log += 'click;';
      });

      elm.removeData();
      browserTrigger(a, 'click');
      expect(log).toBe('click;');
    });

    it('should allow to set data after removeData() with event handlers present', () => {
      const elm = jqLite(a);
      elm.on('click', () => {});
      elm.data('key1', 'value1');
      elm.removeData();
      elm.data('key2', 'value2');
      expect(elm.data('key1')).not.toBeDefined();
      expect(elm.data('key2')).toBe('value2');
    });

    it('should allow to set data after removeData() without event handlers present', () => {
      const elm = jqLite(a);
      elm.data('key1', 'value1');
      elm.removeData();
      elm.data('key2', 'value2');
      expect(elm.data('key1')).not.toBeDefined();
      expect(elm.data('key2')).toBe('value2');
    });


    it('should remove user data on cleanData()', () => {
      const selected = jqLite([a, b, c]);

      selected.data('prop', 'value');
      jqLite(b).data('prop', 'new value');

      jqLite.cleanData(selected);

      expect(jqLite(a).data('prop')).toBeUndefined();
      expect(jqLite(b).data('prop')).toBeUndefined();
      expect(jqLite(c).data('prop')).toBeUndefined();
    });

    it('should remove event handlers on cleanData()', () => {
      const selected = jqLite([a, b, c]);

      let log = '';
      const elm = jqLite(b);
      elm.on('click', () => {
        log += 'click;';
      });
      jqLite.cleanData(selected);

      browserTrigger(b, 'click');
      expect(log).toBe('');
    });

    it('should remove user data & event handlers on cleanData()', () => {
      const selected = jqLite([a, b, c]);

      let log = '';
      const elm = jqLite(b);
      elm.on('click', () => {
        log += 'click;';
      });

      selected.data('prop', 'value');
      jqLite(a).data('prop', 'new value');

      jqLite.cleanData(selected);

      browserTrigger(b, 'click');
      expect(log).toBe('');

      expect(jqLite(a).data('prop')).toBeUndefined();
      expect(jqLite(b).data('prop')).toBeUndefined();
      expect(jqLite(c).data('prop')).toBeUndefined();
    });

    it('should not break on cleanData(), if element has no data', () => {
      const selected = jqLite([a, b, c]);
      spyOn(jqLite, '_data').and.returnValue(undefined);
      expect(() => { jqLite.cleanData(selected); }).not.toThrow();
    });


    it('should add and remove data on SVGs', () => {
      const svg = jqLite('<svg><rect></rect></svg>');

      svg.data('svg-level', 1);
      expect(svg.data('svg-level')).toBe(1);

      svg.children().data('rect-level', 2);
      expect(svg.children().data('rect-level')).toBe(2);

      svg.remove();
    });


    it('should not add to the cache if the node is a comment or text node', () => {
      const nodes = jqLite('<!-- some comment --> and some text');
      expect(jqLiteCacheSize()).toEqual(0);
      nodes.data('someKey');
      expect(jqLiteCacheSize()).toEqual(0);
      nodes.data('someKey', 'someValue');
      expect(jqLiteCacheSize()).toEqual(0);
    });


    it('should provide the non-wrapped data calls', () => {
      const node = document.createElement('div');

      expect(jqLite.hasData(node)).toBe(false);
      expect(jqLite.data(node, 'foo')).toBeUndefined();
      expect(jqLite.hasData(node)).toBe(false);

      jqLite.data(node, 'foo', 'bar');

      expect(jqLite.hasData(node)).toBe(true);
      expect(jqLite.data(node, 'foo')).toBe('bar');
      expect(jqLite(node).data('foo')).toBe('bar');

      expect(jqLite.data(node)).toBe(jqLite(node).data());

      jqLite.removeData(node, 'foo');
      expect(jqLite.data(node, 'foo')).toBeUndefined();

      jqLite.data(node, 'bar', 'baz');
      jqLite.removeData(node);
      jqLite.removeData(node);
      expect(jqLite.data(node, 'bar')).toBeUndefined();

      jqLite(node).remove();
      expect(jqLite.hasData(node)).toBe(false);
    });

    it('should emit $destroy event if element removed via remove()', () => {
      let log = '';
      const element = jqLite(a);
      element.on('$destroy', () => {log += 'destroy;';});
      element.remove();
      expect(log).toEqual('destroy;');
    });


    it('should emit $destroy event if an element is removed via html(\'\')', inject((log) => {
      const element = jqLite('<div><span>x</span></div>');
      element.find('span').on('$destroy', log.fn('destroyed'));

      element.html('');

      expect(element.html()).toBe('');
      expect(log).toEqual('destroyed');
    }));


    it('should emit $destroy event if an element is removed via empty()', inject((log) => {
      const element = jqLite('<div><span>x</span></div>');
      element.find('span').on('$destroy', log.fn('destroyed'));

      element.empty();

      expect(element.html()).toBe('');
      expect(log).toEqual('destroyed');
    }));


    it('should keep data if an element is removed via detach()', () => {
      const root = jqLite('<div><span>abc</span></div>');
          const span = root.find('span');
          const data = span.data();

      span.data('foo', 'bar');
      span.detach();

      expect(data).toEqual({foo: 'bar'});

      span.remove();
    });


    it('should retrieve all data if called without params', () => {
      const element = jqLite(a);
      expect(element.data()).toEqual({});

      element.data('foo', 'bar');
      expect(element.data()).toEqual({foo: 'bar'});

      element.data().baz = 'xxx';
      expect(element.data()).toEqual({foo: 'bar', baz: 'xxx'});
    });

    it('should create a new data object if called without args', () => {
      const element = jqLite(a);
          const data = element.data();

      expect(data).toEqual({});
      element.data('foo', 'bar');
      expect(data).toEqual({foo: 'bar'});
    });

    it('should create a new data object if called with a single object arg', () => {
      const element = jqLite(a);
          const newData = {foo: 'bar'};

      element.data(newData);
      expect(element.data()).toEqual({foo: 'bar'});
      expect(element.data()).not.toBe(newData); // create a copy
    });

    it('should merge existing data object with a new one if called with a single object arg',
        () => {
      const element = jqLite(a);
      element.data('existing', 'val');
      expect(element.data()).toEqual({existing: 'val'});

      const oldData = element.data();
          const newData = {meLike: 'turtles', 'youLike': 'carrots'};

      expect(element.data(newData)).toBe(element);
      expect(element.data()).toEqual({meLike: 'turtles', youLike: 'carrots', existing: 'val'});
      expect(element.data()).toBe(oldData); // merge into the old object
    });

    describe('data cleanup', () => {
      it('should remove data on element removal', () => {
        const div = jqLite('<div><span>text</span></div>');
            const span = div.find('span');

        span.data('name', 'AngularJS');
        span.remove();
        expect(span.data('name')).toBeUndefined();
      });

      it('should remove event listeners on element removal', () => {
        const div = jqLite('<div><span>text</span></div>');
            const span = div.find('span');
            let log = '';

        span.on('click', () => { log += 'click;'; });
        browserTrigger(span);
        expect(log).toEqual('click;');

        span.remove();

        browserTrigger(span);
        expect(log).toEqual('click;');
      });

      it('should work if the descendants of the element change while it\'s being removed', () => {
        const div = jqLite('<div><p><span>text</span></p></div>');
        div.find('p').on('$destroy', () => {
          div.find('span').remove();
        });
        expect(() => {
          div.remove();
        }).not.toThrow();
      });
    });

    describe('camelCasing keys', () => {
      // jQuery 2.x has different behavior; skip the tests.
      if (isJQuery2x()) return;

      it('should camelCase the key in a setter', () => {
        const element = jqLite(a);

        element.data('a-B-c-d-42--e', 'z-x');
        expect(element.data()).toEqual({'a-BCD-42-E': 'z-x'});
      });

      it('should camelCase the key in a getter', () => {
        const element = jqLite(a);

        element.data()['a-BCD-42-E'] = 'x-c';
        expect(element.data('a-B-c-d-42--e')).toBe('x-c');
      });

      it('should camelCase the key in a mass setter', () => {
        const element = jqLite(a);

        element.data({'a-B-c-d-42--e': 'c-v', 'r-t-v': 42});
        expect(element.data()).toEqual({'a-BCD-42-E': 'c-v', 'rTV': 42});
      });

      it('should ignore non-camelCase keys in the data in a getter', () => {
        const element = jqLite(a);

        element.data()['a-b'] = 'b-n';
        expect(element.data('a-b')).toBe(undefined);
      });
    });
  });


  describe('attr', () => {
    it('should read, write and remove attr', () => {
      const selector = jqLite([a, b]);

      expect(selector.attr('prop', 'value')).toEqual(selector);
      expect(jqLite(a).attr('prop')).toEqual('value');
      expect(jqLite(b).attr('prop')).toEqual('value');

      expect(selector.attr({'prop': 'new value'})).toEqual(selector);
      expect(jqLite(a).attr('prop')).toEqual('new value');
      expect(jqLite(b).attr('prop')).toEqual('new value');

      jqLite(b).attr({'prop': 'new value 2'});
      expect(jqLite(selector).attr('prop')).toEqual('new value');
      expect(jqLite(b).attr('prop')).toEqual('new value 2');

      selector.removeAttr('prop');
      expect(jqLite(a).attr('prop')).toBeFalsy();
      expect(jqLite(b).attr('prop')).toBeFalsy();
    });

    it('should read boolean attributes as strings', () => {
      const select = jqLite('<select>');
      expect(select.attr('multiple')).toBeUndefined();
      expect(jqLite('<select multiple>').attr('multiple')).toBe('multiple');
      expect(jqLite('<select multiple="">').attr('multiple')).toBe('multiple');
      expect(jqLite('<select multiple="x">').attr('multiple')).toBe('multiple');
    });

    it('should add/remove boolean attributes', () => {
      const select = jqLite('<select>');
      select.attr('multiple', false);
      expect(select.attr('multiple')).toBeUndefined();

      select.attr('multiple', true);
      expect(select.attr('multiple')).toBe('multiple');
    });

    it('should not take properties into account when getting respective boolean attributes', () => {
      // Use a div and not a select as the latter would itself reflect the multiple attribute
      // to a property.
      const div = jqLite('<div>');

      div[0].multiple = true;
      expect(div.attr('multiple')).toBe(undefined);

      div.attr('multiple', 'multiple');
      div[0].multiple = false;
      expect(div.attr('multiple')).toBe('multiple');
    });

    it('should not set properties when setting respective boolean attributes', () => {
      // jQuery 2.x has different behavior; skip the test.
      if (isJQuery2x()) return;

      // Use a div and not a select as the latter would itself reflect the multiple attribute
      // to a property.
      const div = jqLite('<div>');

      // Check the initial state.
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', 'multiple');
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', '');
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', false);
      expect(div[0].multiple).toBe(undefined);

      div.attr('multiple', null);
      expect(div[0].multiple).toBe(undefined);
    });

    it('should normalize the case of boolean attributes', () => {
      const input = jqLite('<input readonly>');
      expect(input.attr('readonly')).toBe('readonly');
      expect(input.attr('readOnly')).toBe('readonly');
      expect(input.attr('READONLY')).toBe('readonly');

      input.attr('readonly', false);
      expect(input[0].getAttribute('readonly')).toBe(null);

      input.attr('readOnly', 'READonly');
      expect(input.attr('readonly')).toBe('readonly');
      expect(input.attr('readOnly')).toBe('readonly');
    });

    it('should return undefined for non-existing attributes', () => {
      const elm = jqLite('<div class="any">a</div>');
      expect(elm.attr('non-existing')).toBeUndefined();
    });

    it('should return undefined for non-existing attributes on input', () => {
      const elm = jqLite('<input>');
      expect(elm.attr('readonly')).toBeUndefined();
      expect(elm.attr('readOnly')).toBeUndefined();
      expect(elm.attr('disabled')).toBeUndefined();
    });

    it('should do nothing when setting or getting on attribute nodes', () => {
      const attrNode = jqLite(document.createAttribute('myattr'));
      expect(attrNode).toBeDefined();
      expect(attrNode[0].nodeType).toEqual(2);
      expect(attrNode.attr('some-attribute','somevalue')).toEqual(attrNode);
      expect(attrNode.attr('some-attribute')).toBeUndefined();
    });

    it('should do nothing when setting or getting on text nodes', () => {
      const textNode = jqLite(document.createTextNode('some text'));
      expect(textNode).toBeDefined();
      expect(textNode[0].nodeType).toEqual(3);
      expect(textNode.attr('some-attribute','somevalue')).toEqual(textNode);
      expect(textNode.attr('some-attribute')).toBeUndefined();
    });

    it('should do nothing when setting or getting on comment nodes', () => {
      const comment = jqLite(document.createComment('some comment'));
      expect(comment).toBeDefined();
      expect(comment[0].nodeType).toEqual(8);
      expect(comment.attr('some-attribute','somevalue')).toEqual(comment);
      expect(comment.attr('some-attribute')).toBeUndefined();
    });

    it('should remove the attribute for a null value', () => {
      const elm = jqLite('<div attribute="value">a</div>');
      elm.attr('attribute', null);
      expect(elm[0].hasAttribute('attribute')).toBe(false);
    });

    it('should not remove the attribute for an empty string as a value', () => {
      const elm = jqLite('<div attribute="value">a</div>');
      elm.attr('attribute', '');
      expect(elm[0].getAttribute('attribute')).toBe('');
    });

    it('should remove the boolean attribute for a false value', () => {
      const elm = jqLite('<select multiple>');
      elm.attr('multiple', false);
      expect(elm[0].hasAttribute('multiple')).toBe(false);
    });

    it('should remove the boolean attribute for a null value', () => {
      const elm = jqLite('<select multiple>');
      elm.attr('multiple', null);
      expect(elm[0].hasAttribute('multiple')).toBe(false);
    });

    it('should not remove the boolean attribute for an empty string as a value', () => {
      const elm = jqLite('<select multiple>');
      elm.attr('multiple', '');
      expect(elm[0].getAttribute('multiple')).toBe('multiple');
    });

    it('should not fail on elements without the getAttribute method', () => {
      forEach([window, document], (node) => {
        expect(() => {
          const elem = jqLite(node);
          elem.attr('foo');
          elem.attr('bar', 'baz');
          elem.attr('bar');
        }).not.toThrow();
      });
    });
  });


  describe('prop', () => {
    it('should read element property', () => {
      const elm = jqLite('<div class="foo">a</div>');
      expect(elm.prop('className')).toBe('foo');
    });

    it('should set element property to a value', () => {
      const elm = jqLite('<div class="foo">a</div>');
      elm.prop('className', 'bar');
      expect(elm[0].className).toBe('bar');
      expect(elm.prop('className')).toBe('bar');
    });

    it('should set boolean element property', () => {
      const elm = jqLite('<input type="checkbox">');
      expect(elm.prop('checked')).toBe(false);

      elm.prop('checked', true);
      expect(elm.prop('checked')).toBe(true);

      elm.prop('checked', '');
      expect(elm.prop('checked')).toBe(false);

      elm.prop('checked', 'lala');
      expect(elm.prop('checked')).toBe(true);

      elm.prop('checked', null);
      expect(elm.prop('checked')).toBe(false);
    });
  });


  describe('class', () => {

    it('should properly do  with SVG elements', () => {
      // This is not working correctly in jQuery prior to v2.2.
      // See https://github.com/jquery/jquery/issues/2199 for details.
      if (isJQuery21()) return;

      const svg = jqLite('<svg><rect></rect></svg>');
      const rect = svg.children();

      expect(rect.hasClass('foo-class')).toBe(false);
      rect.addClass('foo-class');
      expect(rect.hasClass('foo-class')).toBe(true);
      rect.removeClass('foo-class');
      expect(rect.hasClass('foo-class')).toBe(false);
    });


    it('should ignore comment elements', () => {
      const comment = jqLite(document.createComment('something'));

      comment.addClass('whatever');
      comment.hasClass('whatever');
      comment.toggleClass('whatever');
      comment.removeClass('whatever');
    });


    describe('hasClass', () => {
      it('should check class', () => {
        const selector = jqLite([a, b]);
        expect(selector.hasClass('abc')).toEqual(false);
      });


      it('should make sure that partial class is not checked as a subset', () => {
        const selector = jqLite([a, b]);
        selector.addClass('a');
        selector.addClass('b');
        selector.addClass('c');
        expect(selector.addClass('abc')).toEqual(selector);
        expect(selector.removeClass('abc')).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(false);
        expect(jqLite(b).hasClass('abc')).toEqual(false);
        expect(jqLite(a).hasClass('a')).toEqual(true);
        expect(jqLite(a).hasClass('b')).toEqual(true);
        expect(jqLite(a).hasClass('c')).toEqual(true);
      });
    });


    describe('addClass', () => {
      it('should allow adding of class', () => {
        const selector = jqLite([a, b]);
        expect(selector.addClass('abc')).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(true);
        expect(jqLite(b).hasClass('abc')).toEqual(true);
      });


      it('should ignore falsy values', () => {
        const jqA = jqLite(a);
        expect(jqA[0].className).toBe('');

        jqA.addClass(undefined);
        expect(jqA[0].className).toBe('');

        jqA.addClass(null);
        expect(jqA[0].className).toBe('');

        jqA.addClass(false);
        expect(jqA[0].className).toBe('');
      });


      it('should allow multiple classes to be added in a single string', () => {
        const jqA = jqLite(a);
        expect(a.className).toBe('');

        jqA.addClass('foo bar baz');
        expect(a.className).toBe('foo bar baz');
      });


      // JQLite specific implementation/performance tests
      if (_jqLiteMode) {
        it('should only get/set the attribute once when multiple classes added', () => {
          const fakeElement = {
            nodeType: 1,
            setAttribute: jasmine.createSpy(),
            getAttribute: jasmine.createSpy().and.returnValue('')
          };
          const jqA = jqLite(fakeElement);

          jqA.addClass('foo bar baz');
          expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
          expect(fakeElement.setAttribute).toHaveBeenCalledOnceWith('class', 'foo bar baz');
        });


        it('should not set the attribute when classes not changed', () => {
          const fakeElement = {
            nodeType: 1,
            setAttribute: jasmine.createSpy(),
            getAttribute: jasmine.createSpy().and.returnValue('foo bar')
          };
          const jqA = jqLite(fakeElement);

          jqA.addClass('foo');
          expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
          expect(fakeElement.setAttribute).not.toHaveBeenCalled();
        });
      }


      it('should not add duplicate classes', () => {
        const jqA = jqLite(a);
        expect(a.className).toBe('');

        a.className = 'foo';
        jqA.addClass('foo');
        expect(a.className).toBe('foo');

        jqA.addClass('bar foo baz');
        expect(a.className).toBe('foo bar baz');
      });
    });


    describe('toggleClass', () => {
      it('should allow toggling of class', () => {
        const selector = jqLite([a, b]);
        expect(selector.toggleClass('abc')).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(true);
        expect(jqLite(b).hasClass('abc')).toEqual(true);

        expect(selector.toggleClass('abc')).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(false);
        expect(jqLite(b).hasClass('abc')).toEqual(false);

        expect(selector.toggleClass('abc'), true).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(true);
        expect(jqLite(b).hasClass('abc')).toEqual(true);

        expect(selector.toggleClass('abc'), false).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(false);
        expect(jqLite(b).hasClass('abc')).toEqual(false);

      });

      it('should allow toggling multiple classes without a condition', () => {
        const selector = jqLite([a, b]);
        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(true);
        expect(jqLite(a).hasClass('cde')).toBe(true);
        expect(jqLite(b).hasClass('abc')).toBe(true);
        expect(jqLite(b).hasClass('cde')).toBe(true);

        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(false);
        expect(jqLite(a).hasClass('cde')).toBe(false);
        expect(jqLite(b).hasClass('abc')).toBe(false);
        expect(jqLite(b).hasClass('cde')).toBe(false);

        expect(selector.toggleClass('abc')).toBe(selector);
        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(false);
        expect(jqLite(a).hasClass('cde')).toBe(true);
        expect(jqLite(b).hasClass('abc')).toBe(false);
        expect(jqLite(b).hasClass('cde')).toBe(true);

        expect(selector.toggleClass('abc cde')).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(true);
        expect(jqLite(a).hasClass('cde')).toBe(false);
        expect(jqLite(b).hasClass('abc')).toBe(true);
        expect(jqLite(b).hasClass('cde')).toBe(false);
      });

      it('should allow toggling multiple classes with a condition', () => {
        const selector = jqLite([a, b]);
        selector.addClass('abc');
        expect(selector.toggleClass('abc cde', true)).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(true);
        expect(jqLite(a).hasClass('cde')).toBe(true);
        expect(jqLite(b).hasClass('abc')).toBe(true);
        expect(jqLite(b).hasClass('cde')).toBe(true);

        selector.removeClass('abc');
        expect(selector.toggleClass('abc cde', false)).toBe(selector);
        expect(jqLite(a).hasClass('abc')).toBe(false);
        expect(jqLite(a).hasClass('cde')).toBe(false);
        expect(jqLite(b).hasClass('abc')).toBe(false);
        expect(jqLite(b).hasClass('cde')).toBe(false);
      });

      it('should not break for null / undefined selectors', () => {
        const selector = jqLite([a, b]);
        expect(selector.toggleClass(null)).toBe(selector);
        expect(selector.toggleClass(undefined)).toBe(selector);
      });
    });


    describe('removeClass', () => {
      it('should allow removal of class', () => {
        const selector = jqLite([a, b]);
        expect(selector.addClass('abc')).toEqual(selector);
        expect(selector.removeClass('abc')).toEqual(selector);
        expect(jqLite(a).hasClass('abc')).toEqual(false);
        expect(jqLite(b).hasClass('abc')).toEqual(false);
      });


      it('should correctly remove middle class', () => {
        const element = jqLite('<div class="foo bar baz"></div>');
        expect(element.hasClass('bar')).toBe(true);

        element.removeClass('bar');

        expect(element.hasClass('foo')).toBe(true);
        expect(element.hasClass('bar')).toBe(false);
        expect(element.hasClass('baz')).toBe(true);
      });


      it('should remove multiple classes specified as one string', () => {
        const jqA = jqLite(a);

        a.className = 'foo bar baz';
        jqA.removeClass('foo baz noexistent');
        expect(a.className).toBe('bar');
      });


      // JQLite specific implementation/performance tests
      if (_jqLiteMode) {
        it('should get/set the attribute once when removing multiple classes', () => {
          const fakeElement = {
            nodeType: 1,
            setAttribute: jasmine.createSpy(),
            getAttribute: jasmine.createSpy().and.returnValue('foo bar baz')
          };
          const jqA = jqLite(fakeElement);

          jqA.removeClass('foo baz noexistent');
          expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
          expect(fakeElement.setAttribute).toHaveBeenCalledOnceWith('class', 'bar');
        });


        it('should not set the attribute when classes not changed', () => {
          const fakeElement = {
            nodeType: 1,
            setAttribute: jasmine.createSpy(),
            getAttribute: jasmine.createSpy().and.returnValue('foo bar')
          };
          const jqA = jqLite(fakeElement);

          jqA.removeClass('noexistent');
          expect(fakeElement.getAttribute).toHaveBeenCalledOnceWith('class');
          expect(fakeElement.setAttribute).not.toHaveBeenCalled();
        });
      }
    });
  });


  describe('css', () => {
    it('should set and read css', () => {
      const selector = jqLite([a, b]);

      expect(selector.css('margin', '1px')).toEqual(selector);
      expect(jqLite(a).css('margin')).toEqual('1px');
      expect(jqLite(b).css('margin')).toEqual('1px');

      expect(selector.css({'margin': '2px'})).toEqual(selector);
      expect(jqLite(a).css('margin')).toEqual('2px');
      expect(jqLite(b).css('margin')).toEqual('2px');

      jqLite(b).css({'margin': '3px'});
      expect(jqLite(selector).css('margin')).toEqual('2px');
      expect(jqLite(a).css('margin')).toEqual('2px');
      expect(jqLite(b).css('margin')).toEqual('3px');

      selector.css('margin', '');
      expect(jqLite(a).css('margin')).toBeFalsy();
      expect(jqLite(b).css('margin')).toBeFalsy();
    });


    it('should set a bunch of css properties specified via an object', () => {
      expect(jqLite(a).css('margin')).toBeFalsy();
      expect(jqLite(a).css('padding')).toBeFalsy();
      expect(jqLite(a).css('border')).toBeFalsy();

      jqLite(a).css({'margin': '1px', 'padding': '2px', 'border': ''});

      expect(jqLite(a).css('margin')).toBe('1px');
      expect(jqLite(a).css('padding')).toBe('2px');
      expect(jqLite(a).css('border')).toBeFalsy();
    });


    it('should correctly handle dash-separated and camelCased properties', () => {
      const jqA = jqLite(a);

      expect(jqA.css('z-index')).toBeOneOf('', 'auto');
      expect(jqA.css('zIndex')).toBeOneOf('', 'auto');


      jqA.css({'zIndex':5});

      expect(jqA.css('z-index')).toBeOneOf('5', 5);
      expect(jqA.css('zIndex')).toBeOneOf('5', 5);

      jqA.css({'z-index':7});

      expect(jqA.css('z-index')).toBeOneOf('7', 7);
      expect(jqA.css('zIndex')).toBeOneOf('7', 7);
    });

    it('should leave non-dashed strings alone', () => {
      const jqA = jqLite(a);

      jqA.css('foo', 'foo');
      jqA.css('fooBar', 'bar');

      expect(a.style.foo).toBe('foo');
      expect(a.style.fooBar).toBe('bar');
    });

    it('should convert dash-separated strings to camelCase', () => {
      const jqA = jqLite(a);

      jqA.css('foo-bar', 'foo');
      jqA.css('foo-bar-baz', 'bar');
      jqA.css('foo:bar_baz', 'baz');

      expect(a.style.fooBar).toBe('foo');
      expect(a.style.fooBarBaz).toBe('bar');
      expect(a.style['foo:bar_baz']).toBe('baz');
    });

    it('should convert leading dashes followed by a lowercase letter', () => {
      const jqA = jqLite(a);

      jqA.css('-foo-bar', 'foo');

      expect(a.style.FooBar).toBe('foo');
    });

    it('should not convert slashes followed by a non-letter', () => {
      // jQuery 2.x had different behavior; skip the test.
      if (isJQuery2x()) return;

      const jqA = jqLite(a);

      jqA.css('foo-42- -a-B', 'foo');

      expect(a.style['foo-42- A-B']).toBe('foo');
    });

    it('should convert the -ms- prefix to ms instead of Ms', () => {
      const jqA = jqLite(a);

      jqA.css('-ms-foo-bar', 'foo');
      jqA.css('-moz-foo-bar', 'bar');
      jqA.css('-webkit-foo-bar', 'baz');

      expect(a.style.msFooBar).toBe('foo');
      expect(a.style.MozFooBar).toBe('bar');
      expect(a.style.WebkitFooBar).toBe('baz');
    });

    it('should not collapse sequences of dashes', () => {
      const jqA = jqLite(a);

      jqA.css('foo---bar-baz--qaz', 'foo');

      expect(a.style['foo--BarBaz-Qaz']).toBe('foo');
    });


    it('should read vendor prefixes with the special -ms- exception', () => {
      // jQuery uses getComputedStyle() in a css getter so these tests would fail there.
      if (!_jqLiteMode) return;

      const jqA = jqLite(a);

      a.style.WebkitFooBar = 'webkit-uppercase';
      a.style.webkitFooBar = 'webkit-lowercase';

      a.style.MozFooBaz = 'moz-uppercase';
      a.style.mozFooBaz = 'moz-lowercase';

      a.style.MsFooQaz = 'ms-uppercase';
      a.style.msFooQaz = 'ms-lowercase';

      expect(jqA.css('-webkit-foo-bar')).toBe('webkit-uppercase');
      expect(jqA.css('-moz-foo-baz')).toBe('moz-uppercase');
      expect(jqA.css('-ms-foo-qaz')).toBe('ms-lowercase');
    });

    it('should write vendor prefixes with the special -ms- exception', () => {
      const jqA = jqLite(a);

      jqA.css('-webkit-foo-bar', 'webkit');
      jqA.css('-moz-foo-baz', 'moz');
      jqA.css('-ms-foo-qaz', 'ms');

      expect(a.style.WebkitFooBar).toBe('webkit');
      expect(a.style.webkitFooBar).not.toBeDefined();

      expect(a.style.MozFooBaz).toBe('moz');
      expect(a.style.mozFooBaz).not.toBeDefined();

      expect(a.style.MsFooQaz).not.toBeDefined();
      expect(a.style.msFooQaz).toBe('ms');
    });
  });


  describe('text', () => {
    it('should return `""` on empty', () => {
      expect(jqLite().length).toEqual(0);
      expect(jqLite().text()).toEqual('');
    });


    it('should read/write value', () => {
      const element = jqLite('<div>ab</div><span>c</span>');
      expect(element.length).toEqual(2);
      expect(element[0].innerHTML).toEqual('ab');
      expect(element[1].innerHTML).toEqual('c');
      expect(element.text()).toEqual('abc');
      expect(element.text('xyz') === element).toBeTruthy();
      expect(element.text()).toEqual('xyzxyz');
    });

    it('should return text only for element or text nodes', () => {
      expect(jqLite('<div>foo</div>').text()).toBe('foo');
      expect(jqLite('<div>foo</div>').contents().eq(0).text()).toBe('foo');
      expect(jqLite(document.createComment('foo')).text()).toBe('');
    });
  });


  describe('val', () => {
    it('should read, write value', () => {
      const input = jqLite('<input type="text"/>');
      expect(input.val('abc')).toEqual(input);
      expect(input[0].value).toEqual('abc');
      expect(input.val()).toEqual('abc');
    });

    it('should get an array of selected elements from a multi select', () => {
      expect(jqLite(
        '<select multiple>' +
          '<option selected>test 1</option>' +
          '<option selected>test 2</option>' +
        '</select>').val()).toEqual(['test 1', 'test 2']);

      expect(jqLite(
        '<select multiple>' +
          '<option selected>test 1</option>' +
          '<option>test 2</option>' +
        '</select>').val()).toEqual(['test 1']);

      // In jQuery < 3.0 .val() on select[multiple] with no selected options returns an
      // null instead of an empty array.
      expect(jqLite(
        '<select multiple>' +
          '<option>test 1</option>' +
          '<option>test 2</option>' +
        '</select>').val()).toEqualOneOf(null, []);
    });

    it('should get an empty array from a multi select if no elements are chosen', () => {
      // In jQuery < 3.0 .val() on select[multiple] with no selected options returns an
      // null instead of an empty array.
      // See https://github.com/jquery/jquery/issues/2562 for more details.
      if (isJQuery2x()) return;

      expect(jqLite(
        '<select multiple>' +
          '<optgroup>' +
            '<option>test 1</option>' +
            '<option>test 2</option>' +
          '</optgroup>' +
          '<option>test 3</option>' +
        '</select>').val()).toEqual([]);

      expect(jqLite(
        '<select multiple>' +
          '<optgroup disabled>' +
            '<option>test 1</option>' +
            '<option>test 2</option>' +
          '</optgroup>' +
          '<option disabled>test 3</option>' +
        '</select>').val()).toEqual([]);
    });
  });


  describe('html', () => {
    it('should return `undefined` on empty', () => {
      expect(jqLite().length).toEqual(0);
      expect(jqLite().html()).toEqual(undefined);
    });


    it('should read/write a value', () => {
      const element = jqLite('<div>abc</div>');
      expect(element.length).toEqual(1);
      expect(element[0].innerHTML).toEqual('abc');
      expect(element.html()).toEqual('abc');
      expect(element.html('xyz') === element).toBeTruthy();
      expect(element.html()).toEqual('xyz');
    });
  });


  describe('empty', () => {
    it('should write a value', () => {
      const element = jqLite('<div>abc</div>');
      expect(element.length).toEqual(1);
      expect(element.empty() === element).toBeTruthy();
      expect(element.html()).toEqual('');
    });
  });


  describe('on', () => {
    it('should bind to window on hashchange', () => {
      if (!_jqLiteMode) return; // don't run in jQuery

      let eventFn;
      const window = {
        document: {},
        location: {},
        alert: noop,
        setInterval: noop,
        length:10, // pretend you are an array
        addEventListener(type, fn) {
          expect(type).toEqual('hashchange');
          eventFn = fn;
        },
        removeEventListener: noop
      };
      window.window = window;

      let log;
      const jWindow = jqLite(window).on('hashchange', () => {
        log = 'works!';
      });
      eventFn({type: 'hashchange'});
      expect(log).toEqual('works!');
      dealoc(jWindow);
    });


    it('should bind to all elements and return functions', () => {
      const selected = jqLite([a, b]);
      let log = '';
      expect(selected.on('click', function() {
        log += `click on: ${  jqLite(this).text()  };`;
      })).toEqual(selected);
      browserTrigger(a, 'click');
      expect(log).toEqual('click on: A;');
      browserTrigger(b, 'click');
      expect(log).toEqual('click on: A;click on: B;');
    });

    it('should not bind to comment or text nodes', () => {
      const nodes = jqLite('<!-- some comment -->Some text');
      const someEventHandler = jasmine.createSpy('someEventHandler');

      nodes.on('someEvent', someEventHandler);
      nodes.triggerHandler('someEvent');

      expect(someEventHandler).not.toHaveBeenCalled();
    });

    it('should bind to all events separated by space', () => {
      const elm = jqLite(a);
          const callback = jasmine.createSpy('callback');

      elm.on('click keypress', callback);
      elm.on('click', callback);

      browserTrigger(a, 'click');
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(2);

      callback.calls.reset();
      browserTrigger(a, 'keypress');
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should set event.target', () => {
      const elm = jqLite(a);
      elm.on('click', (event) => {
        expect(event.target).toBe(a);
      });

      browserTrigger(a, 'click');
    });

    it('should have event.isDefaultPrevented method', () => {
      const element = jqLite(a);
          const clickSpy = jasmine.createSpy('clickSpy');

      clickSpy.and.callFake((e) => {
        expect(() => {
          expect(e.isDefaultPrevented()).toBe(false);
          e.preventDefault();
          expect(e.isDefaultPrevented()).toBe(true);
        }).not.toThrow();
      });

      element.on('click', clickSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should stop triggering handlers when stopImmediatePropagation is called', () => {
      const element = jqLite(a);
          const clickSpy1 = jasmine.createSpy('clickSpy1');
          const clickSpy2 = jasmine.createSpy('clickSpy2').and.callFake((event) => { event.stopImmediatePropagation(); });
          const clickSpy3 = jasmine.createSpy('clickSpy3');
          const clickSpy4 = jasmine.createSpy('clickSpy4');

      element.on('click', clickSpy1);
      element.on('click', clickSpy2);
      element.on('click', clickSpy3);
      element[0].addEventListener('click', clickSpy4);

      browserTrigger(element, 'click');

      expect(clickSpy1).toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalled();
      expect(clickSpy3).not.toHaveBeenCalled();
      expect(clickSpy4).not.toHaveBeenCalled();
    });

    it('should execute stopPropagation when stopImmediatePropagation is called', () => {
      const element = jqLite(a);
          const clickSpy = jasmine.createSpy('clickSpy');

      clickSpy.and.callFake((event) => {
          spyOn(event, 'stopPropagation');
          event.stopImmediatePropagation();
          expect(event.stopPropagation).toHaveBeenCalled();
      });

      element.on('click', clickSpy);

      browserTrigger(element, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should have event.isImmediatePropagationStopped method', () => {
      const element = jqLite(a);
          const clickSpy = jasmine.createSpy('clickSpy');

      clickSpy.and.callFake((event) => {
          expect(event.isImmediatePropagationStopped()).toBe(false);
          event.stopImmediatePropagation();
          expect(event.isImmediatePropagationStopped()).toBe(true);
      });

      element.on('click', clickSpy);

      browserTrigger(element, 'click');
      expect(clickSpy).toHaveBeenCalled();
    });

    describe('mouseenter-mouseleave', () => {
      let root; let parent; let child; let log;

      function setup(html, parentNode, childNode) {
        log = '';
        root = jqLite(html);
        parent = root.find(parentNode);
        child = parent.find(childNode);

        parent.on('mouseenter', () => { log += 'parentEnter;'; });
        parent.on('mouseleave', () => { log += 'parentLeave;'; });

        child.on('mouseenter', () => { log += 'childEnter;'; });
        child.on('mouseleave', () => { log += 'childLeave;'; });
      }

      function browserMoveTrigger(from, to) {
        const fireEvent = function(type, element, relatedTarget) {
          let evnt;
          evnt = document.createEvent('MouseEvents');

          const originalPreventDefault = evnt.preventDefault;
          const appWindow = window;
          let fakeProcessDefault = true;
          let finalProcessDefault;

          evnt.preventDefault = function() {
            fakeProcessDefault = false;
            return originalPreventDefault.apply(evnt, arguments);
          };

          const x = 0; const y = 0;
          evnt.initMouseEvent(type, true, true, window, 0, x, y, x, y, false, false,
          false, false, 0, relatedTarget);

          element.dispatchEvent(evnt);
        };
        fireEvent('mouseout', from[0], to[0]);
        fireEvent('mouseover', to[0], from[0]);
      }

      afterEach(() => {
        dealoc(root);
      });

      it('should fire mouseenter when coming from outside the browser window', () => {
        if (!_jqLiteMode) return;

        setup('<div>root<p>parent<span>child</span></p><ul></ul></div>', 'p', 'span');

        browserMoveTrigger(root, parent);
        expect(log).toEqual('parentEnter;');

        browserMoveTrigger(parent, child);
        expect(log).toEqual('parentEnter;childEnter;');

        browserMoveTrigger(child, parent);
        expect(log).toEqual('parentEnter;childEnter;childLeave;');

        browserMoveTrigger(parent, root);
        expect(log).toEqual('parentEnter;childEnter;childLeave;parentLeave;');

      });

      it('should fire the mousenter on SVG elements', () => {
        if (!_jqLiteMode) return;

        setup(
          '<div>' +
          '<svg xmlns="http://www.w3.org/2000/svg"' +
          '     viewBox="0 0 18.75 18.75"' +
          '     width="18.75"' +
          '     height="18.75"' +
          '     version="1.1">' +
          '       <path d="M0,0c0,4.142,3.358,7.5,7.5,7.5s7.5-3.358,7.5-7.5-3.358-7.5-7.5-7.5-7.5,3.358-7.5,7.5"' +
          '             fill-rule="nonzero"' +
          '             fill="#CCC"' +
          '             ng-attr-fill="{{data.color || \'#CCC\'}}"/>' +
          '</svg>' +
          '</div>',
          'svg', 'path');

        browserMoveTrigger(parent, child);
        expect(log).toEqual('childEnter;');
      });
    });

    it('should throw an error if eventData or a selector is passed', () => {
      if (!_jqLiteMode) return;

      const elm = jqLite(a);
          const anObj = {};
          const aString = '';
          const aValue = 45;
          const callback = function() {};

      expect(() => {
        elm.on('click', anObj, callback);
      }).toThrowMinErr('jqLite', 'onargs');

      expect(() => {
        elm.on('click', null, aString, callback);
      }).toThrowMinErr('jqLite', 'onargs');

      expect(() => {
        elm.on('click', aValue, callback);
      }).toThrowMinErr('jqLite', 'onargs');

    });
  });


  describe('off', () => {
    it('should do nothing when no listener was registered with bound', () => {
      const aElem = jqLite(a);

      aElem.off();
      aElem.off('click');
      aElem.off('click', () => {});
    });

    it('should do nothing when a specific listener was not registered', () => {
      const aElem = jqLite(a);
      aElem.on('click', () => {});

      aElem.off('mouseenter', () => {});
    });

    it('should deregister all listeners', () => {
      const aElem = jqLite(a);
          const clickSpy = jasmine.createSpy('click');
          const mouseoverSpy = jasmine.createSpy('mouseover');

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledOnce();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledOnce();

      clickSpy.calls.reset();
      mouseoverSpy.calls.reset();

      aElem.off();

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister listeners for specific type', () => {
      const aElem = jqLite(a);
          const clickSpy = jasmine.createSpy('click');
          const mouseoverSpy = jasmine.createSpy('mouseover');

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledOnce();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledOnce();

      clickSpy.calls.reset();
      mouseoverSpy.calls.reset();

      aElem.off('click');

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledOnce();

      mouseoverSpy.calls.reset();

      aElem.off('mouseover');
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister all listeners for types separated by spaces', () => {
      const aElem = jqLite(a);
          const clickSpy = jasmine.createSpy('click');
          const mouseoverSpy = jasmine.createSpy('mouseover');

      aElem.on('click', clickSpy);
      aElem.on('mouseover', mouseoverSpy);

      browserTrigger(a, 'click');
      expect(clickSpy).toHaveBeenCalledOnce();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).toHaveBeenCalledOnce();

      clickSpy.calls.reset();
      mouseoverSpy.calls.reset();

      aElem.off('click mouseover');

      browserTrigger(a, 'click');
      expect(clickSpy).not.toHaveBeenCalled();
      browserTrigger(a, 'mouseover');
      expect(mouseoverSpy).not.toHaveBeenCalled();
    });


    it('should deregister specific listener', () => {
      const aElem = jqLite(a);
          const clickSpy1 = jasmine.createSpy('click1');
          const clickSpy2 = jasmine.createSpy('click2');

      aElem.on('click', clickSpy1);
      aElem.on('click', clickSpy2);

      browserTrigger(a, 'click');
      expect(clickSpy1).toHaveBeenCalledOnce();
      expect(clickSpy2).toHaveBeenCalledOnce();

      clickSpy1.calls.reset();
      clickSpy2.calls.reset();

      aElem.off('click', clickSpy1);

      browserTrigger(a, 'click');
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalledOnce();

      clickSpy2.calls.reset();

      aElem.off('click', clickSpy2);
      browserTrigger(a, 'click');
      expect(clickSpy2).not.toHaveBeenCalled();
    });


    it('should correctly deregister the mouseenter/mouseleave listeners', () => {
      const aElem = jqLite(a);
      const onMouseenter = jasmine.createSpy('onMouseenter');
      const onMouseleave = jasmine.createSpy('onMouseleave');

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);
      aElem.off('mouseenter', onMouseenter);
      aElem.off('mouseleave', onMouseleave);
      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      browserTrigger(a, 'mouseover', {relatedTarget: b});
      expect(onMouseenter).toHaveBeenCalledOnce();

      browserTrigger(a, 'mouseout', {relatedTarget: b});
      expect(onMouseleave).toHaveBeenCalledOnce();
    });


    it('should call a `mouseenter/leave` listener only once when `mouseenter/leave` and `mouseover/out` '
       + 'are triggered simultaneously', () => {
      const aElem = jqLite(a);
      const onMouseenter = jasmine.createSpy('mouseenter');
      const onMouseleave = jasmine.createSpy('mouseleave');

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      browserTrigger(a, 'mouseenter', {relatedTarget: b});
      browserTrigger(a, 'mouseover', {relatedTarget: b});
      expect(onMouseenter).toHaveBeenCalledOnce();

      browserTrigger(a, 'mouseleave', {relatedTarget: b});
      browserTrigger(a, 'mouseout', {relatedTarget: b});
      expect(onMouseleave).toHaveBeenCalledOnce();
    });

    it('should call a `mouseenter/leave` listener when manually triggering the event', () => {
      const aElem = jqLite(a);
      const onMouseenter = jasmine.createSpy('mouseenter');
      const onMouseleave = jasmine.createSpy('mouseleave');

      aElem.on('mouseenter', onMouseenter);
      aElem.on('mouseleave', onMouseleave);

      aElem.triggerHandler('mouseenter');
      expect(onMouseenter).toHaveBeenCalledOnce();

      aElem.triggerHandler('mouseleave');
      expect(onMouseleave).toHaveBeenCalledOnce();
    });


    it('should deregister specific listener within the listener and call subsequent listeners', () => {
      const aElem = jqLite(a);
          const clickSpy = jasmine.createSpy('click');
          const clickOnceSpy = jasmine.createSpy('clickOnce').and.callFake(() => {
            aElem.off('click', clickOnceSpy);
          });

      aElem.on('click', clickOnceSpy);
      aElem.on('click', clickSpy);

      browserTrigger(a, 'click');
      expect(clickOnceSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();

      browserTrigger(a, 'click');
      expect(clickOnceSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });


    it('should deregister specific listener for multiple types separated by spaces', () => {
      const aElem = jqLite(a);
          const leaderSpy = jasmine.createSpy('leader');
          const extraSpy = jasmine.createSpy('extra');

      aElem.on('click', leaderSpy);
      aElem.on('click', extraSpy);
      aElem.on('mouseover', leaderSpy);

      browserTrigger(a, 'click');
      browserTrigger(a, 'mouseover');
      expect(leaderSpy).toHaveBeenCalledTimes(2);
      expect(extraSpy).toHaveBeenCalledOnce();

      leaderSpy.calls.reset();
      extraSpy.calls.reset();

      aElem.off('click mouseover', leaderSpy);

      browserTrigger(a, 'click');
      browserTrigger(a, 'mouseover');
      expect(leaderSpy).not.toHaveBeenCalled();
      expect(extraSpy).toHaveBeenCalledOnce();
    });


    describe('native listener deregistration', () => {
      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
         'after off("eventName", listener) call',  () => {
        const aElem = jqLite(a);
        const addEventListenerSpy = spyOn(aElem[0], 'addEventListener').and.callThrough();
        const removeEventListenerSpy = spyOn(aElem[0], 'removeEventListener').and.callThrough();
        let nativeListenerFn;

        const jqLiteListener = function() {};
        aElem.on('click', jqLiteListener);

        // jQuery <2.2 passes the non-needed `false` useCapture parameter.
        // See https://github.com/jquery/jquery/issues/2199 for details.
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function), false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function));
        }
        nativeListenerFn = addEventListenerSpy.calls.mostRecent().args[1];
        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click', jqLiteListener);
        if (isJQuery21()) {
          expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn, false);
        } else {
          expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn);
        }
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
         'after off("eventName") call',  () => {
        const aElem = jqLite(a);
        const addEventListenerSpy = spyOn(aElem[0], 'addEventListener').and.callThrough();
        const removeEventListenerSpy = spyOn(aElem[0], 'removeEventListener').and.callThrough();
        let nativeListenerFn;

        aElem.on('click', () => {});
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function), false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function));
        }
        nativeListenerFn = addEventListenerSpy.calls.mostRecent().args[1];
        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click');
        if (isJQuery21()) {
          expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn, false);
        } else {
          expect(removeEventListenerSpy).toHaveBeenCalledOnceWith('click', nativeListenerFn);
        }
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
         'after off("eventName1 eventName2") call',  () => {
        const aElem = jqLite(a);
        const addEventListenerSpy = spyOn(aElem[0], 'addEventListener').and.callThrough();
        const removeEventListenerSpy = spyOn(aElem[0], 'removeEventListener').and.callThrough();
        let nativeListenerFn;

        aElem.on('click', () => {});
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function), false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function));
        }
        nativeListenerFn = addEventListenerSpy.calls.mostRecent().args[1];
        addEventListenerSpy.calls.reset();

        aElem.on('dblclick', () => {});
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn, false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn);
        }

        expect(removeEventListenerSpy).not.toHaveBeenCalled();

        aElem.off('click dblclick');

        if (isJQuery21()) {
          expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn, false);
          expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn, false);
        } else {
          expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn);
          expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn);
        }
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      });


      it('should deregister the native listener when all jqLite listeners for given type are gone ' +
         'after off() call',  () => {
        const aElem = jqLite(a);
        const addEventListenerSpy = spyOn(aElem[0], 'addEventListener').and.callThrough();
        const removeEventListenerSpy = spyOn(aElem[0], 'removeEventListener').and.callThrough();
        let nativeListenerFn;

        aElem.on('click', () => {});
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function), false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('click', jasmine.any(Function));
        }
        nativeListenerFn = addEventListenerSpy.calls.mostRecent().args[1];
        addEventListenerSpy.calls.reset();

        aElem.on('dblclick', () => {});
        if (isJQuery21()) {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn, false);
        } else {
          expect(addEventListenerSpy).toHaveBeenCalledOnceWith('dblclick', nativeListenerFn);
        }

        aElem.off();

        if (isJQuery21()) {
          expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn, false);
          expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn, false);
        } else {
          expect(removeEventListenerSpy).toHaveBeenCalledWith('click', nativeListenerFn);
          expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', nativeListenerFn);
        }
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      });
    });


    it('should throw an error if a selector is passed', () => {
      if (!_jqLiteMode) return;

      const aElem = jqLite(a);
      aElem.on('click', noop);
      expect(() => {
        aElem.off('click', noop, '.test');
      }).toThrowMinErr('jqLite', 'offargs');
    });
  });

  describe('one', () => {

    it('should only fire the callback once', () => {
      const element = jqLite(a);
      const spy = jasmine.createSpy('click');

      element.one('click', spy);

      browserTrigger(element, 'click');
      expect(spy).toHaveBeenCalledOnce();

      browserTrigger(element, 'click');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should deregister when off is called', () => {
      const element = jqLite(a);
      const spy = jasmine.createSpy('click');

      element.one('click', spy);
      element.off('click', spy);

      browserTrigger(element, 'click');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should return the same event object just as on() does', () => {
      const element = jqLite(a);
      let eventA; let eventB;
      element.on('click', (event) => {
        eventA = event;
      });
      element.one('click', (event) => {
        eventB = event;
      });

      browserTrigger(element, 'click');
      expect(eventA).toEqual(eventB);
    });

    it('should not remove other event handlers of the same type after execution', () => {
      const element = jqLite(a);
      const calls = [];
      element.one('click', (event) => {
        calls.push('one');
      });
      element.on('click', (event) => {
        calls.push('on');
      });

      browserTrigger(element, 'click');
      browserTrigger(element, 'click');

      expect(calls).toEqual(['one','on','on']);
    });
  });


  describe('replaceWith', () => {
    it('should replaceWith', () => {
      const root = jqLite('<div>').html('before-<div></div>after');
      const div = root.find('div');
      expect(div.replaceWith('<span>span-</span><b>bold-</b>')).toEqual(div);
      expect(root.text()).toEqual('before-span-bold-after');
    });


    it('should replaceWith text', () => {
      const root = jqLite('<div>').html('before-<div></div>after');
      const div = root.find('div');
      expect(div.replaceWith('text-')).toEqual(div);
      expect(root.text()).toEqual('before-text-after');
    });
  });


  describe('children', () => {
    it('should only select element nodes', () => {
      const root = jqLite('<div><!-- some comment -->before-<div></div>after-<span></span>');
      const div = root.find('div');
      const span = root.find('span');
      expect(root.children()).toJqEqual([div, span]);
    });
  });


  describe('contents', () => {
    it('should select all types child nodes', () => {
      const root = jqLite('<div><!-- some comment -->before-<div></div>after-<span></span></div>');
      const contents = root.contents();
      expect(contents.length).toEqual(5);
      expect(contents[0].data).toEqual(' some comment ');
      expect(contents[1].data).toEqual('before-');
    });

    it('should select all types iframe contents', (done) => {
      const iframe_ = document.createElement('iframe');
      let tested = false;
      const iframe = jqLite(iframe_);
      function test() {
        let doc = iframe_.contentDocument || iframe_.contentWindow.document;
        doc.body.innerHTML = '\n<span>Text</span>\n';

        const contents = iframe.contents();
        expect(contents[0]).toBeTruthy();
        expect(contents.length).toBe(1);
        expect(contents.prop('nodeType')).toBe(9);
        expect(contents[0].body).toBeTruthy();
        expect(jqLite(contents[0].body).contents().length).toBe(3);
        iframe.remove();
        doc = null;
        tested = true;
      }
      iframe_.onload = iframe_.onreadystatechange = function() {
        if (iframe_.contentDocument) test();
      };
      // eslint-disable-next-line no-script-url
      iframe_.src = 'javascript:false';
      jqLite(document).find('body').append(iframe);

      // This test is potentially flaky on CI cloud instances, so there is a generous
      // wait period...
      const job = createAsync(done);
      job.waitsFor(() => tested, 'iframe to load', 5000).done();
      job.start();
    });
  });


  describe('append', () => {
    it('should append', () => {
      const root = jqLite('<div>');
      expect(root.append('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>');
    });
    it('should append text', () => {
      const root = jqLite('<div>');
      expect(root.append('text')).toEqual(root);
      expect(root.html()).toEqual('text');
    });
    it('should append to document fragment', () => {
      const root = jqLite(document.createDocumentFragment());
      expect(root.append('<p>foo</p>')).toBe(root);
      expect(root.children().length).toBe(1);
    });
    it('should not append anything if parent node is not of type element or docfrag', () => {
      const root = jqLite('<p>some text node</p>').contents();
      expect(root.append('<p>foo</p>')).toBe(root);
      expect(root.children().length).toBe(0);
    });
  });


  describe('wrap', () => {
    it('should wrap text node', () => {
      const root = jqLite('<div>A&lt;a&gt;B&lt;/a&gt;C</div>');
      const text = root.contents();
      expect(text.wrap('<span>')[0]).toBe(text[0]);
      expect(root.find('span').text()).toEqual('A<a>B</a>C');
    });
    it('should wrap free text node', () => {
      const root = jqLite('<div>A&lt;a&gt;B&lt;/a&gt;C</div>');
      const text = root.contents();
      text.remove();
      expect(root.text()).toBe('');

      text.wrap('<span>');
      expect(text.parent().text()).toEqual('A<a>B</a>C');
    });
    it('should clone elements to be wrapped around target', () => {
      const root = jqLite('<div class="sigil"></div>');
      const span = jqLite('<span>A</span>');

      span.wrap(root);
      expect(root.children().length).toBe(0);
      expect(span.parent().hasClass('sigil')).toBeTruthy();
    });
    it('should wrap multiple elements', () => {
      const root = jqLite('<div class="sigil"></div>');
      const spans = jqLite('<span>A</span><span>B</span><span>C</span>');

      spans.wrap(root);

      expect(spans.eq(0).parent().hasClass('sigil')).toBeTruthy();
      expect(spans.eq(1).parent().hasClass('sigil')).toBeTruthy();
      expect(spans.eq(2).parent().hasClass('sigil')).toBeTruthy();
    });
  });


  describe('prepend', () => {
    it('should prepend to empty', () => {
      const root = jqLite('<div>');
      expect(root.prepend('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>');
    });
    it('should prepend to content', () => {
      const root = jqLite('<div>text</div>');
      expect(root.prepend('<span>abc</span>')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('<span>abc</span>text');
    });
    it('should prepend text to content', () => {
      const root = jqLite('<div>text</div>');
      expect(root.prepend('abc')).toEqual(root);
      expect(root.html().toLowerCase()).toEqual('abctext');
    });
    it('should prepend array to empty in the right order', () => {
      const root = jqLite('<div>');
      expect(root.prepend([a, b, c])).toBe(root);
      expect(sortedHtml(root)).
        toBe('<div><div>A</div><div>B</div><div>C</div></div>');
    });
    it('should prepend array to content in the right order', () => {
      const root = jqLite('<div>text</div>');
      expect(root.prepend([a, b, c])).toBe(root);
      expect(sortedHtml(root)).
        toBe('<div><div>A</div><div>B</div><div>C</div>text</div>');
    });
  });


  describe('remove', () => {
    it('should remove', () => {
      const root = jqLite('<div><span>abc</span></div>');
      const span = root.find('span');
      expect(span.remove()).toEqual(span);
      expect(root.html()).toEqual('');
    });
  });


  describe('detach', () => {
    it('should detach', () => {
      const root = jqLite('<div><span>abc</span></div>');
      const span = root.find('span');
      expect(span.detach()).toEqual(span);
      expect(root.html()).toEqual('');
    });
  });


  describe('after', () => {
    it('should after', () => {
      const root = jqLite('<div><span></span></div>');
      const span = root.find('span');
      expect(span.after('<i></i><b></b>')).toEqual(span);
      expect(root.html().toLowerCase()).toEqual('<span></span><i></i><b></b>');
    });


    it('should allow taking text', () => {
      const root = jqLite('<div><span></span></div>');
      const span = root.find('span');
      span.after('abc');
      expect(root.html().toLowerCase()).toEqual('<span></span>abc');
    });


    it('should not throw when the element has no parent', () => {
      const span = jqLite('<span></span>');
      expect(() => { span.after('abc'); }).not.toThrow();
      expect(span.length).toBe(1);
      expect(span[0].outerHTML).toBe('<span></span>');
    });
  });


  describe('parent', () => {
    it('should return parent or an empty set when no parent', () => {
      const parent = jqLite('<div><p>abc</p></div>');
          const child = parent.find('p');

      expect(parent.parent()).toBeTruthy();
      expect(parent.parent().length).toEqual(0);

      expect(child.parent().length).toBe(1);
      expect(child.parent()[0]).toBe(parent[0]);
    });


    it('should return empty set when no parent', () => {
      const element = jqLite('<div>abc</div>');
      expect(element.parent()).toBeTruthy();
      expect(element.parent().length).toEqual(0);
    });


    it('should return empty jqLite object when parent is a document fragment', () => {
      // this is quite unfortunate but jQuery 1.5.1 behaves this way
      const fragment = document.createDocumentFragment();
          const child = jqLite('<p>foo</p>');

      fragment.appendChild(child[0]);
      expect(child[0].parentNode).toBe(fragment);
      expect(child.parent().length).toBe(0);
    });
  });


  describe('next', () => {
    it('should return next sibling', () => {
      const element = jqLite('<div><b>b</b><i>i</i></div>');
      const b = element.find('b');
      const i = element.find('i');
      expect(b.next()).toJqEqual([i]);
    });


    it('should ignore non-element siblings', () => {
      const element = jqLite('<div><b>b</b>TextNode<!-- comment node --><i>i</i></div>');
      const b = element.find('b');
      const i = element.find('i');
      expect(b.next()).toJqEqual([i]);
    });
  });


  describe('find', () => {
    it('should find child by name', () => {
      const root = jqLite('<div><div>text</div></div>');
      const innerDiv = root.find('div');
      expect(innerDiv.length).toEqual(1);
      expect(innerDiv.html()).toEqual('text');
    });

    it('should find child by name and not care about text nodes', () => {
      const divs = jqLite('<div><span>aa</span></div>text<div><span>bb</span></div>');
      const innerSpan = divs.find('span');
      expect(innerSpan.length).toEqual(2);
    });
  });


  describe('eq', () => {
    it('should select the nth element ', () => {
      const element = jqLite('<div><span>aa</span></div><div><span>bb</span></div>');
      expect(element.find('span').eq(0).html()).toBe('aa');
      expect(element.find('span').eq(-1).html()).toBe('bb');
      expect(element.find('span').eq(20).length).toBe(0);
    });
  });


  describe('triggerHandler', () => {
    it('should trigger all registered handlers for an event', () => {
      const element = jqLite('<span>poke</span>');
          const pokeSpy = jasmine.createSpy('poke');
          const clickSpy1 = jasmine.createSpy('clickSpy1');
          const clickSpy2 = jasmine.createSpy('clickSpy2');

      element.on('poke', pokeSpy);
      element.on('click', clickSpy1);
      element.on('click', clickSpy2);

      expect(pokeSpy).not.toHaveBeenCalled();
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).not.toHaveBeenCalled();

      element.triggerHandler('poke');
      expect(pokeSpy).toHaveBeenCalledOnce();
      expect(clickSpy1).not.toHaveBeenCalled();
      expect(clickSpy2).not.toHaveBeenCalled();

      element.triggerHandler('click');
      expect(clickSpy1).toHaveBeenCalledOnce();
      expect(clickSpy2).toHaveBeenCalledOnce();
    });

    it('should pass in a dummy event', () => {
      // we need the event to have at least preventDefault because AngularJS will call it on
      // all anchors with no href automatically

      const element = jqLite('<a>poke</a>');
          const pokeSpy = jasmine.createSpy('poke');
          let event;

      element.on('click', pokeSpy);

      element.triggerHandler('click');
      event = pokeSpy.calls.mostRecent().args[0];
      expect(event.preventDefault).toBeDefined();
      expect(event.target).toEqual(element[0]);
      expect(event.type).toEqual('click');
    });

    it('should pass extra parameters as an additional argument', () => {
      const element = jqLite('<a>poke</a>');
          const pokeSpy = jasmine.createSpy('poke');
          let data;

      element.on('click', pokeSpy);

      element.triggerHandler('click', [{hello: 'world'}]);
      data = pokeSpy.calls.mostRecent().args[1];
      expect(data.hello).toBe('world');
    });

    it('should mark event as prevented if preventDefault is called', () => {
      const element = jqLite('<a>poke</a>');
          const pokeSpy = jasmine.createSpy('poke');
          let event;

      element.on('click', pokeSpy);
      element.triggerHandler('click');
      event = pokeSpy.calls.mostRecent().args[0];

      expect(event.isDefaultPrevented()).toBe(false);
      event.preventDefault();
      expect(event.isDefaultPrevented()).toBe(true);
    });

    it('should support handlers that deregister themselves', () => {
      const element = jqLite('<a>poke</a>');
          const clickSpy = jasmine.createSpy('click');
          const clickOnceSpy = jasmine.createSpy('clickOnce').and.callFake(() => {
            element.off('click', clickOnceSpy);
          });

      element.on('click', clickOnceSpy);
      element.on('click', clickSpy);

      element.triggerHandler('click');
      expect(clickOnceSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();

      element.triggerHandler('click');
      expect(clickOnceSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('should accept a custom event instead of eventName', () => {
      const element = jqLite('<a>poke</a>');
          const pokeSpy = jasmine.createSpy('poke');
          const customEvent = {
            type: 'click',
            someProp: 'someValue'
          };
          let actualEvent;

      element.on('click', pokeSpy);
      element.triggerHandler(customEvent);
      actualEvent = pokeSpy.calls.mostRecent().args[0];
      expect(actualEvent.preventDefault).toBeDefined();
      expect(actualEvent.someProp).toEqual('someValue');
      expect(actualEvent.target).toEqual(element[0]);
      expect(actualEvent.type).toEqual('click');
    });

    it('should stop triggering handlers when stopImmediatePropagation is called', () => {
      const element = jqLite(a);
          const clickSpy1 = jasmine.createSpy('clickSpy1');
          const clickSpy2 = jasmine.createSpy('clickSpy2').and.callFake((event) => { event.stopImmediatePropagation(); });
          const clickSpy3 = jasmine.createSpy('clickSpy3');

      element.on('click', clickSpy1);
      element.on('click', clickSpy2);
      element.on('click', clickSpy3);

      element.triggerHandler('click');

      expect(clickSpy1).toHaveBeenCalled();
      expect(clickSpy2).toHaveBeenCalled();
      expect(clickSpy3).not.toHaveBeenCalled();
    });

    it('should have event.isImmediatePropagationStopped method', () => {
      const element = jqLite(a);
          const clickSpy = jasmine.createSpy('clickSpy');
          let event;

      element.on('click', clickSpy);
      element.triggerHandler('click');
      event = clickSpy.calls.mostRecent().args[0];

      expect(event.isImmediatePropagationStopped()).toBe(false);
      event.stopImmediatePropagation();
      expect(event.isImmediatePropagationStopped()).toBe(true);
    });
  });


  describe('kebabToCamel', () => {
    it('should leave non-dashed strings alone', () => {
      expect(kebabToCamel('foo')).toBe('foo');
      expect(kebabToCamel('')).toBe('');
      expect(kebabToCamel('fooBar')).toBe('fooBar');
    });

    it('should convert dash-separated strings to camelCase', () => {
      expect(kebabToCamel('foo-bar')).toBe('fooBar');
      expect(kebabToCamel('foo-bar-baz')).toBe('fooBarBaz');
      expect(kebabToCamel('foo:bar_baz')).toBe('foo:bar_baz');
    });

    it('should convert leading dashes followed by a lowercase letter', () => {
      expect(kebabToCamel('-foo-bar')).toBe('FooBar');
    });

    it('should not convert dashes followed by a non-letter', () => {
      expect(kebabToCamel('foo-42- -a-B')).toBe('foo-42- A-B');
    });

    it('should not convert browser specific css properties in a special way', () => {
      expect(kebabToCamel('-ms-foo-bar')).toBe('MsFooBar');
      expect(kebabToCamel('-moz-foo-bar')).toBe('MozFooBar');
      expect(kebabToCamel('-webkit-foo-bar')).toBe('WebkitFooBar');
    });

    it('should not collapse sequences of dashes', () => {
      expect(kebabToCamel('foo---bar-baz--qaz')).toBe('foo--BarBaz-Qaz');
    });
  });


  describe('jqLiteDocumentLoaded', () => {

    function createMockWindow(readyState) {
      return {
        document: {readyState: readyState || 'loading'},
        setTimeout: jasmine.createSpy('window.setTimeout'),
        addEventListener: jasmine.createSpy('window.addEventListener'),
        removeEventListener: jasmine.createSpy('window.removeEventListener')
      };
    }

    it('should execute the callback via a timeout if the document has already completed loading', () => {
      function onLoadCallback() { }

      const mockWindow = createMockWindow('complete');

      jqLiteDocumentLoaded(onLoadCallback, mockWindow);

      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
      expect(mockWindow.setTimeout.calls.mostRecent().args[0]).toBe(onLoadCallback);
    });


    it('should register a listener for the `load` event', () => {
      const onLoadCallback = jasmine.createSpy('onLoadCallback');
      const mockWindow = createMockWindow();

      jqLiteDocumentLoaded(onLoadCallback, mockWindow);

      expect(mockWindow.addEventListener).toHaveBeenCalledOnce();
    });


    it('should execute the callback only once the document completes loading', () => {
      const onLoadCallback = jasmine.createSpy('onLoadCallback');
      const mockWindow = createMockWindow();

      jqLiteDocumentLoaded(onLoadCallback, mockWindow);
      expect(onLoadCallback).not.toHaveBeenCalled();

      jqLite(mockWindow).triggerHandler('load');
      expect(onLoadCallback).toHaveBeenCalledOnce();
    });
  });


  describe('bind/unbind', () => {
    if (!_jqLiteMode) return;

    it('should alias bind() to on()', () => {
      const element = jqLite(a);
      expect(element.bind).toBe(element.on);
    });

    it('should alias unbind() to off()', () => {
      const element = jqLite(a);
      expect(element.unbind).toBe(element.off);
    });
  });
});
