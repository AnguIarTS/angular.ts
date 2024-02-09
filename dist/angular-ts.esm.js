const NODE_TYPE_TEXT = 3;

/**
 *
 * @description Converts the specified string to lowercase.
 * @param {string} string String to be converted to lowercase.
 * @returns {string} Lowercased string.
 */
function lowercase(string) {
  return isString$1(string) ? string.toLowerCase() : string;
}

/**
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
function isArrayLike(obj) {
  // `null`, `undefined` and `window` are not array-like
  if (obj == null || isWindow(obj)) return false;

  // arrays, strings and jQuery/jqLite objects are array like
  // * we have to check the existence of jqLite first as this method is called
  //   via the forEach method when constructing the jqLite object in the first place
  if (isArray$1(obj) || isString$1(obj)) return true;

  // Support: iOS 8.2 (not reproducible in simulator)
  // "length" in obj used to prevent JIT error (gh-11508)
  const length = "length" in Object(obj) && obj.length;

  // NodeList objects (with `item` method) and
  // other objects with suitable length characteristics are array-like
  return (
    isNumber(length) &&
    ((length >= 0 && length - 1 in obj) || typeof obj.item === "function")
  );
}

/**
 * @module angular
 * @function isUndefined
 *
 * @description
 * Determines if a reference is undefined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is undefined.
 */
function isUndefined$1(value) {
  return typeof value === "undefined";
}

/**
 * @module angular
 * @function isObject
 *
 * @description
 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
 * considered to be objects. Note that JavaScript arrays are objects.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Object` but not `null`.
 */
function isObject$1(value) {
  // http://jsperf.com/isobject4
  return value !== null && typeof value === "object";
}

/**
 * Determine if a value is an object with a null prototype
 *
 * @returns {boolean} True if `value` is an `Object` with a null prototype
 */
function isBlankObject(value) {
  return (
    value !== null && typeof value === "object" && !Object.getPrototypeOf(value)
  );
}

/**
 * @module angular
 * @function isString
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString$1(value) {
  return typeof value === "string";
}

/**
 * @module angular
 * @function isNumber
 *
 * @description
 * Determines if a reference is a `Number`.
 *
 * This includes the "special" numbers `NaN`, `+Infinity` and `-Infinity`.
 *
 * If you wish to exclude these then you can use the native
 * [`isFinite'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite)
 * method.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
function isNumber(value) {
  return typeof value === "number";
}

/**
 * @module angular
 * @function isDate
 *
 * @description
 * Determines if a value is a date.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Date`.
 */
function isDate(value) {
  return toString.call(value) === "[object Date]";
}

/**
 * @module angular
 * @function isArray
 * @function
 *
 * @description
 * Determines if a reference is an `Array`.
 *
 * @param {*} arr Reference to check.
 * @returns {boolean} True if `value` is an `Array`.
 */
function isArray$1(arr) {
  return Array.isArray(arr) || arr instanceof Array;
}

/**
 * @module angular
 * @function isFunction

 * @function
 *
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
function isFunction$1(value) {
  return typeof value === "function";
}

/**
 * Determines if a value is a regular expression object.
 *
 * @private
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `RegExp`.
 */
function isRegExp(value) {
  return toString.call(value) === "[object RegExp]";
}

/**
 * Checks if `obj` is a window object.
 *
 * @private
 * @param {*} obj Object to check
 * @returns {boolean} True if `obj` is a window obj.
 */
function isWindow(obj) {
  return obj && obj.window === obj;
}

/**
 * @param {*} obj
 * @returns {boolean}
 */
function isScope(obj) {
  return obj && obj.$evalAsync && obj.$watch;
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isTypedArray(value) {
  return (
    value &&
    isNumber(value.length) &&
    /^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array]$/.test(
      toString.call(value),
    )
  );
}

/**
 * @param {*} obj
 * @returns {boolean}
 */
function isArrayBuffer(obj) {
  return toString.call(obj) === "[object ArrayBuffer]";
}

/**
 * @module angular
 * @function forEach
 *
 * @description
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
 * object or an array. The `iterator` function is invoked with `iterator(value, key, obj)`, where `value`
 * is the value of an object property or an array element, `key` is the object property key or
 * array element index and obj is the `obj` itself. Specifying a `context` for the function is optional.
 *
 * It is worth noting that `.forEach` does not iterate over inherited properties because it filters
 * using the `hasOwnProperty` method.
 *
 * Unlike ES262's
 * [Array.prototype.forEach](http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.18),
 * providing 'undefined' or 'null' values for `obj` will not throw a TypeError, but rather just
 * return the value provided.
 *
   ```js
     let values = {name: 'misko', gender: 'male'};
     let log = [];
     angular.forEach(values, function(value, key) {
       this.push(key + ': ' + value);
     }, log);
     expect(log).toEqual(['name: misko', 'gender: male']);
   ```
 *
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */
function forEach$1(obj, iterator, context) {
  let key, length;
  if (obj) {
    if (isFunction$1(obj)) {
      for (key in obj) {
        if (
          key !== "prototype" &&
          key !== "length" &&
          key !== "name" &&
          obj.hasOwnProperty(key)
        ) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (isArray$1(obj) || isArrayLike(obj)) {
      let isPrimitive = typeof obj !== "object";
      for (key = 0, length = obj.length; key < length; key++) {
        if (isPrimitive || key in obj) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach$1) {
      obj.forEach(iterator, context, obj);
    } else if (isBlankObject(obj)) {
      // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
      for (key in obj) {
        iterator.call(context, obj[key], key, obj);
      }
    } else if (typeof obj.hasOwnProperty === "function") {
      // Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    }
  }
  return obj;
}

/**
 * Set or clear the hashkey for an object.
 * @param obj object
 * @param h the hashkey (!truthy to delete the hashkey)
 */
function setHashKey(obj, h) {
  if (h) {
    obj.$$hashKey = h;
  } else {
    delete obj.$$hashKey;
  }
}

function baseExtend(dst, objs, deep) {
  let h = dst.$$hashKey;

  for (let i = 0, ii = objs.length; i < ii; ++i) {
    let obj = objs[i];
    if (!isObject$1(obj) && !isFunction$1(obj)) continue;
    let keys = Object.keys(obj);
    for (let j = 0, jj = keys.length; j < jj; j++) {
      let key = keys[j];
      let src = obj[key];

      if (deep && isObject$1(src)) {
        if (isDate(src)) {
          dst[key] = new Date(src.valueOf());
        } else if (isRegExp(src)) {
          dst[key] = new RegExp(src);
        } else if (src.nodeName) {
          dst[key] = src.cloneNode(true);
        } else if (isElement(src)) {
          dst[key] = src.clone();
        } else {
          if (key !== "__proto__") {
            if (!isObject$1(dst[key])) dst[key] = isArray$1(src) ? [] : {};
            baseExtend(dst[key], [src], true);
          }
        }
      } else {
        dst[key] = src;
      }
    }
  }

  setHashKey(dst, h);
  return dst;
}

/**
 * @module angular
 * @function extend

 * @function
 *
 * @description
 * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
 * by passing an empty object as the target: `let object = angular.extend({}, object1, object2)`.
 *
 * **Note:** Keep in mind that `angular.extend` does not support recursive merge (deep copy). Use
 * {@link angular.merge} for this.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @returns {Object} Reference to `dst`.
 */
function extend(dst) {
  return baseExtend(dst, Array.prototype.slice.call(arguments, 1), false);
}

/**
 * @module angular
 * @function isElement

 * @function
 *
 * @description
 * Determines if a reference is a DOM element (or wrapped jQuery element).
 *
 * @param {*} node Reference to check.
 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
 */
function isElement(node) {
  return !!(
    node &&
    (node.nodeName || // We are a direct element.
      (node.prop && node.attr && node.find))
  ); // We have an on and find method part of jQuery API.
}

/**
 * @module angular
 * @function copy

 * @function
 *
 * @description
 * Creates a deep copy of `source`, which should be an object or an array. This functions is used
 * internally, mostly in the change-detection code. It is not intended as an all-purpose copy
 * function, and has several limitations (see below).
 *
 * * If no destination is supplied, a copy of the object or array is created.
 * * If a destination is provided, all of its elements (for arrays) or properties (for objects)
 *   are deleted and then all elements/properties from the source are copied to it.
 * * If `source` is not an object or array (inc. `null` and `undefined`), `source` is returned.
 * * If `source` is identical to `destination` an exception will be thrown.
 *
 * <br />
 *
 * <div class="alert alert-warning">
 *   Only enumerable properties are taken into account. Non-enumerable properties (both on `source`
 *   and on `destination`) will be ignored.
 * </div>
 *
 * <div class="alert alert-warning">
 *   `angular.copy` does not check if destination and source are of the same type. It's the
 *   developer's responsibility to make sure they are compatible.
 * </div>
 *
 * @knownIssue
 * This is a non-exhaustive list of object types / features that are not handled correctly by
 * `angular.copy`. Note that since this functions is used by the change detection code, this
 * means binding or watching objects of these types (or that include these types) might not work
 * correctly.
 * - [`File`](https://developer.mozilla.org/docs/Web/API/File)
 * - [`Map`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Map)
 * - [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData)
 * - [`MediaStream`](https://developer.mozilla.org/docs/Web/API/MediaStream)
 * - [`Set`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)
 * - [`WeakMap`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
 * - [`getter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)/
 *   [`setter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set)
 *
 * @param {*} source The source that will be used to make a copy. Can be any type, including
 *     primitives, `null`, and `undefined`.
 * @param {(Object|Array)=} destination Destination into which the source is copied. If provided,
 *     must be of the same type as `source`.
 * @returns {*} The copy or updated `destination`, if `destination` was specified.
 *
 * @example
  <example module="copyExample" name="angular-copy">
    <file name="index.html">
      <div ng-controller="ExampleController">
        <form novalidate class="simple-form">
          <label>Name: <input type="text" ng-model="user.name" /></label><br />
          <label>Age:  <input type="number" ng-model="user.age" /></label><br />
          Gender: <label><input type="radio" ng-model="user.gender" value="male" />male</label>
                  <label><input type="radio" ng-model="user.gender" value="female" />female</label><br />
          <button ng-click="reset()">RESET</button>
          <button ng-click="update(user)">SAVE</button>
        </form>
        <pre>form = {{user | json}}</pre>
        <pre>leader = {{leader | json}}</pre>
      </div>
    </file>
    <file name="script.js">
      // Module: copyExample
      angular.
        module('copyExample', []).
        controller('ExampleController', ['$scope', function($scope) {
          $scope.leader = {};

          $scope.reset = function() {
            // Example with 1 argument
            $scope.user = angular.copy($scope.leader);
          };

          $scope.update = function(user) {
            // Example with 2 arguments
            angular.copy(user, $scope.leader);
          };

          $scope.reset();
        }]);
    </file>
  </example>
 */
function copy(source, destination, maxDepth) {
  let stackSource = [];
  let stackDest = [];
  maxDepth = isValidObjectMaxDepth(maxDepth) ? maxDepth : NaN;

  if (destination) {
    if (isTypedArray(destination) || isArrayBuffer(destination)) {
      throw ngMinErr$1();
    }
    if (source === destination) {
      throw ngMinErr$1();
    }

    // Empty the destination object
    if (isArray$1(destination)) {
      destination.length = 0;
    } else {
      forEach$1(destination, function (value, key) {
        if (key !== "$$hashKey") {
          delete destination[key];
        }
      });
    }

    stackSource.push(source);
    stackDest.push(destination);
    return copyRecurse(source, destination, maxDepth);
  }

  return copyElement(source, maxDepth);

  function copyRecurse(source, destination, maxDepth) {
    maxDepth--;
    if (maxDepth < 0) {
      return "...";
    }
    let h = destination.$$hashKey;
    let key;
    if (isArray$1(source)) {
      for (let i = 0, ii = source.length; i < ii; i++) {
        destination.push(copyElement(source[i], maxDepth));
      }
    } else if (isBlankObject(source)) {
      // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
      for (key in source) {
        destination[key] = copyElement(source[key], maxDepth);
      }
    } else if (source && typeof source.hasOwnProperty === "function") {
      // Slow path, which must rely on hasOwnProperty
      for (key in source) {
        if (source.hasOwnProperty(key)) {
          destination[key] = copyElement(source[key], maxDepth);
        }
      }
    }
    setHashKey(destination, h);
    return destination;
  }

  function copyElement(source, maxDepth) {
    // Simple values
    if (!isObject$1(source)) {
      return source;
    }

    // Already copied values
    let index = stackSource.indexOf(source);
    if (index !== -1) {
      return stackDest[index];
    }

    if (isWindow(source) || isScope(source)) {
      throw ngMinErr$1();
    }

    let needsRecurse = false;
    let destination = copyType(source);

    if (destination === undefined) {
      destination = isArray$1(source)
        ? []
        : Object.create(Object.getPrototypeOf(source));
      needsRecurse = true;
    }

    stackSource.push(source);
    stackDest.push(destination);

    return needsRecurse
      ? copyRecurse(source, destination, maxDepth)
      : destination;
  }

  function copyType(source) {
    switch (toString.call(source)) {
      case "[object Int8Array]":
      case "[object Int16Array]":
      case "[object Int32Array]":
      case "[object Float32Array]":
      case "[object Float64Array]":
      case "[object Uint8Array]":
      case "[object Uint8ClampedArray]":
      case "[object Uint16Array]":
      case "[object Uint32Array]":
        return new source.constructor(
          copyElement(source.buffer),
          source.byteOffset,
          source.length,
        );

      case "[object ArrayBuffer]":
        // Support: IE10
        if (!source.slice) {
          // If we're in this case we know the environment supports ArrayBuffer
          /* eslint-disable no-undef */
          let copied = new ArrayBuffer(source.byteLength);
          new Uint8Array(copied).set(new Uint8Array(source));
          /* eslint-enable */
          return copied;
        }
        return source.slice(0);

      case "[object Boolean]":
      case "[object Number]":
      case "[object String]":
      case "[object Date]":
        return new source.constructor(source.valueOf());

      case "[object RegExp]":
        let re = new RegExp(
          source.source,
          source.toString().match(/[^/]*$/)[0],
        );
        re.lastIndex = source.lastIndex;
        return re;

      case "[object Blob]":
        return new source.constructor([source], { type: source.type });
    }

    if (isFunction$1(source.cloneNode)) {
      return source.cloneNode(true);
    }
  }
}

/**
 * @param {Number} maxDepth
 * @return {boolean}
 */
function isValidObjectMaxDepth(maxDepth) {
  return isNumber(maxDepth) && maxDepth > 0;
}

function sliceArgs(args, startIndex) {
  return Array.prototype.slice.call(args, startIndex || 0);
}

function toJsonReplacer(key, value) {
  let val = value;

  if (
    typeof key === "string" &&
    key.charAt(0) === "$" &&
    key.charAt(1) === "$"
  ) {
    val = undefined;
  } else if (isWindow(value)) {
    val = "$WINDOW";
  } else if (value && window.document === value) {
    val = "$DOCUMENT";
  } else if (isScope(value)) {
    val = "$SCOPE";
  }

  return val;
}

/**
 * @returns {string} Returns the string representation of the element.
 */
function startingTag(element) {
  const clonedElement = element.cloneNode(true);
  while (clonedElement.firstChild) {
    clonedElement.removeChild(clonedElement.firstChild);
  }
  const tempDiv = document.createElement('div');
  
  // Append the cloned element to the temp div and get its HTML
  tempDiv.appendChild(clonedElement);
  let elemHtml = tempDiv.innerHTML;
  try {
    return element[0].nodeType === NODE_TYPE_TEXT
      ? lowercase(elemHtml)
      : elemHtml
          .match(/^(<[^>]+>)/)[1]
          .replace(/^<([\w-]+)/, function (match, nodeName) {
            return "<" + lowercase(nodeName);
          });
  } catch (e) {
    return lowercase(elemHtml);
  }
}

const ngAttrPrefixes = ["ng-", "data-ng-", "ng:", "x-ng-"];

function getNgAttribute(element, ngAttr) {
  let attr,
    i,
    ii = ngAttrPrefixes.length;
  for (i = 0; i < ii; ++i) {
    attr = ngAttrPrefixes[i] + ngAttr;
    if (isString$1((attr = element.getAttribute(attr)))) {
      return attr;
    }
  }
  return null;
}

function ngMinErr$1(arg0, arg1) {
  throw new Error("Function not implemented.");
}

function serializeObject(obj, maxDepth) {
  let seen = [];

  // There is no direct way to stringify object until reaching a specific depth
  // and a very deep object can cause a performance issue, so we copy the object
  // based on this specific depth and then stringify it.
  if (isValidObjectMaxDepth(maxDepth)) {
    // This file is also included in `angular-loader`, so `copy()` might not always be available in
    // the closure. Therefore, it is lazily retrieved as `angular.copy()` when needed.
    obj = copy(obj, null, maxDepth);
  }
  return JSON.stringify(obj, function (key, val) {
    val = toJsonReplacer(key, val);
    if (isObject$1(val)) {
      if (seen.indexOf(val) >= 0) return "...";

      seen.push(val);
    }
    return val;
  });
}

function toDebugString(obj, maxDepth) {
  if (typeof obj === "function") {
    return obj.toString().replace(/ \{[\s\S]*$/, "");
  } else if (isUndefined$1(obj)) {
    return "undefined";
  } else if (typeof obj !== "string") {
    return serializeObject(obj, maxDepth);
  }
  return obj;
}

/* exported
  minErrConfig,
  errorHandlingConfig,
  isValidObjectMaxDepth
*/


const minErrConfig = {
  objectMaxDepth: 5,
  urlErrorParamsEnabled: true,
};

/**
 * @description
 *
 * This object provides a utility for producing rich Error messages within
 * AngularJS. It can be called as follows:
 *
 * let exampleMinErr = minErr('example');
 * throw exampleMinErr('one', 'This {0} is {1}', foo, bar);
 *
 * The above creates an instance of minErr in the example namespace. The
 * resulting error will have a namespaced error code of example.one.  The
 * resulting error will replace {0} with the value of foo, and {1} with the
 * value of bar. The object is not restricted in the number of arguments it can
 * take.
 *
 * If fewer arguments are specified than necessary for interpolation, the extra
 * interpolation markers will be preserved in the final string.
 *
 * Since data will be parsed statically during a build step, some restrictions
 * are applied with respect to how minErr instances are created and called.
 * Instances should have names of the form namespaceMinErr for a minErr created
 * using minErr('namespace'). Error codes, namespaces and template strings
 * should all be static strings, not variables or general expressions.
 *
 * @param {string} module The namespace to use for the new minErr instance.
 * @returns {function(string, string, ...*): Error} minErr instance
 */

function minErr$1(module) {

  let url = 'https://errors.angularjs.org/"NG_VERSION_FULL"/';
  let regex = url.replace(".", "\\.") + "[\\s\\S]*";
  let errRegExp = new RegExp(regex, "g");

  return function () {
    let code = arguments[0],
      template = arguments[1],
      message = "[" + (module ? module + ":" : "") + code + "] ",
      templateArgs = sliceArgs(arguments, 2).map(function (arg) {
        return toDebugString(arg, minErrConfig.objectMaxDepth);
      }),
      paramPrefix,
      i;

    // A minErr message has two parts: the message itself and the url that contains the
    // encoded message.
    // The message's parameters can contain other error messages which also include error urls.
    // To prevent the messages from getting too long, we strip the error urls from the parameters.

    message += template.replace(/\{\d+\}/g, function (match) {
      let index = +match.slice(1, -1);

      if (index < templateArgs.length) {
        return templateArgs[index].replace(errRegExp, "");
      }

      return match;
    });

    message += "\n" + url + (module ? module + "/" : "") + code;

    {
      for (
        i = 0, paramPrefix = "?";
        i < templateArgs.length;
        i++, paramPrefix = "&"
      ) {
        message +=
          paramPrefix + "p" + i + "=" + encodeURIComponent(templateArgs[i]);
      }
    }

    return Error(message);
  };
}

/**
 * @ngdoc function
 * @module ng
 * @name angular.injector
 * @kind function
 *
 * @description
 * Creates an injector object that can be used for retrieving services as well as for
 * dependency injection (see {@link guide/di dependency injection}).
 *
 * @param {Array.<string|Function>} modules A list of module functions or their aliases. See
 *     {@link angular.module}. The `ng` module must be explicitly added.
 * @param {boolean=} [strictDi=false] Whether the injector should be in strict mode, which
 *     disallows argument name annotation inference.
 * @returns {injector} Injector object. See {@link auto.$injector $injector}.
 *
 * @example
 * Typical usage
 * ```js
 *   // create an injector
 *   let $injector = angular.injector(['ng']);
 *
 *   // use the injector to kick off your application
 *   // use the type inference to auto inject arguments, or use implicit injection
 *   $injector.invoke(function($rootScope, $compile, $document) {
 *     $compile($document)($rootScope);
 *     $rootScope.$digest();
 *   });
 * ```
 *
 * Sometimes you want to get access to the injector of a currently running AngularJS app
 * from outside AngularJS. Perhaps, you want to inject and compile some markup after the
 * application has been bootstrapped. You can do this using the extra `injector()` added
 * to JQuery/jqLite elements. See {@link angular.element}.
 *
 * *This is fairly rare but could be the case if a third party library is injecting the
 * markup.*
 *
 * In the following example a new block of HTML containing a `ng-controller`
 * directive is added to the end of the document body by JQuery. We then compile and link
 * it into the current AngularJS scope.
 *
 * ```js
 * let $div = $('<div ng-controller="MyCtrl">{{content.label}}</div>');
 * $(document.body).append($div);
 *
 * angular.element(document).injector().invoke(function($compile) {
 *   let scope = angular.element($div).scope();
 *   $compile($div)(scope);
 * });
 * ```
 */

/**
 * @ngdoc module
 * @name auto
 * @installation
 * @description
 *
 * Implicit module which gets automatically added to each {@link auto.$injector $injector}.
 */

let ARROW_ARG = /^([^(]+?)=>/;
let FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
let FN_ARG_SPLIT = /,/;
let FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
let $injectorMinErr = minErr("$injector");

function stringifyFn(fn) {
  return Function.prototype.toString.call(fn);
}

function extractArgs(fn) {
  let fnText = stringifyFn(fn).replace(STRIP_COMMENTS, ""),
    args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
  return args;
}

function anonFn(fn) {
  // For anonymous functions, showing at the very least the function signature can help in
  // debugging.
  let args = extractArgs(fn);
  if (args) {
    return "function(" + (args[1] || "").replace(/[\s\r\n]+/, " ") + ")";
  }
  return "fn";
}

function annotate(fn, strictDi, name) {
  let $inject, argDecl, last;

  if (typeof fn === "function") {
    if (!($inject = fn.$inject)) {
      $inject = [];
      if (fn.length) {
        if (strictDi) {
          if (!isString(name) || !name) {
            name = fn.name || anonFn(fn);
          }
          throw $injectorMinErr(
            "strictdi",
            "{0} is not using explicit annotation and cannot be invoked in strict mode",
            name,
          );
        }
        argDecl = extractArgs(fn);
        forEach(argDecl[1].split(FN_ARG_SPLIT), function (arg) {
          arg.replace(FN_ARG, function (all, underscore, name) {
            $inject.push(name);
          });
        });
      }
      fn.$inject = $inject;
    }
  } else if (isArray(fn)) {
    last = fn.length - 1;
    assertArgFn(fn[last], "fn");
    $inject = fn.slice(0, last);
  } else {
    assertArgFn(fn, "fn", true);
  }
  return $inject;
}

///////////////////////////////////////

/**
 * @ngdoc service
 * @name $injector
 *
 * @description
 *
 * `$injector` is used to retrieve object instances as defined by
 * {@link auto.$provide provider}, instantiate types, invoke methods,
 * and load modules.
 *
 * The following always holds true:
 *
 * ```js
 *   let $injector = angular.injector();
 *   expect($injector.get('$injector')).toBe($injector);
 *   expect($injector.invoke(function($injector) {
 *     return $injector;
 *   })).toBe($injector);
 * ```
 *
 * ## Injection Function Annotation
 *
 * JavaScript does not have annotations, and annotations are needed for dependency injection. The
 * following are all valid ways of annotating function with injection arguments and are equivalent.
 *
 * ```js
 *   // inferred (only works if code not minified/obfuscated)
 *   $injector.invoke(function(serviceA){});
 *
 *   // annotated
 *   function explicit(serviceA) {};
 *   explicit.$inject = ['serviceA'];
 *   $injector.invoke(explicit);
 *
 *   // inline
 *   $injector.invoke(['serviceA', function(serviceA){}]);
 * ```
 *
 * ### Inference
 *
 * In JavaScript calling `toString()` on a function returns the function definition. The definition
 * can then be parsed and the function arguments can be extracted. This method of discovering
 * annotations is disallowed when the injector is in strict mode.
 * *NOTE:* This does not work with minification, and obfuscation tools since these tools change the
 * argument names.
 *
 * ### `$inject` Annotation
 * By adding an `$inject` property onto a function the injection parameters can be specified.
 *
 * ### Inline
 * As an array of injection names, where the last item in the array is the function to call.
 */

/**
 * @ngdoc property
 * @name $injector#modules
 * @type {Object}
 * @description
 * A hash containing all the modules that have been loaded into the
 * $injector.
 *
 * You can use this property to find out information about a module via the
 * {@link angular.Module#info `myModule.info(...)`} method.
 *
 * For example:
 *
 * ```
 * let info = $injector.modules['ngAnimate'].info();
 * ```
 *
 * **Do not use this property to attempt to modify the modules after the application
 * has been bootstrapped.**
 */

/**
 * @ngdoc method
 * @name $injector#get
 *
 * @description
 * Return an instance of the service.
 *
 * @param {string} name The name of the instance to retrieve.
 * @param {string=} caller An optional string to provide the origin of the function call for error messages.
 * @return {*} The instance.
 */

/**
 * @ngdoc method
 * @name $injector#invoke
 *
 * @description
 * Invoke the method and supply the method arguments from the `$injector`.
 *
 * @param {Function|Array.<string|Function>} fn The injectable function to invoke. Function parameters are
 *   injected according to the {@link guide/di $inject Annotation} rules.
 * @param {Object=} self The `this` for the invoked method.
 * @param {Object=} locals Optional object. If preset then any argument names are read from this
 *                         object first, before the `$injector` is consulted.
 * @returns {*} the value returned by the invoked `fn` function.
 */

/**
 * @ngdoc method
 * @name $injector#has
 *
 * @description
 * Allows the user to query if the particular service exists.
 *
 * @param {string} name Name of the service to query.
 * @returns {boolean} `true` if injector has given service.
 */

/**
 * @ngdoc method
 * @name $injector#instantiate
 * @description
 * Create a new instance of JS type. The method takes a constructor function, invokes the new
 * operator, and supplies all of the arguments to the constructor function as specified by the
 * constructor annotation.
 *
 * @param {Function} Type Annotated constructor function.
 * @param {Object=} locals Optional object. If preset then any argument names are read from this
 * object first, before the `$injector` is consulted.
 * @returns {Object} new instance of `Type`.
 */

/**
 * @ngdoc method
 * @name $injector#annotate
 *
 * @description
 * Returns an array of service names which the function is requesting for injection. This API is
 * used by the injector to determine which services need to be injected into the function when the
 * function is invoked. There are three ways in which the function can be annotated with the needed
 * dependencies.
 *
 * #### Argument names
 *
 * The simplest form is to extract the dependencies from the arguments of the function. This is done
 * by converting the function into a string using `toString()` method and extracting the argument
 * names.
 * ```js
 *   // Given
 *   function MyController($scope, $route) {
 *     // ...
 *   }
 *
 *   // Then
 *   expect(injector.annotate(MyController)).toEqual(['$scope', '$route']);
 * ```
 *
 * You can disallow this method by using strict injection mode.
 *
 * This method does not work with code minification / obfuscation. For this reason the following
 * annotation strategies are supported.
 *
 * #### The `$inject` property
 *
 * If a function has an `$inject` property and its value is an array of strings, then the strings
 * represent names of services to be injected into the function.
 * ```js
 *   // Given
 *   let MyController = function(obfuscatedScope, obfuscatedRoute) {
 *     // ...
 *   }
 *   // Define function dependencies
 *   MyController['$inject'] = ['$scope', '$route'];
 *
 *   // Then
 *   expect(injector.annotate(MyController)).toEqual(['$scope', '$route']);
 * ```
 *
 * #### The array notation
 *
 * It is often desirable to inline Injected functions and that's when setting the `$inject` property
 * is very inconvenient. In these situations using the array notation to specify the dependencies in
 * a way that survives minification is a better choice:
 *
 * ```js
 *   // We wish to write this (not minification / obfuscation safe)
 *   injector.invoke(function($compile, $rootScope) {
 *     // ...
 *   });
 *
 *   // We are forced to write break inlining
 *   let tmpFn = function(obfuscatedCompile, obfuscatedRootScope) {
 *     // ...
 *   };
 *   tmpFn.$inject = ['$compile', '$rootScope'];
 *   injector.invoke(tmpFn);
 *
 *   // To better support inline function the inline annotation is supported
 *   injector.invoke(['$compile', '$rootScope', function(obfCompile, obfRootScope) {
 *     // ...
 *   }]);
 *
 *   // Therefore
 *   expect(injector.annotate(
 *      ['$compile', '$rootScope', function(obfus_$compile, obfus_$rootScope) {}])
 *    ).toEqual(['$compile', '$rootScope']);
 * ```
 *
 * @param {Function|Array.<string|Function>} fn Function for which dependent service names need to
 * be retrieved as described above.
 *
 * @param {boolean=} [strictDi=false] Disallow argument name annotation inference.
 *
 * @returns {Array.<string>} The names of the services which the function requires.
 */
/**
 * @ngdoc method
 * @name $injector#loadNewModules
 *
 * @description
 *
 * **This is a dangerous API, which you use at your own risk!**
 *
 * Add the specified modules to the current injector.
 *
 * This method will add each of the injectables to the injector and execute all of the config and run
 * blocks for each module passed to the method.
 *
 * If a module has already been loaded into the injector then it will not be loaded again.
 *
 * * The application developer is responsible for loading the code containing the modules; and for
 * ensuring that lazy scripts are not downloaded and executed more often that desired.
 * * Previously compiled HTML will not be affected by newly loaded directives, filters and components.
 * * Modules cannot be unloaded.
 *
 * You can use {@link $injector#modules `$injector.modules`} to check whether a module has been loaded
 * into the injector, which may indicate whether the script has been executed already.
 *
 * @example
 * Here is an example of loading a bundle of modules, with a utility method called `getScript`:
 *
 * ```javascript
 * app.factory('loadModule', function($injector) {
 *   return function loadModule(moduleName, bundleUrl) {
 *     return getScript(bundleUrl).then(function() { $injector.loadNewModules([moduleName]); });
 *   };
 * })
 * ```
 *
 * @param {Array<String|Function|Array>=} mods an array of modules to load into the application.
 *     Each item in the array should be the name of a predefined module or a (DI annotated)
 *     function that will be invoked by the injector as a `config` block.
 *     See: {@link angular.module modules}
 */

/**
 * @ngdoc service
 * @name $provide
 *
 * @description
 *
 * The {@link auto.$provide $provide} service has a number of methods for registering components
 * with the {@link auto.$injector $injector}. Many of these functions are also exposed on
 * {@link angular.Module}.
 *
 * An AngularJS **service** is a singleton object created by a **service factory**.  These **service
 * factories** are functions which, in turn, are created by a **service provider**.
 * The **service providers** are constructor functions. When instantiated they must contain a
 * property called `$get`, which holds the **service factory** function.
 *
 * When you request a service, the {@link auto.$injector $injector} is responsible for finding the
 * correct **service provider**, instantiating it and then calling its `$get` **service factory**
 * function to get the instance of the **service**.
 *
 * Often services have no configuration options and there is no need to add methods to the service
 * provider.  The provider will be no more than a constructor function with a `$get` property. For
 * these cases the {@link auto.$provide $provide} service has additional helper methods to register
 * services without specifying a provider.
 *
 * * {@link auto.$provide#provider provider(name, provider)} - registers a **service provider** with the
 *     {@link auto.$injector $injector}
 * * {@link auto.$provide#constant constant(name, obj)} - registers a value/object that can be accessed by
 *     providers and services.
 * * {@link auto.$provide#value value(name, obj)} - registers a value/object that can only be accessed by
 *     services, not providers.
 * * {@link auto.$provide#factory factory(name, fn)} - registers a service **factory function**
 *     that will be wrapped in a **service provider** object, whose `$get` property will contain the
 *     given factory function.
 * * {@link auto.$provide#service service(name, Fn)} - registers a **constructor function**
 *     that will be wrapped in a **service provider** object, whose `$get` property will instantiate
 *      a new object using the given constructor function.
 * * {@link auto.$provide#decorator decorator(name, decorFn)} - registers a **decorator function** that
 *      will be able to modify or replace the implementation of another service.
 *
 * See the individual methods for more information and examples.
 */

/**
 * @ngdoc method
 * @name $provide#provider
 * @description
 *
 * Register a **provider function** with the {@link auto.$injector $injector}. Provider functions
 * are constructor functions, whose instances are responsible for "providing" a factory for a
 * service.
 *
 * Service provider names start with the name of the service they provide followed by `Provider`.
 * For example, the {@link ng.$log $log} service has a provider called
 * {@link ng.$logProvider $logProvider}.
 *
 * Service provider objects can have additional methods which allow configuration of the provider
 * and its service. Importantly, you can configure what kind of service is created by the `$get`
 * method, or how that service will act. For example, the {@link ng.$logProvider $logProvider} has a
 * method {@link ng.$logProvider#debugEnabled debugEnabled}
 * which lets you specify whether the {@link ng.$log $log} service will log debug messages to the
 * console or not.
 *
 * It is possible to inject other providers into the provider function,
 * but the injected provider must have been defined before the one that requires it.
 *
 * @param {string} name The name of the instance. NOTE: the provider will be available under `name +
                        'Provider'` key.
 * @param {(Object|function())} provider If the provider is:
 *
 *   - `Object`: then it should have a `$get` method. The `$get` method will be invoked using
 *     {@link auto.$injector#invoke $injector.invoke()} when an instance needs to be created.
 *   - `Constructor`: a new instance of the provider will be created using
 *     {@link auto.$injector#instantiate $injector.instantiate()}, then treated as `object`.
 *
 * @returns {Object} registered provider instance

 * @example
 *
 * The following example shows how to create a simple event tracking service and register it using
 * {@link auto.$provide#provider $provide.provider()}.
 *
 * ```js
 *  // Define the eventTracker provider
 *  function EventTrackerProvider() {
 *    let trackingUrl = '/track';
 *
 *    // A provider method for configuring where the tracked events should been saved
 *    this.setTrackingUrl = function(url) {
 *      trackingUrl = url;
 *    };
 *
 *    // The service factory function
 *    this.$get = ['$http', function($http) {
 *      let trackedEvents = {};
 *      return {
 *        // Call this to track an event
 *        event: function(event) {
 *          let count = trackedEvents[event] || 0;
 *          count += 1;
 *          trackedEvents[event] = count;
 *          return count;
 *        },
 *        // Call this to save the tracked events to the trackingUrl
 *        save: function() {
 *          $http.post(trackingUrl, trackedEvents);
 *        }
 *      };
 *    }];
 *  }
 *
 *  describe('eventTracker', function() {
 *    let postSpy;
 *
 *    beforeEach(module(function($provide) {
 *      // Register the eventTracker provider
 *      $provide.provider('eventTracker', EventTrackerProvider);
 *    }));
 *
 *    beforeEach(module(function(eventTrackerProvider) {
 *      // Configure eventTracker provider
 *      eventTrackerProvider.setTrackingUrl('/custom-track');
 *    }));
 *
 *    it('tracks events', inject(function(eventTracker) {
 *      expect(eventTracker.event('login')).toEqual(1);
 *      expect(eventTracker.event('login')).toEqual(2);
 *    }));
 *
 *    it('saves to the tracking url', inject(function(eventTracker, $http) {
 *      postSpy = spyOn($http, 'post');
 *      eventTracker.event('login');
 *      eventTracker.save();
 *      expect(postSpy).toHaveBeenCalled();
 *      expect(postSpy.mostRecentCall.args[0]).not.toEqual('/track');
 *      expect(postSpy.mostRecentCall.args[0]).toEqual('/custom-track');
 *      expect(postSpy.mostRecentCall.args[1]).toEqual({ 'login': 1 });
 *    }));
 *  });
 * ```
 */

/**
 * @ngdoc method
 * @name $provide#factory
 * @description
 *
 * Register a **service factory**, which will be called to return the service instance.
 * This is short for registering a service where its provider consists of only a `$get` property,
 * which is the given service factory function.
 * You should use {@link auto.$provide#factory $provide.factory(getFn)} if you do not need to
 * configure your service in a provider.
 *
 * @param {string} name The name of the instance.
 * @param {Function|Array.<string|Function>} $getFn The injectable $getFn for the instance creation.
 *                      Internally this is a short hand for `$provide.provider(name, {$get: $getFn})`.
 * @returns {Object} registered provider instance
 *
 * @example
 * Here is an example of registering a service
 * ```js
 *   $provide.factory('ping', ['$http', function($http) {
 *     return function ping() {
 *       return $http.send('/ping');
 *     };
 *   }]);
 * ```
 * You would then inject and use this service like this:
 * ```js
 *   someModule.controller('Ctrl', ['ping', function(ping) {
 *     ping();
 *   }]);
 * ```
 */

/**
 * @ngdoc method
 * @name $provide#service
 * @description
 *
 * Register a **service constructor**, which will be invoked with `new` to create the service
 * instance.
 * This is short for registering a service where its provider's `$get` property is a factory
 * function that returns an instance instantiated by the injector from the service constructor
 * function.
 *
 * Internally it looks a bit like this:
 *
 * ```
 * {
 *   $get: function() {
 *     return $injector.instantiate(constructor);
 *   }
 * }
 * ```
 *
 *
 * You should use {@link auto.$provide#service $provide.service(class)} if you define your service
 * as a type/class.
 *
 * @param {string} name The name of the instance.
 * @param {Function|Array.<string|Function>} constructor An injectable class (constructor function)
 *     that will be instantiated.
 * @returns {Object} registered provider instance
 *
 * @example
 * Here is an example of registering a service using
 * {@link auto.$provide#service $provide.service(class)}.
 * ```js
 *   let Ping = function($http) {
 *     this.$http = $http;
 *   };
 *
 *   Ping.$inject = ['$http'];
 *
 *   Ping.prototype.send = function() {
 *     return this.$http.get('/ping');
 *   };
 *   $provide.service('ping', Ping);
 * ```
 * You would then inject and use this service like this:
 * ```js
 *   someModule.controller('Ctrl', ['ping', function(ping) {
 *     ping.send();
 *   }]);
 * ```
 */

/**
 * @ngdoc method
 * @name $provide#value
 * @description
 *
 * Register a **value service** with the {@link auto.$injector $injector}, such as a string, a
 * number, an array, an object or a function. This is short for registering a service where its
 * provider's `$get` property is a factory function that takes no arguments and returns the **value
 * service**. That also means it is not possible to inject other services into a value service.
 *
 * Value services are similar to constant services, except that they cannot be injected into a
 * module configuration function (see {@link angular.Module#config}) but they can be overridden by
 * an AngularJS {@link auto.$provide#decorator decorator}.
 *
 * @param {string} name The name of the instance.
 * @param {*} value The value.
 * @returns {Object} registered provider instance
 *
 * @example
 * Here are some examples of creating value services.
 * ```js
 *   $provide.value('ADMIN_USER', 'admin');
 *
 *   $provide.value('RoleLookup', { admin: 0, writer: 1, reader: 2 });
 *
 *   $provide.value('halfOf', function(value) {
 *     return value / 2;
 *   });
 * ```
 */

/**
 * @ngdoc method
 * @name $provide#constant
 * @description
 *
 * Register a **constant service** with the {@link auto.$injector $injector}, such as a string,
 * a number, an array, an object or a function. Like the {@link auto.$provide#value value}, it is not
 * possible to inject other services into a constant.
 *
 * But unlike {@link auto.$provide#value value}, a constant can be
 * injected into a module configuration function (see {@link angular.Module#config}) and it cannot
 * be overridden by an AngularJS {@link auto.$provide#decorator decorator}.
 *
 * @param {string} name The name of the constant.
 * @param {*} value The constant value.
 * @returns {Object} registered instance
 *
 * @example
 * Here a some examples of creating constants:
 * ```js
 *   $provide.constant('SHARD_HEIGHT', 306);
 *
 *   $provide.constant('MY_COLOURS', ['red', 'blue', 'grey']);
 *
 *   $provide.constant('double', function(value) {
 *     return value * 2;
 *   });
 * ```
 */

/**
 * @ngdoc method
 * @name $provide#decorator
 * @description
 *
 * Register a **decorator function** with the {@link auto.$injector $injector}. A decorator function
 * intercepts the creation of a service, allowing it to override or modify the behavior of the
 * service. The return value of the decorator function may be the original service, or a new service
 * that replaces (or wraps and delegates to) the original service.
 *
 * You can find out more about using decorators in the {@link guide/decorators} guide.
 *
 * @param {string} name The name of the service to decorate.
 * @param {Function|Array.<string|Function>} decorator This function will be invoked when the service needs to be
 *    provided and should return the decorated service instance. The function is called using
 *    the {@link auto.$injector#invoke injector.invoke} method and is therefore fully injectable.
 *    Local injection arguments:
 *
 *    * `$delegate` - The original service instance, which can be replaced, monkey patched, configured,
 *      decorated or delegated to.
 *
 * @example
 * Here we decorate the {@link ng.$log $log} service to convert warnings to errors by intercepting
 * calls to {@link ng.$log#error $log.warn()}.
 * ```js
 *   $provide.decorator('$log', ['$delegate', function($delegate) {
 *     $delegate.warn = $delegate.error;
 *     return $delegate;
 *   }]);
 * ```
 */

function createInjector(modulesToLoad, strictDi) {
  strictDi = strictDi === true;
  let INSTANTIATING = {},
    providerSuffix = "Provider",
    path = [],
    loadedModules = new NgMap(),
    providerCache = {
      $provide: {
        provider: supportObject(provider),
        factory: supportObject(factory),
        service: supportObject(service),
        value: supportObject(value),
        constant: supportObject(constant),
        decorator: decorator,
      },
    },
    providerInjector = (providerCache.$injector = createInternalInjector(
      providerCache,
      function (serviceName, caller) {
        if (angular.isString(caller)) {
          path.push(caller);
        }
        throw $injectorMinErr(
          "unpr",
          "Unknown provider: {0}",
          path.join(" <- "),
        );
      },
    )),
    instanceCache = {},
    protoInstanceInjector = createInternalInjector(
      instanceCache,
      function (serviceName, caller) {
        let provider = providerInjector.get(
          serviceName + providerSuffix,
          caller,
        );
        return instanceInjector.invoke(
          provider.$get,
          provider,
          undefined,
          serviceName,
        );
      },
    ),
    instanceInjector = protoInstanceInjector;

  providerCache["$injector" + providerSuffix] = {
    $get: valueFn(protoInstanceInjector),
  };
  instanceInjector.modules = providerInjector.modules = createMap();
  let runBlocks = loadModules(modulesToLoad);
  instanceInjector = protoInstanceInjector.get("$injector");
  instanceInjector.strictDi = strictDi;
  forEach(runBlocks, function (fn) {
    if (fn) instanceInjector.invoke(fn);
  });

  instanceInjector.loadNewModules = function (mods) {
    forEach(loadModules(mods), function (fn) {
      if (fn) instanceInjector.invoke(fn);
    });
  };

  return instanceInjector;

  ////////////////////////////////////
  // $provider
  ////////////////////////////////////

  function supportObject(delegate) {
    return function (key, value) {
      if (isObject(key)) {
        forEach(key, reverseParams(delegate));
      } else {
        return delegate(key, value);
      }
    };
  }

  function provider(name, provider_) {
    assertNotHasOwnProperty(name, "service");
    if (isFunction(provider_) || isArray(provider_)) {
      provider_ = providerInjector.instantiate(provider_);
    }
    if (!provider_.$get) {
      throw $injectorMinErr(
        "pget",
        "Provider '{0}' must define $get factory method.",
        name,
      );
    }
    return (providerCache[name + providerSuffix] = provider_);
  }

  function enforceReturnValue(name, factory) {
    return /** @this */ function enforcedReturnValue() {
      let result = instanceInjector.invoke(factory, this);
      if (isUndefined(result)) {
        throw $injectorMinErr(
          "undef",
          "Provider '{0}' must return a value from $get factory method.",
          name,
        );
      }
      return result;
    };
  }

  function factory(name, factoryFn, enforce) {
    return provider(name, {
      $get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn,
    });
  }

  function service(name, constructor) {
    return factory(name, [
      "$injector",
      function ($injector) {
        return $injector.instantiate(constructor);
      },
    ]);
  }

  function value(name, val) {
    return factory(name, valueFn(val), false);
  }

  function constant(name, value) {
    assertNotHasOwnProperty(name, "constant");
    providerCache[name] = value;
    instanceCache[name] = value;
  }

  function decorator(serviceName, decorFn) {
    let origProvider = providerInjector.get(serviceName + providerSuffix),
      orig$get = origProvider.$get;

    origProvider.$get = function () {
      let origInstance = instanceInjector.invoke(orig$get, origProvider);
      return instanceInjector.invoke(decorFn, null, {
        $delegate: origInstance,
      });
    };
  }

  ////////////////////////////////////
  // Module Loading
  ////////////////////////////////////
  function loadModules(modulesToLoad) {
    assertArg(
      isUndefined(modulesToLoad) || isArray(modulesToLoad),
      "modulesToLoad",
      "not an array",
    );
    let runBlocks = [],
      moduleFn;
    forEach(modulesToLoad, function (module) {
      if (loadedModules.get(module)) return;
      loadedModules.set(module, true);

      function runInvokeQueue(queue) {
        let i, ii;
        for (i = 0, ii = queue.length; i < ii; i++) {
          let invokeArgs = queue[i],
            provider = providerInjector.get(invokeArgs[0]);

          provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
        }
      }

      try {
        if (isString(module)) {
          moduleFn = angularModule(module);
          instanceInjector.modules[module] = moduleFn;
          runBlocks = runBlocks
            .concat(loadModules(moduleFn.requires))
            .concat(moduleFn._runBlocks);
          runInvokeQueue(moduleFn._invokeQueue);
          runInvokeQueue(moduleFn._configBlocks);
        } else if (isFunction(module)) {
          runBlocks.push(providerInjector.invoke(module));
        } else if (isArray(module)) {
          runBlocks.push(providerInjector.invoke(module));
        } else {
          assertArgFn(module, "module");
        }
      } catch (e) {
        if (isArray(module)) {
          module = module[module.length - 1];
        }
        if (e.message && e.stack && e.stack.indexOf(e.message) === -1) {
          // Safari & FF's stack traces don't contain error.message content
          // unlike those of Chrome and IE
          // So if stack doesn't contain message, we create a new string that contains both.
          // Since error.stack is read-only in Safari, I'm overriding e and not e.stack here.
          // eslint-disable-next-line no-ex-assign
          e = e.message + "\n" + e.stack;
        }
        throw $injectorMinErr(
          "modulerr",
          "Failed to instantiate module {0} due to:\n{1}",
          module,
          e.stack || e.message || e,
        );
      }
    });
    return runBlocks;
  }

  ////////////////////////////////////
  // internal Injector
  ////////////////////////////////////

  function createInternalInjector(cache, factory) {
    function getService(serviceName, caller) {
      if (cache.hasOwnProperty(serviceName)) {
        if (cache[serviceName] === INSTANTIATING) {
          throw $injectorMinErr(
            "cdep",
            "Circular dependency found: {0}",
            serviceName + " <- " + path.join(" <- "),
          );
        }
        return cache[serviceName];
      } else {
        try {
          path.unshift(serviceName);
          cache[serviceName] = INSTANTIATING;
          cache[serviceName] = factory(serviceName, caller);
          return cache[serviceName];
        } catch (err) {
          if (cache[serviceName] === INSTANTIATING) {
            delete cache[serviceName];
          }
          throw err;
        } finally {
          path.shift();
        }
      }
    }

    function injectionArgs(fn, locals, serviceName) {
      let args = [],
        $inject = createInjector.$$annotate(fn, strictDi, serviceName);

      for (let i = 0, length = $inject.length; i < length; i++) {
        let key = $inject[i];
        if (typeof key !== "string") {
          throw $injectorMinErr(
            "itkn",
            "Incorrect injection token! Expected service name as string, got {0}",
            key,
          );
        }
        args.push(
          locals && locals.hasOwnProperty(key)
            ? locals[key]
            : getService(key, serviceName),
        );
      }
      return args;
    }

    function isClass(func) {
      let result = func.$$ngIsClass;
      if (!isBoolean(result)) {
        result = func.$$ngIsClass = /^class\b/.test(stringifyFn(func));
      }
      return result;
    }

    function invoke(fn, self, locals, serviceName) {
      if (typeof locals === "string") {
        serviceName = locals;
        locals = null;
      }

      let args = injectionArgs(fn, locals, serviceName);
      if (isArray(fn)) {
        fn = fn[fn.length - 1];
      }

      if (!isClass(fn)) {
        // http://jsperf.com/angularjs-invoke-apply-vs-switch
        // #5388
        return fn.apply(self, args);
      } else {
        args.unshift(null);
        return new (Function.prototype.bind.apply(fn, args))();
      }
    }

    function instantiate(Type, locals, serviceName) {
      // Check if Type is annotated and use just the given function at n-1 as parameter
      // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
      let ctor = isArray(Type) ? Type[Type.length - 1] : Type;
      let args = injectionArgs(Type, locals, serviceName);
      // Empty object at position 0 is ignored for invocation with `new`, but required.
      args.unshift(null);
      return new (Function.prototype.bind.apply(ctor, args))();
    }

    return {
      invoke: invoke,
      instantiate: instantiate,
      get: getService,
      annotate: createInjector.$$annotate,
      has: function (name) {
        return (
          providerCache.hasOwnProperty(name + providerSuffix) ||
          cache.hasOwnProperty(name)
        );
      },
    };
  }
}

createInjector.$$annotate = annotate;

/**
 * @ngdoc module
 * @name ng

 * @installation
 * @description
 *
 * The ng module is loaded by default when an AngularJS application is started. The module itself
 * contains the essential components for an AngularJS application to function. The table below
 * lists a high level breakdown of each of the services/factories, filters, directives and testing
 * components available within this core module.
 *
 */

const REGEX_STRING_REGEXP = /^\/(.+)\/([a-z]*)$/;

// The name of a form control's ValidityState property.
// This is used so that it's possible for internal tests to create mock ValidityStates.
const VALIDITY_STATE_PROPERTY = "validity";

let jqLite, // delay binding since jQuery could be loaded after us.
  ngMinErr = minErr$1("ng"),
  /** @name angular */
  angular$1 = window["angular"] || (window["angular"] = {});

/////////////////////////////////////////////////

function allowAutoBootstrap(document) {
  let script = document.currentScript;

  // If the `currentScript` property has been clobbered just return false, since this indicates a probable attack
  if (
    !(
      script instanceof window.HTMLScriptElement ||
      script instanceof window.SVGScriptElement
    )
  ) {
    return false;
  }

  let attributes = script.attributes;
  let srcs = [
    attributes.getNamedItem("src"),
    attributes.getNamedItem("href"),
    attributes.getNamedItem("xlink:href"),
  ];

  return srcs.every(function (src) {
    if (!src) {
      return true;
    }
    if (!src.value) {
      return false;
    }

    let link = document.createElement("a");
    link.href = src.value;

    if (document.location.origin === link.origin) {
      // Same-origin resources are always allowed, even for banned URL schemes.
      return true;
    }
    // Disabled bootstrapping unless angular.js was loaded from a known scheme used on the web.
    // This is to prevent angular.js bundled with browser extensions from being used to bypass the
    // content security policy in web pages and other browser extensions.
    switch (link.protocol) {
      case "http:":
      case "https:":
      case "ftp:":
      case "blob:":
      case "file:":
      case "data:":
        return true;
      default:
        return false;
    }
  });
}

// Cached as it has to run during loading so that document.currentScript is available.
const isAutoBootstrapAllowed = allowAutoBootstrap(window.document);

/**
 * @ngdoc directive
 * @name ngApp
 *
 * @element ANY
 * @param {angular.Module} ngApp an optional application
 *   {@link angular.module module} name to load.
 * @param {boolean=} ngStrictDi if this attribute is present on the app element, the injector will be
 *   created in "strict-di" mode. This means that the application will fail to invoke functions which
 *   do not use explicit function annotation (and are thus unsuitable for minification), as described
 *   in {@link guide/di the Dependency Injection guide}, and useful debugging info will assist in
 *   tracking down the root of these bugs.
 *
 * @description
 *
 * Use this directive to **auto-bootstrap** an AngularJS application. The `ngApp` directive
 * designates the **root element** of the application and is typically placed near the root element
 * of the page - e.g. on the `<body>` or `<html>` tags.
 *
 * There are a few things to keep in mind when using `ngApp`:
 * - only one AngularJS application can be auto-bootstrapped per HTML document. The first `ngApp`
 *   found in the document will be used to define the root element to auto-bootstrap as an
 *   application. To run multiple applications in an HTML document you must manually bootstrap them using
 *   {@link angular.bootstrap} instead.
 * - AngularJS applications cannot be nested within each other.
 * - Do not use a directive that uses {@link ng.$compile#transclusion transclusion} on the same element as `ngApp`.
 *   This includes directives such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and
 *   {@link ngRoute.ngView `ngView`}.
 *   Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
 *   causing animations to stop working and making the injector inaccessible from outside the app.
 *
 * You can specify an **AngularJS module** to be used as the root module for the application.  This
 * module will be loaded into the {@link auto.$injector} when the application is bootstrapped. It
 * should contain the application code needed or have dependencies on other modules that will
 * contain the code. See {@link angular.module} for more information.
 *
 * In the example below if the `ngApp` directive were not placed on the `html` element then the
 * document would not be compiled, the `AppController` would not be instantiated and the `{{ a+b }}`
 * would not be resolved to `3`.
 *
 * @example
 *
 * ### Simple Usage
 *
 * `ngApp` is the easiest, and most common way to bootstrap an application.
 *
 <example module="ngAppDemo" name="ng-app">
   <file name="index.html">
   <div ng-controller="ngAppDemoController">
     I can add: {{a}} + {{b}} =  {{ a+b }}
   </div>
   </file>
   <file name="script.js">
   angular.module('ngAppDemo', []).controller('ngAppDemoController', function($scope) {
     $scope.a = 1;
     $scope.b = 2;
   });
   </file>
 </example>
 *
 * @example
 *
 * ### With `ngStrictDi`
 *
 * Using `ngStrictDi`, you would see something like this:
 *
 <example ng-app-included="true" name="strict-di">
   <file name="index.html">
   <div ng-app="ngAppStrictDemo" ng-strict-di>
       <div ng-controller="GoodController1">
           I can add: {{a}} + {{b}} =  {{ a+b }}

           <p>This renders because the controller does not fail to
              instantiate, by using explicit annotation style (see
              script.js for details)
           </p>
       </div>

       <div ng-controller="GoodController2">
           Name: <input ng-model="name"><br />
           Hello, {{name}}!

           <p>This renders because the controller does not fail to
              instantiate, by using explicit annotation style
              (see script.js for details)
           </p>
       </div>

       <div ng-controller="BadController">
           I can add: {{a}} + {{b}} =  {{ a+b }}

           <p>The controller could not be instantiated, due to relying
              on automatic function annotations (which are disabled in
              strict mode). As such, the content of this section is not
              interpolated, and there should be an error in your web console.
           </p>
       </div>
   </div>
   </file>
   <file name="script.js">
   angular.module('ngAppStrictDemo', [])
     // BadController will fail to instantiate, due to relying on automatic function annotation,
     // rather than an explicit annotation
     .controller('BadController', function($scope) {
       $scope.a = 1;
       $scope.b = 2;
     })
     // Unlike BadController, GoodController1 and GoodController2 will not fail to be instantiated,
     // due to using explicit annotations using the array style and $inject property, respectively.
     .controller('GoodController1', ['$scope', function($scope) {
       $scope.a = 1;
       $scope.b = 2;
     }])
     .controller('GoodController2', GoodController2);
     function GoodController2($scope) {
       $scope.name = 'World';
     }
     GoodController2.$inject = ['$scope'];
   </file>
   <file name="style.css">
   div[ng-controller] {
       margin-bottom: 1em;
       -webkit-border-radius: 4px;
       border-radius: 4px;
       border: 1px solid;
       padding: .5em;
   }
   div[ng-controller^=Good] {
       border-color: #d6e9c6;
       background-color: #dff0d8;
       color: #3c763d;
   }
   div[ng-controller^=Bad] {
       border-color: #ebccd1;
       background-color: #f2dede;
       color: #a94442;
       margin-bottom: 0;
   }
   </file>
 </example>
 */
function angularInit(element, bootstrap) {
  let appElement,
    module,
    config = {};

  // The element `element` has priority over any other element.
  forEach$1(ngAttrPrefixes, function (prefix) {
    let name = prefix + "app";

    if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
      appElement = element;
      module = element.getAttribute(name);
    }
  });
  forEach$1(ngAttrPrefixes, function (prefix) {
    let name = prefix + "app";
    let candidate;

    if (
      !appElement &&
      (candidate = element.querySelector("[" + name.replace(":", "\\:") + "]"))
    ) {
      appElement = candidate;
      module = candidate.getAttribute(name);
    }
  });
  if (appElement) {
    if (!isAutoBootstrapAllowed) {
      window.console.error(
        "AngularJS: disabling automatic bootstrap. <script> protocol indicates " +
          "an extension, document.location.href does not match.",
      );
      return;
    }
    config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
    bootstrap(appElement, module ? [module] : [], config);
  }
}

/**
 * @module angular
 * @function bootstrap

 * @description
 * Use this function to manually start up AngularJS application.
 *
 * For more information, see the {@link guide/bootstrap Bootstrap guide}.
 *
 * AngularJS will detect if it has been loaded into the browser more than once and only allow the
 * first loaded script to be bootstrapped and will report a warning to the browser console for
 * each of the subsequent scripts. This prevents strange results in applications, where otherwise
 * multiple instances of AngularJS try to work on the DOM.
 *
 * <div class="alert alert-warning">
 * **Note:** Protractor based end-to-end tests cannot use this function to bootstrap manually.
 * They must use {@link ng.directive:ngApp ngApp}.
 * </div>
 *
 * <div class="alert alert-warning">
 * **Note:** Do not bootstrap the app on an element with a directive that uses {@link ng.$compile#transclusion transclusion},
 * such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and {@link ngRoute.ngView `ngView`}.
 * Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
 * causing animations to stop working and making the injector inaccessible from outside the app.
 * </div>
 *
 * ```html
 * <!doctype html>
 * <html>
 * <body>
 * <div ng-controller="WelcomeController">
 *   {{greeting}}
 * </div>
 *
 * <script src="angular.js"></script>
 * <script>
 *   let app = angular.module('demo', [])
 *   .controller('WelcomeController', function($scope) {
 *       $scope.greeting = 'Welcome!';
 *   });
 *   angular.bootstrap(document, ['demo']);
 * </script>
 * </body>
 * </html>
 * ```
 *
 * @param {DOMElement} element DOM element which is the root of AngularJS application.
 * @param {Array<String|Function|Array>=} modules an array of modules to load into the application.
 *     Each item in the array should be the name of a predefined module or a (DI annotated)
 *     function that will be invoked by the injector as a `config` block.
 *     See: {@link angular.module modules}
 * @param {Object=} config an object for defining configuration options for the application. The
 *     following keys are supported:
 *
 * * `strictDi` - disable automatic function annotation for the application. This is meant to
 *   assist in finding bugs which break minified code. Defaults to `false`.
 *
 * @returns {auto.$injector} Returns the newly created injector for this app.
 */
function bootstrap(element, modules, config) {
  if (!isObject$1(config)) config = {};
  let defaultConfig = {
    strictDi: false,
  };
  config = extend(defaultConfig, config);
  let doBootstrap = function () {
    element = jqLite(element);

    if (element.injector()) {
      let tag =
        element[0] === window.document ? "document" : startingTag(element);
      // Encode angle brackets to prevent input from being sanitized to empty string #8683.
      throw ngMinErr(
        "btstrpd",
        "App already bootstrapped with this element '{0}'",
        tag.replace(/</, "&lt;").replace(/>/, "&gt;"),
      );
    }

    modules = modules || [];
    modules.unshift([
      "$provide",
      function ($provide) {
        $provide.value("$rootElement", element);
      },
    ]);

    if (config.debugInfoEnabled) {
      // Pushing so that this overrides `debugInfoEnabled` setting defined in user's `modules`.
      modules.push([
        "$compileProvider",
        function ($compileProvider) {
          $compileProvider.debugInfoEnabled(true);
        },
      ]);
    }

    modules.unshift("ng");
    let injector = createInjector(modules, config.strictDi);
    injector.invoke([
      "$rootScope",
      "$rootElement",
      "$compile",
      "$injector",
      function bootstrapApply(scope, element, compile, injector) {
        scope.$apply(function () {
          element.data("$injector", injector);
          compile(element)(scope);
        });
      },
    ]);
    return injector;
  };

  const NG_ENABLE_DEBUG_INFO = /^NG_ENABLE_DEBUG_INFO!/;
  const NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

  if (window && NG_ENABLE_DEBUG_INFO.test(window.name)) {
    config.debugInfoEnabled = true;
    window.name = window.name.replace(NG_ENABLE_DEBUG_INFO, "");
  }

  if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
    return doBootstrap();
  }

  window.name = window.name.replace(NG_DEFER_BOOTSTRAP, "");
  angular$1.resumeBootstrap = function (extraModules) {
    forEach$1(extraModules, function (module) {
      modules.push(module);
    });
    return doBootstrap();
  };

  if (isFunction(angular$1.resumeDeferredBootstrap)) {
    angular$1.resumeDeferredBootstrap();
  }
}

/**
 * @module angular
 * @function reloadWithDebugInfo

 * @description
 * Use this function to reload the current application with debug information turned on.
 * This takes precedence over a call to `$compileProvider.debugInfoEnabled(false)`.
 *
 * See {@link ng.$compileProvider#debugInfoEnabled} for more.
 */
function reloadWithDebugInfo() {
  window.name = "NG_ENABLE_DEBUG_INFO!" + window.name;
  window.location.reload();
}

/**
 * @function getTestability

 * @description
 * Get the testability service for the instance of AngularJS on the given
 * element.
 * @param {DOMElement} element DOM element which is the root of AngularJS application.
 */
function getTestability(rootElement) {
  let injector = angular$1.element(rootElement).injector();
  if (!injector) {
    throw ngMinErr(
      "test",
      "no injector found for element argument to getTestability",
    );
  }
  return injector.get("$$testability");
}

/**
 * throw error if the argument is falsy.
 */
function assertArg$1(arg, name, reason) {
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

function assertArgFn$1(arg, name, acceptArrayAnnotation) {
  if (acceptArrayAnnotation && isArray(arg)) {
    arg = arg[arg.length - 1];
  }

  assertArg$1(
    isFunction(arg),
    name,
    "not a function, got " +
      (arg && typeof arg === "object"
        ? arg.constructor.name || "Object"
        : typeof arg),
  );
  return arg;
}

export { REGEX_STRING_REGEXP, VALIDITY_STATE_PROPERTY, allowAutoBootstrap, angularInit, assertArg$1 as assertArg, assertArgFn$1 as assertArgFn, bootstrap, getTestability, reloadWithDebugInfo };
