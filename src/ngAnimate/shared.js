const ELEMENT_NODE = 1;
const COMMENT_NODE = 8;

const ADD_CLASS_SUFFIX = "-add";
const REMOVE_CLASS_SUFFIX = "-remove";
const EVENT_CLASS_PREFIX = "ng-";
const ACTIVE_CLASS_SUFFIX = "-active";
const PREPARE_CLASS_SUFFIX = "-prepare";

const NG_ANIMATE_CLASSNAME = "ng-animate";
const NG_ANIMATE_CHILDREN_DATA = "$$ngAnimateChildren";

// Detect proper transitionend/animationend event names.
let CSS_PREFIX = "";
let TRANSITION_PROP;
let TRANSITIONEND_EVENT;
let ANIMATION_PROP;
let ANIMATIONEND_EVENT;

// If unprefixed events are not supported but webkit-prefixed are, use the latter.
// Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
// Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
// but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
// Register both events in case `window.onanimationend` is not supported because of that,
// do the same for `transitionend` as Safari is likely to exhibit similar behavior.
// Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
// therefore there is no reason to test anymore for other vendor prefixes:
// http://caniuse.com/#search=transition
if (
  window.ontransitionend === undefined &&
  window.onwebkittransitionend !== undefined
) {
  CSS_PREFIX = "-webkit-";
  TRANSITION_PROP = "WebkitTransition";
  TRANSITIONEND_EVENT = "webkitTransitionEnd transitionend";
} else {
  TRANSITION_PROP = "transition";
  TRANSITIONEND_EVENT = "transitionend";
}

if (
  window.onanimationend === undefined &&
  window.onwebkitanimationend !== undefined
) {
  CSS_PREFIX = "-webkit-";
  ANIMATION_PROP = "WebkitAnimation";
  ANIMATIONEND_EVENT = "webkitAnimationEnd animationend";
} else {
  ANIMATION_PROP = "animation";
  ANIMATIONEND_EVENT = "animationend";
}

const DURATION_KEY = "Duration";
const PROPERTY_KEY = "Property";
const DELAY_KEY = "Delay";
const TIMING_KEY = "TimingFunction";
const ANIMATION_ITERATION_COUNT_KEY = "IterationCount";
const ANIMATION_PLAYSTATE_KEY = "PlayState";
const SAFE_FAST_FORWARD_DURATION_VALUE = 9999;

const ANIMATION_DELAY_PROP = ANIMATION_PROP + DELAY_KEY;
const ANIMATION_DURATION_PROP = ANIMATION_PROP + DURATION_KEY;
const TRANSITION_DELAY_PROP = TRANSITION_PROP + DELAY_KEY;
const TRANSITION_DURATION_PROP = TRANSITION_PROP + DURATION_KEY;

const ngMinErr = angular.$$minErr("ng");
function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr(
      "areq",
      "Argument '{0}' is {1}",
      name || "?",
      reason || "required",
    );
  }
  return arg;
}

function mergeClasses(a, b) {
  if (!a && !b) return "";
  if (!a) return b;
  if (!b) return a;
  if (isArray(a)) a = a.join(" ");
  if (isArray(b)) b = b.join(" ");
  return `${a} ${b}`;
}

function packageStyles(options) {
  const styles = {};
  if (options && (options.to || options.from)) {
    styles.to = options.to;
    styles.from = options.from;
  }
  return styles;
}

function pendClasses(classes, fix, isPrefix) {
  let className = "";
  classes = isArray(classes)
    ? classes
    : classes && isString(classes) && classes.length
      ? classes.split(/\s+/)
      : [];
  forEach(classes, (klass, i) => {
    if (klass && klass.length > 0) {
      className += i > 0 ? " " : "";
      className += isPrefix ? fix + klass : klass + fix;
    }
  });
  return className;
}

function removeFromArray(arr, val) {
  const index = arr.indexOf(val);
  if (val >= 0) {
    arr.splice(index, 1);
  }
}

function stripCommentsFromElement(element) {
  if (element instanceof jqLite) {
    switch (element.length) {
      case 0:
        return element;

      case 1:
        // there is no point of stripping anything if the element
        // is the only element within the jqLite wrapper.
        // (it's important that we retain the element instance.)
        if (element[0].nodeType === ELEMENT_NODE) {
          return element;
        }
        break;

      default:
        return jqLite(extractElementNode(element));
    }
  }

  if (element.nodeType === ELEMENT_NODE) {
    return jqLite(element);
  }
}

function extractElementNode(element) {
  if (!element[0]) return element;
  for (let i = 0; i < element.length; i++) {
    const elm = element[i];
    if (elm.nodeType === ELEMENT_NODE) {
      return elm;
    }
  }
}

function $$addClass($$jqLite, element, className) {
  forEach(element, (elm) => {
    $$jqLite.addClass(elm, className);
  });
}

function $$removeClass($$jqLite, element, className) {
  forEach(element, (elm) => {
    $$jqLite.removeClass(elm, className);
  });
}

function applyAnimationClassesFactory($$jqLite) {
  return function (element, options) {
    if (options.addClass) {
      $$addClass($$jqLite, element, options.addClass);
      options.addClass = null;
    }
    if (options.removeClass) {
      $$removeClass($$jqLite, element, options.removeClass);
      options.removeClass = null;
    }
  };
}

function prepareAnimationOptions(options) {
  options = options || {};
  if (!options.$$prepared) {
    let domOperation = options.domOperation || noop;
    options.domOperation = function () {
      options.$$domOperationFired = true;
      domOperation();
      domOperation = noop;
    };
    options.$$prepared = true;
  }
  return options;
}

function applyAnimationStyles(element, options) {
  applyAnimationFromStyles(element, options);
  applyAnimationToStyles(element, options);
}

function applyAnimationFromStyles(element, options) {
  if (options.from) {
    element.css(options.from);
    options.from = null;
  }
}

function applyAnimationToStyles(element, options) {
  if (options.to) {
    element.css(options.to);
    options.to = null;
  }
}

function mergeAnimationDetails(element, oldAnimation, newAnimation) {
  const target = oldAnimation.options || {};
  const newOptions = newAnimation.options || {};

  const toAdd = `${target.addClass || ""} ${newOptions.addClass || ""}`;
  const toRemove = `${target.removeClass || ""} ${newOptions.removeClass || ""}`;
  const classes = resolveElementClasses(element.attr("class"), toAdd, toRemove);

  if (newOptions.preparationClasses) {
    target.preparationClasses = concatWithSpace(
      newOptions.preparationClasses,
      target.preparationClasses,
    );
    delete newOptions.preparationClasses;
  }

  // noop is basically when there is no callback; otherwise something has been set
  const realDomOperation =
    target.domOperation !== noop ? target.domOperation : null;

  extend(target, newOptions);

  // TODO(matsko or sreeramu): proper fix is to maintain all animation callback in array and call at last,but now only leave has the callback so no issue with this.
  if (realDomOperation) {
    target.domOperation = realDomOperation;
  }

  if (classes.addClass) {
    target.addClass = classes.addClass;
  } else {
    target.addClass = null;
  }

  if (classes.removeClass) {
    target.removeClass = classes.removeClass;
  } else {
    target.removeClass = null;
  }

  oldAnimation.addClass = target.addClass;
  oldAnimation.removeClass = target.removeClass;

  return target;
}

function resolveElementClasses(existing, toAdd, toRemove) {
  const ADD_CLASS = 1;
  const REMOVE_CLASS = -1;

  const flags = {};
  existing = splitClassesToLookup(existing);

  toAdd = splitClassesToLookup(toAdd);
  forEach(toAdd, (value, key) => {
    flags[key] = ADD_CLASS;
  });

  toRemove = splitClassesToLookup(toRemove);
  forEach(toRemove, (value, key) => {
    flags[key] = flags[key] === ADD_CLASS ? null : REMOVE_CLASS;
  });

  const classes = {
    addClass: "",
    removeClass: "",
  };

  forEach(flags, (val, klass) => {
    let prop;
    let allow;
    if (val === ADD_CLASS) {
      prop = "addClass";
      allow = !existing[klass] || existing[klass + REMOVE_CLASS_SUFFIX];
    } else if (val === REMOVE_CLASS) {
      prop = "removeClass";
      allow = existing[klass] || existing[klass + ADD_CLASS_SUFFIX];
    }
    if (allow) {
      if (classes[prop].length) {
        classes[prop] += " ";
      }
      classes[prop] += klass;
    }
  });

  function splitClassesToLookup(classes) {
    if (isString(classes)) {
      classes = classes.split(" ");
    }

    const obj = {};
    forEach(classes, (klass) => {
      // sometimes the split leaves empty string values
      // incase extra spaces were applied to the options
      if (klass.length) {
        obj[klass] = true;
      }
    });
    return obj;
  }

  return classes;
}

function getDomNode(element) {
  return element instanceof jqLite ? element[0] : element;
}

function applyGeneratedPreparationClasses($$jqLite, element, event, options) {
  let classes = "";
  if (event) {
    classes = pendClasses(event, EVENT_CLASS_PREFIX, true);
  }
  if (options.addClass) {
    classes = concatWithSpace(
      classes,
      pendClasses(options.addClass, ADD_CLASS_SUFFIX),
    );
  }
  if (options.removeClass) {
    classes = concatWithSpace(
      classes,
      pendClasses(options.removeClass, REMOVE_CLASS_SUFFIX),
    );
  }
  if (classes.length) {
    options.preparationClasses = classes;
    element.addClass(classes);
  }
}

function clearGeneratedClasses(element, options) {
  if (options.preparationClasses) {
    element.removeClass(options.preparationClasses);
    options.preparationClasses = null;
  }
  if (options.activeClasses) {
    element.removeClass(options.activeClasses);
    options.activeClasses = null;
  }
}

function blockKeyframeAnimations(node, applyBlock) {
  const value = applyBlock ? "paused" : "";
  const key = ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY;
  applyInlineStyle(node, [key, value]);
  return [key, value];
}

function applyInlineStyle(node, styleTuple) {
  const prop = styleTuple[0];
  const value = styleTuple[1];
  node.style[prop] = value;
}

function concatWithSpace(a, b) {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

const helpers = {
  blockTransitions(node, duration) {
    // we use a negative delay value since it performs blocking
    // yet it doesn't kill any existing transitions running on the
    // same element which makes this safe for class-based animations
    const value = duration ? `-${duration}s` : "";
    applyInlineStyle(node, [TRANSITION_DELAY_PROP, value]);
    return [TRANSITION_DELAY_PROP, value];
  },
};
