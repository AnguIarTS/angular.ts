/* global jQuery: true, uid: true, jqCache: true */


if (window.bindJQuery) bindJQuery();

beforeEach(() => {

  // all this stuff is not needed for module tests, where jqlite and publishExternalAPI and jqLite are not global vars
  if (window.publishExternalAPI) {
    publishExternalAPI(angular);

    // This resets global id counter;
    uid = 0;

    // reset to jQuery or default to us.
    bindJQuery();

    // Clear the cache to prevent memory leak failures from previous tests
    // breaking subsequent tests unnecessarily
    jqCache = jqLite.cache = {};
  }

  angular.element(window.document.body).empty().removeData();
});

afterEach(function() {
  let count; let cache;

  // These Nodes are persisted across tests.
  // They used to be assigned a `$$hashKey` when animated, which we needed to clear after each test
  // to avoid affecting other tests. This is no longer the case, so we are just ensuring that there
  // is indeed no `$$hashKey` on them.
  const doc = window.document;
  const html = doc.querySelector('html');
  const {body} = doc;
  expect(doc.$$hashKey).toBeFalsy();
  expect(html && html.$$hashKey).toBeFalsy();
  expect(body && body.$$hashKey).toBeFalsy();

  if (this.$injector) {
    const $rootScope = this.$injector.get('$rootScope');
    const $rootElement = this.$injector.get('$rootElement');
    const $log = this.$injector.get('$log');
    // release the injector
    dealoc($rootScope);
    dealoc($rootElement);

    // check $log mock
    if ($log.assertEmpty) {
      $log.assertEmpty();
    }
  }

  if (!window.jQuery) {
    // jQuery 2.x doesn't expose the cache storage.

    // complain about uncleared jqCache references
    count = 0;

    cache = angular.element.cache;

    forEachSorted(cache, (expando, key) => {
      angular.forEach(expando.data, (value, key) => {
        count++;
        if (value && value.$element) {
          dump('LEAK', key, value.$id, sortedHtml(value.$element));
        } else {
          dump('LEAK', key, angular.toJson(value));
        }
        delete expando.data[key];
      });
    });
    if (count) {
      throw new Error(`Found jqCache references that were not deallocated! count: ${  count}`);
    }
  }

  // copied from Angular.js
  // we need this method here so that we can run module tests with wrapped angular.js
  function forEachSorted(obj, iterator, context) {
    const keys = Object.keys(obj).sort();
    for (let i = 0; i < keys.length; i++) {
      iterator.call(context, obj[keys[i]], keys[i]);
    }
    return keys;
  }
});


function dealoc(obj) {
  const jqCache = angular.element.cache;
  if (obj) {
    if (angular.isElement(obj)) {
      cleanup(angular.element(obj));
    } else if (!window.jQuery) {
      // jQuery 2.x doesn't expose the cache storage.
      for (const key in jqCache) {
        const value = jqCache[key];
        if (value.data && value.data.$scope === obj) {
          delete jqCache[key];
        }
      }
    }
  }

  function cleanup(element) {
    angular.element.cleanData(element);

    // Note:  We aren't using element.contents() here.  Under jQuery, element.contents() can fail
    // for IFRAME elements.  jQuery explicitly uses (element.contentDocument ||
    // element.contentWindow.document) and both properties are null for IFRAMES that aren't attached
    // to a document.
    const children = element[0].childNodes || [];
    for (let i = 0; i < children.length; i++) {
      cleanup(angular.element(children[i]));
    }
  }
}


function jqLiteCacheSize() {
  return Object.keys(jqLite.cache).length;
}


/**
 * @param {DOMElement} element
 * @param {boolean=} showNgClass
 */
function sortedHtml(element, showNgClass) {
  let html = '';
  forEach(jqLite(element), function toString(node) {

    if (node.nodeName === '#text') {
      html += node.nodeValue.
        replace(/&(\w+[&;\W])?/g, (match, entity) => entity ? match : '&amp;').
        replace(/</g, '&lt;').
        replace(/>/g, '&gt;');
    } else if (node.nodeName === '#comment') {
      html += `<!--${  node.nodeValue  }-->`;
    } else {
      html += `<${  (node.nodeName || '?NOT_A_NODE?').toLowerCase()}`;
      const attributes = node.attributes || [];
      const attrs = [];
      let className = node.className || '';
      if (!showNgClass) {
        className = className.replace(/ng-[\w-]+\s*/g, '');
      }
      className = trim(className);
      if (className) {
        attrs.push(` class="${  className  }"`);
      }
      for (let i = 0; i < attributes.length; i++) {
        if (i > 0 && attributes[i] === attributes[i - 1]) {
          continue; // IE9 creates dupes. Ignore them!
        }

        const attr = attributes[i];
        if (attr.name.match(/^ng[:-]/) ||
            !/^ng\d+/.test(attr.name) &&
            (attr.value || attr.value === '') &&
            attr.value !== 'null' &&
            attr.value !== 'auto' &&
            attr.value !== 'false' &&
            attr.value !== 'inherit' &&
            (attr.value !== '0' || attr.name === 'value') &&
            attr.name !== 'loop' &&
            attr.name !== 'complete' &&
            attr.name !== 'maxLength' &&
            attr.name !== 'size' &&
            attr.name !== 'class' &&
            attr.name !== 'start' &&
            attr.name !== 'tabIndex' &&
            attr.name !== 'style' &&
            attr.name.substr(0, 6) !== 'jQuery') {
          attrs.push(` ${  attr.name  }="${  attr.value  }"`);
        }
      }
      attrs.sort();
      html += attrs.join('');
      if (node.style) {
        let style = [];
        if (node.style.cssText) {
          forEach(node.style.cssText.split(';'), (value) => {
            value = trim(value);
            if (value) {
              style.push(lowercase(value));
            }
          });
        }
        for (const css in node.style) {
          const value = node.style[css];
          if (isString(value) && isString(css) && css !== 'cssText' && value && isNaN(Number(css))) {
            const text = lowercase(`${css  }: ${  value}`);
            if (value !== 'false' && style.indexOf(text) === -1) {
              style.push(text);
            }
          }
        }
        style.sort();
        const tmp = style;
        style = [];
        forEach(tmp, (value) => {
          if (!value.match(/^max[^-]/)) {
            style.push(value);
          }
        });
        if (style.length) {
          html += ` style="${  style.join('; ')  };"`;
        }
      }
      html += '>';
      const children = node.childNodes;
      for (let j = 0; j < children.length; j++) {
        toString(children[j]);
      }
      html += `</${  node.nodeName.toLowerCase()  }>`;
    }
  });
  return html;
}


function childrenTagsOf(element) {
  const tags = [];

  forEach(jqLite(element).children(), (child) => {
    tags.push(child.nodeName.toLowerCase());
  });

  return tags;
}


// TODO(vojta): migrate these helpers into jasmine matchers
/** a
 * This method is a cheap way of testing if css for a given node is not set to 'none'. It doesn't
 * actually test if an element is displayed by the browser. Be aware!!!
 */
function isCssVisible(node) {
  const display = node.css('display');
  return !node.hasClass('ng-hide') && display !== 'none';
}

function assertHidden(node) {
  if (isCssVisible(node)) {
    throw new Error(`Node should be hidden but was visible: ${  angular.mock.dump(node)}`);
  }
}

function assertVisible(node) {
  if (!isCssVisible(node)) {
    throw new Error(`Node should be visible but was hidden: ${  angular.mock.dump(node)}`);
  }
}

function provideLog($provide) {
  $provide.factory('log', () => {
      let messages = [];

      function log(msg) {
        messages.push(msg);
        return msg;
      }

      log.toString = function() {
        return messages.join('; ');
      };

      log.toArray = function() {
        return messages;
      };

      log.reset = function() {
        messages = [];
      };

      log.empty = function() {
        const currentMessages = messages;
        messages = [];
        return currentMessages;
      };

      log.fn = function(msg) {
        return function() {
          log(msg);
        };
      };

      log.$$log = true;

      return log;
    });
}

function pending() {
  window.dump('PENDING');
}

function trace(name) {
  window.dump(new Error(name).stack);
}

const karmaDump = window.dump || function() {
  window.console.log.apply(window.console, arguments);
};

window.dump = function() {
  karmaDump.apply(undefined, Array.prototype.map.call(arguments, (arg) => angular.mock.dump(arg)));
};

function generateInputCompilerHelper(helper) {
  beforeEach(() => {
    helper.validationCounter = {};

    module(($compileProvider) => {
      $compileProvider.directive('validationSpy', () => ({
          priority: 1,
          require: 'ngModel',
          link(scope, element, attrs, ctrl) {
            const validationName = attrs.validationSpy;

            const originalValidator = ctrl.$validators[validationName];
            helper.validationCounter[validationName] = 0;

            ctrl.$validators[validationName] = function(modelValue, viewValue) {
              helper.validationCounter[validationName]++;

              return originalValidator(modelValue, viewValue);
            };
          }
        }));

      $compileProvider.directive('attrCapture', () => function(scope, element, $attrs) {
          helper.attrs = $attrs;
        });
    });
    inject(($compile, $rootScope, $sniffer, $document, $rootElement) => {

      helper.compileInput = function(inputHtml, mockValidity, scope) {

        scope = helper.scope = scope || $rootScope;

        // Create the input element and dealoc when done
        helper.inputElm = jqLite(inputHtml);

        // Set up mock validation if necessary
        if (isObject(mockValidity)) {
          VALIDITY_STATE_PROPERTY = 'ngMockValidity';
          helper.inputElm.prop(VALIDITY_STATE_PROPERTY, mockValidity);
        }

        // Create the form element and dealoc when done
        helper.formElm = jqLite('<form name="form"></form>');
        helper.formElm.append(helper.inputElm);

        // Compile the lot and return the input element
        $compile(helper.formElm)(scope);

        $rootElement.append(helper.formElm);
        // Append the app to the document so that "click" on a radio/checkbox triggers "change"
        // Support: Chrome, Safari 8, 9
        jqLite($document[0].body).append($rootElement);

        spyOn(scope.form, '$addControl').and.callThrough();
        spyOn(scope.form, '$$renameControl').and.callThrough();

        scope.$digest();

        return helper.inputElm;
      };

      helper.changeInputValueTo = function(value) {
        helper.changeGivenInputTo(helper.inputElm, value);
      };

      helper.changeGivenInputTo = function(inputElm, value) {
        inputElm.val(value);
        browserTrigger(inputElm, $sniffer.hasEvent('input') ? 'input' : 'change');
      };

      helper.dealoc = function() {
        dealoc(helper.inputElm);
        dealoc(helper.formElm);
      };
    });
  });

  afterEach(() => {
    helper.dealoc();
  });

  afterEach(() => {
    VALIDITY_STATE_PROPERTY = 'validity';
  });
}

