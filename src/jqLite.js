/* eslint-disable no-multi-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable class-methods-use-this */
import {
  NODE_TYPE_ELEMENT,
  NODE_TYPE_DOCUMENT,
  NODE_TYPE_DOCUMENT_FRAGMENT,
  NODE_TYPE_TEXT,
  NODE_TYPE_ATTRIBUTE,
  NODE_TYPE_COMMENT,
} from "./constants";
import {
  minErr,
  arrayRemove,
  concat,
  extend,
  forEach,
  isArray,
  isDefined,
  isFunction,
  isObject,
  isString,
  isUndefined,
  lowercase,
  nodeName_,
  noop,
  shallowCopy,
  trim,
} from "./ng/utils";

/// ///////////////////////////////
// JQLite
/// ///////////////////////////////

/**
 * @ngdoc function
 * @name angular.element
 * @module ng
 * @kind function
 *
 * @description
 * Wraps a raw DOM element or HTML string as a [jQuery](http://jquery.com) element.
 *
 * If jQuery is available, `angular.element` is an alias for the
 * [jQuery](http://api.jquery.com/jQuery/) function. If jQuery is not available, `angular.element`
 * delegates to AngularJS's built-in subset of jQuery, called "jQuery lite" or **jqLite**.
 *
 * jqLite is a tiny, API-compatible subset of jQuery that allows
 * AngularJS to manipulate the DOM in a cross-browser compatible way. jqLite implements only the most
 * commonly needed functionality with the goal of having a very small footprint.
 *
 * To use `jQuery`, simply ensure it is loaded before the `angular.js` file. You can also use the
 * {@link ngJq `ngJq`} directive to specify that jqlite should be used over jQuery, or to use a
 * specific version of jQuery if multiple versions exist on the page.
 *
 * <div class="alert alert-info">**Note:** All element references in AngularJS are always wrapped with jQuery or
 * jqLite (such as the element argument in a directive's compile / link function). They are never raw DOM references.</div>
 *
 * <div class="alert alert-warning">**Note:** Keep in mind that this function will not find elements
 * by tag name / CSS selector. For lookups by tag name, try instead `angular.element(document).find(...)`
 * or `$document.find()`, or use the standard DOM APIs, e.g. `document.querySelectorAll()`.</div>
 *
 * ## AngularJS's jqLite
 * jqLite provides only the following jQuery methods:
 *
 * - [`addClass()`](http://api.jquery.com/addClass/) - Does not support a function as first argument
 * - [`after()`](http://api.jquery.com/after/)
 * - [`append()`](http://api.jquery.com/append/) - Contrary to jQuery, this doesn't clone elements
 *   so will not work correctly when invoked on a jqLite object containing more than one DOM node
 * - [`attr()`](http://api.jquery.com/attr/) - Does not support functions as parameters
 * - [`bind()`](http://api.jquery.com/bind/) (_deprecated_, use [`on()`](http://api.jquery.com/on/)) - Does not support namespaces, selectors or eventData
 * - [`children()`](http://api.jquery.com/children/) - Does not support selectors
 * - [`clone()`](http://api.jquery.com/clone/)
 * - [`contents()`](http://api.jquery.com/contents/)
 * - [`css()`](http://api.jquery.com/css/) - Only retrieves inline-styles, does not call `getComputedStyle()`.
 *   As a setter, does not convert numbers to strings or append 'px', and also does not have automatic property prefixing.
 * - [`data()`](http://api.jquery.com/data/)
 * - [`detach()`](http://api.jquery.com/detach/)
 * - [`empty()`](http://api.jquery.com/empty/)
 * - [`eq()`](http://api.jquery.com/eq/)
 * - [`find()`](http://api.jquery.com/find/) - Limited to lookups by tag name
 * - [`hasClass()`](http://api.jquery.com/hasClass/)
 * - [`html()`](http://api.jquery.com/html/)
 * - [`next()`](http://api.jquery.com/next/) - Does not support selectors
 * - [`on()`](http://api.jquery.com/on/) - Does not support namespaces, selectors or eventData
 * - [`off()`](http://api.jquery.com/off/) - Does not support namespaces, selectors or event object as parameter
 * - [`one()`](http://api.jquery.com/one/) - Does not support namespaces or selectors
 * - [`parent()`](http://api.jquery.com/parent/) - Does not support selectors
 * - [`prepend()`](http://api.jquery.com/prepend/)
 * - [`prop()`](http://api.jquery.com/prop/)
 * - [`ready()`](http://api.jquery.com/ready/) (_deprecated_, use `angular.element(callback)` instead of `angular.element(document).ready(callback)`)
 * - [`remove()`](http://api.jquery.com/remove/)
 * - [`removeAttr()`](http://api.jquery.com/removeAttr/) - Does not support multiple attributes
 * - [`removeClass()`](http://api.jquery.com/removeClass/) - Does not support a function as first argument
 * - [`removeData()`](http://api.jquery.com/removeData/)
 * - [`replaceWith()`](http://api.jquery.com/replaceWith/)
 * - [`text()`](http://api.jquery.com/text/)
 * - [`toggleClass()`](http://api.jquery.com/toggleClass/) - Does not support a function as first argument
 * - [`triggerHandler()`](http://api.jquery.com/triggerHandler/) - Passes a dummy event object to handlers
 * - [`unbind()`](http://api.jquery.com/unbind/) (_deprecated_, use [`off()`](http://api.jquery.com/off/)) - Does not support namespaces or event object as parameter
 * - [`val()`](http://api.jquery.com/val/)
 * - [`wrap()`](http://api.jquery.com/wrap/)
 *
 * jqLite also provides a method restoring pre-1.8 insecure treatment of XHTML-like tags.
 * This legacy behavior turns input like `<div /><span />` to `<div></div><span></span>`
 * instead of `<div><span></span></div>` like version 1.8 & newer do. To restore it, invoke:
 * ```js
 * angular.UNSAFE_restoreLegacyJqLiteXHTMLReplacement();
 * ```
 * Note that this only patches jqLite. If you use jQuery 3.5.0 or newer, please read the
 * [jQuery 3.5 upgrade guide](https://jquery.com/upgrade-guide/3.5/) for more details
 * about the workarounds.
 *
 * ## jQuery/jqLite Extras
 * AngularJS also provides the following additional methods and events to both jQuery and jqLite:
 *
 * ### Events
 * - `$destroy` - AngularJS intercepts all jqLite/jQuery's DOM destruction apis and fires this event
 *    on all DOM nodes being removed.  This can be used to clean up any 3rd party bindings to the DOM
 *    element before it is removed.
 *
 * ### Methods
 * - `controller(name)` - retrieves the controller of the current element or its parent. By default
 *   retrieves controller associated with the `ngController` directive. If `name` is provided as
 *   camelCase directive name, then the controller for this directive will be retrieved (e.g.
 *   `'ngModel'`).
 * - `injector()` - retrieves the injector of the current element or its parent.
 * - `scope()` - retrieves the {@link ng.$rootScope.Scope scope} of the current
 *   element or its parent. Requires {@link guide/production#disabling-debug-data Debug Data} to
 *   be enabled.
 * - `isolateScope()` - retrieves an isolate {@link ng.$rootScope.Scope scope} if one is attached directly to the
 *   current element. This getter should be used only on elements that contain a directive which starts a new isolate
 *   scope. Calling `scope()` on this element always returns the original non-isolate scope.
 *   Requires {@link guide/production#disabling-debug-data Debug Data} to be enabled.
 * - `inheritedData()` - same as `data()`, but walks up the DOM until a value is found or the top
 *   parent element is reached.
 *
 * @knownIssue You cannot spy on `angular.element` if you are using Jasmine version 1.x. See
 * https://github.com/angular/angular.js/issues/14251 for more information.
 *
 * @param {string|HTMLElement} element HTML string or DOMElement to be wrapped into jQuery.
 * @returns {Object} jQuery object.
 */

let jqId = 1;

function jqNextId() {
  return ++jqId;
}

const DASH_LOWERCASE_REGEXP = /-([a-z])/g;
const MS_HACK_REGEXP = /^-ms-/;
const MOUSE_EVENT_MAP = { mouseleave: "mouseout", mouseenter: "mouseover" };
const jqLiteMinErr = minErr("jqLite");

/**
 * Converts kebab-case to camelCase.
 * There is also a special case for the ms prefix starting with a lowercase letter.
 * @param name Name to normalize
 */
function cssKebabToCamel(name) {
  return kebabToCamel(name.replace(MS_HACK_REGEXP, "ms-"));
}

function fnCamelCaseReplace(all, letter) {
  return letter.toUpperCase();
}

/**
 * Converts kebab-case to camelCase.
 * @param name Name to normalize
 */
function kebabToCamel(name) {
  return name.replace(DASH_LOWERCASE_REGEXP, fnCamelCaseReplace);
}

const SINGLE_TAG_REGEXP = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/;
const HTML_REGEXP = /<|&#?\w+;/;
const TAG_NAME_REGEXP = /<([\w:-]+)/;

// Table parts need to be wrapped with `<table>` or they're
// stripped to their contents when put in a div.
// XHTML parsers do not magically insert elements in the
// same way that tag soup parsers do, so we cannot shorten
// this by omitting <tbody> or other required elements.
const wrapMap = {
  thead: ["table"],
  col: ["colgroup", "table"],
  tr: ["tbody", "table"],
  td: ["tr", "tbody", "table"],
};

wrapMap.tbody =
  wrapMap.tfoot =
  wrapMap.colgroup =
  wrapMap.caption =
    wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: IE <10 only
// IE 9 requires an option wrapper & it needs to have the whole table structure
// set up in advance; assigning `"<td></td>"` to `tr.innerHTML` doesn't work, etc.
const wrapMapIE9 = {
  option: [1, '<select multiple="multiple">', "</select>"],
  _default: [0, "", ""],
};

for (const key in wrapMap) {
  const wrapMapValueClosing = wrapMap[key];
  const wrapMapValue = wrapMapValueClosing.slice().reverse();
  wrapMapIE9[key] = [
    wrapMapValue.length,
    `<${wrapMapValue.join("><")}>`,
    `</${wrapMapValueClosing.join("></")}>`,
  ];
}

wrapMapIE9.optgroup = wrapMapIE9.option;

function jqLiteIsTextNode(html) {
  return !HTML_REGEXP.test(html);
}

function jqLiteAcceptsData(node) {
  // The window object can accept data but has no nodeType
  // Otherwise we are only interested in elements (1) and documents (9)
  const { nodeType } = node;
  return (
    nodeType === NODE_TYPE_ELEMENT ||
    !nodeType ||
    nodeType === NODE_TYPE_DOCUMENT
  );
}

export function jqLiteHasData(node) {
  for (const key in jqCache[node.ng339]) {
    return true;
  }
  return false;
}

export function jqLiteBuildFragment(html, context) {
  let tmp;
  let tag;
  let wrap;
  const fragment = context.createDocumentFragment();
  let nodes = [];
  let i;

  if (jqLiteIsTextNode(html)) {
    // Convert non-html into a text node
    nodes.push(context.createTextNode(html));
  } else {
    // Convert html into DOM nodes
    tmp = fragment.appendChild(context.createElement("div"));
    tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();
    wrap = wrapMap[tag] || [];
    // Create wrappers & descend into them
    i = wrap.length;
    // eslint-disable-next-line no-plusplus
    while (--i > -1) {
      tmp.appendChild(window.document.createElement(wrap[i]));
      tmp = tmp.firstChild;
    }

    tmp.innerHTML = html;

    nodes = concat(nodes, tmp.childNodes);

    tmp = fragment.firstChild;
    tmp.textContent = "";
  }

  // Remove wrapper from fragment
  fragment.textContent = "";
  fragment.innerHTML = ""; // Clear inner HTML
  forEach(nodes, (node) => {
    fragment.appendChild(node);
  });

  return fragment;
}

export function jqLiteParseHTML(html, context) {
  context = context || window.document;
  let parsed;

  if ((parsed = SINGLE_TAG_REGEXP.exec(html))) {
    return [context.createElement(parsed[1])];
  }

  if ((parsed = jqLiteBuildFragment(html, context))) {
    return parsed.childNodes;
  }

  return [];
}

function jqLiteWrapNode(node, wrapper) {
  const parent = node.parentNode;

  if (parent) {
    parent.replaceChild(wrapper, node);
  }

  wrapper.appendChild(node);
}

const jqLiteContains = window.Node.prototype.contains;

/**
 *
 * @param {Node} element
 * @returns
 */
export function jqLite(element) {
  return new JQLite(element);
}

/// //////////////////////////////////////////
class JQLite {
  /**
   * @param {Node} element
   */
  constructor(element) {
    this.element = element;
    this.length = 0;
  }

  splice() {
    return [].splice;
  }

  sort() {
    return [].sort;
  }

  clone() {
    return jqLite(this.element.cloneNode(true));
  }

  ready(fn) {
    function trigger() {
      window.document.removeEventListener("DOMContentLoaded", trigger);
      window.removeEventListener("load", trigger);
      fn();
    }

    // check if document is already loaded
    if (window.document.readyState === "complete") {
      window.setTimeout(fn);
    } else {
      // We can not use jqLite since we are not done loading and jQuery could be loaded later.

      // Works for modern browsers and IE9
      window.document.addEventListener("DOMContentLoaded", trigger);

      // Fallback to window.onload for others
      window.addEventListener("load", trigger);
    }
  }

  toString() {
    const value = [];
    forEach(this, (e) => {
      value.push(`${e}`);
    });
    return `[${value.join(", ")}]`;
  }

  eq(index) {
    return index >= 0 ? jqLite(this[index]) : jqLite(this[this.length + index]);
  }

  cleanData(nodes) {
    for (let i = 0, ii = nodes.length; i < ii; i++) {
      jqLiteRemoveData(nodes[i]);
      jqLiteOff(nodes[i]);
    }
  }

  removeData(element, name) {
    const expandoId = element.ng339;
    const expandoStore = expandoId && jqCache[expandoId];

    if (expandoStore) {
      if (name) {
        delete expandoStore.data[name];
      } else {
        expandoStore.data = {};
      }

      removeIfEmptyData(element);
    }
  }

  on(element, type, fn, unsupported) {
    if (isDefined(unsupported))
      throw jqLiteMinErr(
        "onargs",
        "jqLite#on() does not support the `selector` or `eventData` parameters",
      );

    // Do not add event handlers to non-elements because they will not be cleaned up.
    if (!jqLiteAcceptsData(element)) {
      return;
    }

    const expandoStore = jqLiteExpandoStore(element, true);
    const { events } = expandoStore;
    let { handle } = expandoStore;

    if (!handle) {
      handle = expandoStore.handle = createEventHandler(element, events);
    }

    // http://jsperf.com/string-indexof-vs-split
    const types = type.indexOf(" ") >= 0 ? type.split(" ") : [type];
    let i = types.length;

    const addHandler = function (type, specialHandlerWrapper, noEventListener) {
      let eventFns = events[type];

      if (!eventFns) {
        eventFns = events[type] = [];
        eventFns.specialHandlerWrapper = specialHandlerWrapper;
        if (type !== "$destroy" && !noEventListener) {
          element.addEventListener(type, handle);
        }
      }

      eventFns.push(fn);
    };

    while (i--) {
      type = types[i];
      if (MOUSE_EVENT_MAP[type]) {
        addHandler(MOUSE_EVENT_MAP[type], specialMouseHandlerWrapper);
        addHandler(type, undefined, true);
      } else {
        addHandler(type);
      }
    }
  }

  injector(element) {
    return jqLiteInheritedData(element, "$injector");
  }
}

const jqCache = (JQLite.cache = {});

/*
 * !!! This is an undocumented "private" function !!!
 */
JQLite._data = function (node) {
  // jQuery always returns an object on cache miss
  return this.cache[node.ng339] || {};
};

JQLite._data = undefined;

JQLite.cache = undefined;

function jqLiteDealoc(element, onlyDescendants) {
  if (!onlyDescendants && jqLiteAcceptsData(element))
    jqLite.cleanData([element]);

  if (element.querySelectorAll) {
    jqLite.cleanData(element.querySelectorAll("*"));
  }
}

function isEmptyObject(obj) {
  let name;

  for (name in obj) {
    return false;
  }
  return true;
}

function removeIfEmptyData(element) {
  const expandoId = element.ng339;
  const expandoStore = expandoId && jqCache[expandoId];

  const events = expandoStore && expandoStore.events;
  const data = expandoStore && expandoStore.data;

  if ((!data || isEmptyObject(data)) && (!events || isEmptyObject(events))) {
    delete jqCache[expandoId];
    element.ng339 = undefined; // don't delete DOM expandos. IE and Chrome don't like it
  }
}

function jqLiteOff(element, type, fn, unsupported) {
  if (isDefined(unsupported))
    throw jqLiteMinErr(
      "offargs",
      "jqLite#off() does not support the `selector` argument",
    );

  const expandoStore = jqLiteExpandoStore(element);
  const events = expandoStore && expandoStore.events;
  const handle = expandoStore && expandoStore.handle;

  if (!handle) return; // no listeners registered

  if (!type) {
    for (type in events) {
      if (type !== "$destroy") {
        element.removeEventListener(type, handle);
      }
      delete events[type];
    }
  } else {
    const removeHandler = function (type) {
      const listenerFns = events[type];
      if (isDefined(fn)) {
        arrayRemove(listenerFns || [], fn);
      }
      if (!(isDefined(fn) && listenerFns && listenerFns.length > 0)) {
        element.removeEventListener(type, handle);
        delete events[type];
      }
    };

    forEach(type.split(" "), (type) => {
      removeHandler(type);
      if (MOUSE_EVENT_MAP[type]) {
        removeHandler(MOUSE_EVENT_MAP[type]);
      }
    });
  }

  removeIfEmptyData(element);
}

function jqLiteRemoveData(element, name) {
  const expandoId = element.ng339;
  const expandoStore = expandoId && jqCache[expandoId];

  if (expandoStore) {
    if (name) {
      delete expandoStore.data[name];
    } else {
      expandoStore.data = {};
    }

    removeIfEmptyData(element);
  }
}

function jqLiteExpandoStore(element, createIfNecessary) {
  let expandoId = element.ng339;
  let expandoStore = expandoId && jqCache[expandoId];

  if (createIfNecessary && !expandoStore) {
    element.ng339 = expandoId = jqNextId();
    expandoStore = jqCache[expandoId] = {
      events: {},
      data: {},
      handle: undefined,
    };
  }

  return expandoStore;
}

function jqLiteData(element, key, value) {
  if (jqLiteAcceptsData(element)) {
    let prop;

    const isSimpleSetter = isDefined(value);
    const isSimpleGetter = !isSimpleSetter && key && !isObject(key);
    const massGetter = !key;
    const expandoStore = jqLiteExpandoStore(element, !isSimpleGetter);
    const data = expandoStore && expandoStore.data;

    if (isSimpleSetter) {
      // data('key', value)
      data[kebabToCamel(key)] = value;
    } else {
      if (massGetter) {
        // data()
        return data;
      }
      if (isSimpleGetter) {
        // data('key')
        // don't force creation of expandoStore if it doesn't exist yet
        return data && data[kebabToCamel(key)];
      }
      // mass-setter: data({key1: val1, key2: val2})
      for (prop in key) {
        data[kebabToCamel(prop)] = key[prop];
      }
    }
  }
}

function jqLiteHasClass(element, selector) {
  if (!element.getAttribute) return false;
  return (
    ` ${element.getAttribute("class") || ""} `
      .replace(/[\n\t]/g, " ")
      .indexOf(` ${selector} `) > -1
  );
}

function jqLiteRemoveClass(element, cssClasses) {
  if (cssClasses && element.setAttribute) {
    const existingClasses = ` ${element.getAttribute("class") || ""} `.replace(
      /[\n\t]/g,
      " ",
    );
    let newClasses = existingClasses;

    forEach(cssClasses.split(" "), (cssClass) => {
      cssClass = trim(cssClass);
      newClasses = newClasses.replace(` ${cssClass} `, " ");
    });

    if (newClasses !== existingClasses) {
      element.setAttribute("class", trim(newClasses));
    }
  }
}

function jqLiteAddClass(element, cssClasses) {
  if (cssClasses && element.setAttribute) {
    const existingClasses = ` ${element.getAttribute("class") || ""} `.replace(
      /[\n\t]/g,
      " ",
    );
    let newClasses = existingClasses;

    forEach(cssClasses.split(" "), (cssClass) => {
      cssClass = trim(cssClass);
      if (newClasses.indexOf(` ${cssClass} `) === -1) {
        newClasses += `${cssClass} `;
      }
    });

    if (newClasses !== existingClasses) {
      element.setAttribute("class", trim(newClasses));
    }
  }
}

function jqLiteAddNodes(root, elements) {
  // THIS CODE IS VERY HOT. Don't make changes without benchmarking.

  if (elements) {
    // if a Node (the most common case)
    if (elements.nodeType) {
      root[root.length++] = elements;
    } else {
      const { length } = elements;

      // if an Array or NodeList and not a Window
      if (typeof length === "number" && elements.window !== elements) {
        if (length) {
          for (let i = 0; i < length; i++) {
            root[root.length++] = elements[i];
          }
        }
      } else {
        root[root.length++] = elements;
      }
    }
  }
}

function jqLiteController(element, name) {
  return jqLiteInheritedData(element, `$${name || "ngController"}Controller`);
}

function jqLiteInheritedData(element, name, value) {
  // if element is the document object work with the html element instead
  // this makes $(document).scope() possible
  if (element.nodeType === NODE_TYPE_DOCUMENT) {
    // eslint-disable-next-line no-param-reassign
    element = element.documentElement;
  }
  const names = isArray(name) ? name : [name];

  while (element) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0, ii = names.length; i < ii; i++) {
      // eslint-disable-next-line no-cond-assign, no-param-reassign
      if (isDefined((value = jqLite.data(element, names[i])))) return value;
    }

    // If dealing with a document fragment node with a host element, and no parent, use the host
    // element as the parent. This enables directives within a Shadow DOM or polyfilled Shadow DOM
    // to lookup parent controllers.
    // eslint-disable-next-line no-param-reassign
    element =
      element.parentNode ||
      (element.nodeType === NODE_TYPE_DOCUMENT_FRAGMENT && element.host);
  }
}

function jqLiteEmpty(element) {
  jqLiteDealoc(element, true);
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function jqLiteRemove(element, keepData) {
  if (!keepData) jqLiteDealoc(element);
  const parent = element.parentNode;
  if (parent) parent.removeChild(element);
}

function jqLiteDocumentLoaded(action, win) {
  win = win || window;
  if (win.document.readyState === "complete") {
    // Force the action to be run async for consistent behavior
    // from the action's point of view
    // i.e. it will definitely not be in a $apply
    win.setTimeout(action);
  } else {
    // No need to unbind this handler as load is only ever called once
    jqLite(win).on("load", action);
  }
}

/// ///////////////////////////////////////
// Functions iterating getter/setters.
// these functions return self on setter and
// value on get.
/// ///////////////////////////////////////
export const BOOLEAN_ATTR = {};
forEach(
  "multiple,selected,checked,disabled,readOnly,required,open".split(","),
  (value) => {
    BOOLEAN_ATTR[lowercase(value)] = value;
  },
);
const BOOLEAN_ELEMENTS = {};
forEach(
  "input,select,option,textarea,button,form,details".split(","),
  (value) => {
    BOOLEAN_ELEMENTS[value] = true;
  },
);
export const ALIASED_ATTR = {
  ngMinlength: "minlength",
  ngMaxlength: "maxlength",
  ngMin: "min",
  ngMax: "max",
  ngPattern: "pattern",
  ngStep: "step",
};

export function getBooleanAttrName(element, name) {
  // check dom last since we will most likely fail on name
  const booleanAttr = BOOLEAN_ATTR[name.toLowerCase()];

  // booleanAttr is here twice to minimize DOM access
  return booleanAttr && BOOLEAN_ELEMENTS[nodeName_(element)] && booleanAttr;
}

export function getAliasedAttrName(name) {
  return ALIASED_ATTR[name];
}

forEach(
  {
    data: jqLiteData,
    hasData: jqLiteHasData,
  },
  (fn, name) => {
    JQLite[name] = fn;
  },
);

forEach(
  {
    data: jqLiteData,
    inheritedData: jqLiteInheritedData,

    scope(element) {
      // Can't use jqLiteData here directly so we stay compatible with jQuery!
      return (
        jqLite.data(element, "$scope") ||
        jqLiteInheritedData(element.parentNode || element, [
          "$isolateScope",
          "$scope",
        ])
      );
    },

    isolateScope(element) {
      // Can't use jqLiteData here directly so we stay compatible with jQuery!
      return (
        jqLite.data(element, "$isolateScope") ||
        jqLite.data(element, "$isolateScopeNoTemplate")
      );
    },

    controller: jqLiteController,

    removeAttr(element, name) {
      element.removeAttribute(name);
    },

    hasClass: jqLiteHasClass,

    css(element, name, value) {
      name = cssKebabToCamel(name);

      if (isDefined(value)) {
        element.style[name] = value;
      } else {
        return element.style[name];
      }
    },

    attr(element, name, value) {
      let ret;
      const { nodeType } = element;
      if (
        nodeType === NODE_TYPE_TEXT ||
        nodeType === NODE_TYPE_ATTRIBUTE ||
        nodeType === NODE_TYPE_COMMENT ||
        !element.getAttribute
      ) {
        return;
      }

      const lowercasedName = lowercase(name);
      const isBooleanAttr = BOOLEAN_ATTR[lowercasedName];

      if (isDefined(value)) {
        // setter

        if (value === null || (value === false && isBooleanAttr)) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, isBooleanAttr ? lowercasedName : value);
        }
      } else {
        // getter

        ret = element.getAttribute(name);

        if (isBooleanAttr && ret !== null) {
          ret = lowercasedName;
        }
        // Normalize non-existing attributes to undefined (as jQuery).
        return ret === null ? undefined : ret;
      }
    },

    prop(element, name, value) {
      if (isDefined(value)) {
        element[name] = value;
      } else {
        return element[name];
      }
    },

    text: (function () {
      getText.$dv = "";
      return getText;

      function getText(element, value) {
        if (isUndefined(value)) {
          const { nodeType } = element;
          return nodeType === NODE_TYPE_ELEMENT || nodeType === NODE_TYPE_TEXT
            ? element.textContent
            : "";
        }
        element.textContent = value;
      }
    })(),

    val(element, value) {
      if (isUndefined(value)) {
        if (element.multiple && nodeName_(element) === "select") {
          const result = [];
          forEach(element.options, (option) => {
            if (option.selected) {
              result.push(option.value || option.text);
            }
          });
          return result;
        }
        return element.value;
      }
      element.value = value;
    },

    html(element, value) {
      if (isUndefined(value)) {
        return element.innerHTML;
      }
      jqLiteDealoc(element, true);
      element.innerHTML = value;
    },

    empty: jqLiteEmpty,
  },
  (fn, name) => {
    /**
     * Properties: writes return selection, reads return first value
     */
    JQLite.prototype[name] = function (arg1, arg2) {
      let i;
      let key;
      const nodeCount = this.length;

      // jqLiteHasClass has only two arguments, but is a getter-only fn, so we need to special-case it
      // in a way that survives minification.
      // jqLiteEmpty takes no arguments but is a setter.
      if (
        fn !== jqLiteEmpty &&
        isUndefined(
          fn.length === 2 && fn !== jqLiteHasClass && fn !== jqLiteController
            ? arg1
            : arg2,
        )
      ) {
        if (isObject(arg1)) {
          // we are a write, but the object properties are the key/values
          for (i = 0; i < nodeCount; i++) {
            if (fn === jqLiteData) {
              // data() takes the whole object in jQuery
              fn(this[i], arg1);
            } else {
              for (key in arg1) {
                fn(this[i], key, arg1[key]);
              }
            }
          }
          // return self for chaining
          return this;
        }
        // we are a read, so read the first child.
        // TODO: do we still need this?
        let value = fn.$dv;
        // Only if we have $dv do we iterate over all, otherwise it is just the first element.
        const jj = isUndefined(value) ? Math.min(nodeCount, 1) : nodeCount;
        for (let j = 0; j < jj; j++) {
          const nodeValue = fn(this[j], arg1, arg2);
          value = value ? value + nodeValue : nodeValue;
        }
        return value;
      }
      // we are a write, so apply to all children
      for (i = 0; i < nodeCount; i++) {
        fn(this[i], arg1, arg2);
      }
      // return self for chaining
      return this;
    };
  },
);

function createEventHandler(element, events) {
  const eventHandler = function (event, type) {
    // jQuery specific api
    event.isDefaultPrevented = function () {
      return event.defaultPrevented;
    };

    let eventFns = events[type || event.type];
    const eventFnsLength = eventFns ? eventFns.length : 0;

    if (!eventFnsLength) return;

    if (isUndefined(event.immediatePropagationStopped)) {
      const originalStopImmediatePropagation = event.stopImmediatePropagation;
      event.stopImmediatePropagation = function () {
        event.immediatePropagationStopped = true;

        if (event.stopPropagation) {
          event.stopPropagation();
        }

        if (originalStopImmediatePropagation) {
          originalStopImmediatePropagation.call(event);
        }
      };
    }

    event.isImmediatePropagationStopped = function () {
      return event.immediatePropagationStopped === true;
    };

    // Some events have special handlers that wrap the real handler
    const handlerWrapper =
      eventFns.specialHandlerWrapper || defaultHandlerWrapper;

    // Copy event handlers in case event handlers array is modified during execution.
    if (eventFnsLength > 1) {
      eventFns = shallowCopy(eventFns);
    }

    for (let i = 0; i < eventFnsLength; i++) {
      if (!event.isImmediatePropagationStopped()) {
        handlerWrapper(element, event, eventFns[i]);
      }
    }
  };

  // TODO: this is a hack for angularMocks/clearDataCache that makes it possible to deregister all
  //       events on `element`
  eventHandler.elem = element;
  return eventHandler;
}

function defaultHandlerWrapper(element, event, handler) {
  handler.call(element, event);
}

function specialMouseHandlerWrapper(target, event, handler) {
  // Refer to jQuery's implementation of mouseenter & mouseleave
  // Read about mouseenter and mouseleave:
  // http://www.quirksmode.org/js/events_mouse.html#link8
  const related = event.relatedTarget;
  // For mousenter/leave call the handler if related is outside the target.
  // NB: No relatedTarget if the mouse left/entered the browser window
  if (
    !related ||
    (related !== target && !jqLiteContains.call(target, related))
  ) {
    handler.call(target, event);
  }
}

/// ///////////////////////////////////////
// Functions iterating traversal.
// These functions chain results into a single
// selector.
/// ///////////////////////////////////////
forEach(
  {
    removeData: jqLiteRemoveData,

    off: jqLiteOff,

    one(element, type, fn) {
      element = jqLite(element);

      // add the listener twice so that when it is called
      // you can remove the original function and still be
      // able to call element.off(ev, fn) normally
      element.on(type, function onFn() {
        element.off(type, fn);
        element.off(type, onFn);
      });
      element.on(type, fn);
    },

    replaceWith(element, replaceNode) {
      let index;
      const parent = element.parentNode;
      jqLiteDealoc(element);
      forEach(new JQLite(replaceNode), (node) => {
        if (index) {
          parent.insertBefore(node, index.nextSibling);
        } else {
          parent.replaceChild(node, element);
        }
        index = node;
      });
    },

    children(element) {
      const children = [];
      forEach(element.childNodes, (element) => {
        if (element.nodeType === NODE_TYPE_ELEMENT) {
          children.push(element);
        }
      });
      return children;
    },

    contents(element) {
      return element.contentDocument || element.childNodes || [];
    },

    append(element, node) {
      const { nodeType } = element;
      if (
        nodeType !== NODE_TYPE_ELEMENT &&
        nodeType !== NODE_TYPE_DOCUMENT_FRAGMENT
      )
        return;

      node = new JQLite(node);

      for (let i = 0, ii = node.length; i < ii; i++) {
        const child = node[i];
        element.appendChild(child);
      }
    },

    prepend(element, node) {
      if (element.nodeType === NODE_TYPE_ELEMENT) {
        const index = element.firstChild;
        forEach(new JQLite(node), (child) => {
          element.insertBefore(child, index);
        });
      }
    },

    wrap(element, wrapNode) {
      jqLiteWrapNode(element, jqLite(wrapNode).eq(0).clone()[0]);
    },

    remove: jqLiteRemove,

    detach(element) {
      jqLiteRemove(element, true);
    },

    after(element, newElement) {
      let index = element;
      const parent = element.parentNode;

      if (parent) {
        newElement = new JQLite(newElement);

        for (let i = 0, ii = newElement.length; i < ii; i++) {
          const node = newElement[i];
          parent.insertBefore(node, index.nextSibling);
          index = node;
        }
      }
    },

    addClass: jqLiteAddClass,
    removeClass: jqLiteRemoveClass,

    toggleClass(element, selector, condition) {
      if (selector) {
        forEach(selector.split(" "), (className) => {
          let classCondition = condition;
          if (isUndefined(classCondition)) {
            classCondition = !jqLiteHasClass(element, className);
          }
          (classCondition ? jqLiteAddClass : jqLiteRemoveClass)(
            element,
            className,
          );
        });
      }
    },

    parent(element) {
      const parent = element.parentNode;
      return parent && parent.nodeType !== NODE_TYPE_DOCUMENT_FRAGMENT
        ? parent
        : null;
    },

    next(element) {
      return element.nextElementSibling;
    },

    find(element, selector) {
      if (element.getElementsByTagName) {
        return element.getElementsByTagName(selector);
      }
      return [];
    },

    triggerHandler(element, event, extraParameters) {
      let dummyEvent;
      let eventFnsCopy;
      let handlerArgs;
      const eventName = event.type || event;
      const expandoStore = jqLiteExpandoStore(element);
      const events = expandoStore && expandoStore.events;
      const eventFns = events && events[eventName];

      if (eventFns) {
        // Create a dummy event to pass to the handlers
        dummyEvent = {
          preventDefault() {
            this.defaultPrevented = true;
          },
          isDefaultPrevented() {
            return this.defaultPrevented === true;
          },
          stopImmediatePropagation() {
            this.immediatePropagationStopped = true;
          },
          isImmediatePropagationStopped() {
            return this.immediatePropagationStopped === true;
          },
          stopPropagation: () => {},
          type: eventName,
          target: element,
        };

        // If a custom event was provided then extend our dummy event with it
        if (event.type) {
          dummyEvent = extend(dummyEvent, event);
        }

        // Copy event handlers in case event handlers array is modified during execution.
        eventFnsCopy = shallowCopy(eventFns);
        handlerArgs = extraParameters
          ? [dummyEvent].concat(extraParameters)
          : [dummyEvent];

        forEach(eventFnsCopy, (fn) => {
          if (!dummyEvent.isImmediatePropagationStopped()) {
            fn.apply(element, handlerArgs);
          }
        });
      }
    },
  },
  (fn, name) => {
    /**
     * chaining functions
     */
    JQLite.prototype[name] = function (arg1, arg2, arg3) {
      let value;

      for (let i = 0, ii = this.length; i < ii; i++) {
        if (isUndefined(value)) {
          value = fn(this[i], arg1, arg2, arg3);
          if (isDefined(value)) {
            // any function which returns a value needs to be wrapped
            value = jqLite(value);
          }
        } else {
          jqLiteAddNodes(value, fn(this[i], arg1, arg2, arg3));
        }
      }
      return isDefined(value) ? value : this;
    };
  },
);

// bind legacy bind/unbind to on/off
JQLite.prototype.bind = JQLite.prototype.on;
JQLite.prototype.unbind = JQLite.prototype.off;

// Provider for private $$jqLite service
export function $$jqLiteProvider() {
  this.$get = function $$jqLite() {
    return extend(JQLite, {
      hasClass(node, classes) {
        if (node.attr) node = node[0];
        return jqLiteHasClass(node, classes);
      },
      addClass(node, classes) {
        if (node.attr) node = node[0];
        return jqLiteAddClass(node, classes);
      },
      removeClass(node, classes) {
        if (node.attr) node = node[0];
        return jqLiteRemoveClass(node, classes);
      },
    });
  };
}
