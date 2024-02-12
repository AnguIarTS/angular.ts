const NODE_TYPE_ELEMENT = 1;
const NODE_TYPE_ATTRIBUTE = 2;
const NODE_TYPE_TEXT = 3;
const NODE_TYPE_COMMENT = 8;
const NODE_TYPE_DOCUMENT = 9;
const NODE_TYPE_DOCUMENT_FRAGMENT = 11;

/* eslint-disable no-use-before-define */

const ngMinErr$1 = minErr("ng");

/**
 *
 * @description Converts the specified string to lowercase.
 * @param {string} string String to be converted to lowercase.
 * @returns {string} Lowercased string.
 */
function lowercase(string) {
  return isString(string) ? string.toLowerCase() : string;
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
  if (isArray(obj) || isString(obj)) return true;

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
function isUndefined(value) {
  return typeof value === "undefined";
}

/**
 * @module angular
 * @function isDefined
 *
 * @description
 * Determines if a reference is defined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is defined.
 */
function isDefined(value) {
  return typeof value !== "undefined";
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
function isObject(value) {
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
function isString(value) {
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
function isArray(arr) {
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
function isFunction(value) {
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
function isBoolean(value) {
  return typeof value === "boolean";
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
 * @param {*} value
 * @returns {string | *}
 */
function trim(value) {
  return isString(value) ? value.trim() : value;
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
function forEach(obj, iterator, context) {
  let key;
  let length;
  if (obj) {
    if (isFunction(obj)) {
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
    } else if (isArray(obj) || isArrayLike(obj)) {
      const isPrimitive = typeof obj !== "object";
      for (key = 0, length = obj.length; key < length; key++) {
        if (isPrimitive || key in obj) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
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
 * when using forEach the params are value, key, but it is often useful to have key, value.
 * @param {function(string, *)} iteratorFn
 * @returns {function(*, string)}
 */
function reverseParams(iteratorFn) {
  return function (value, key) {
    iteratorFn(key, value);
  };
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
  const h = dst.$$hashKey;

  for (let i = 0, ii = objs.length; i < ii; ++i) {
    const obj = objs[i];
    if (!isObject(obj) && !isFunction(obj)) continue;
    const keys = Object.keys(obj);
    for (let j = 0, jj = keys.length; j < jj; j++) {
      const key = keys[j];
      const src = obj[key];

      if (deep && isObject(src)) {
        if (isDate(src)) {
          dst[key] = new Date(src.valueOf());
        } else if (isRegExp(src)) {
          dst[key] = new RegExp(src);
        } else if (src.nodeName) {
          dst[key] = src.cloneNode(true);
        } else if (isElement(src)) {
          dst[key] = src.clone();
        } else if (key !== "__proto__") {
          if (!isObject(dst[key])) dst[key] = isArray(src) ? [] : {};
          baseExtend(dst[key], [src], true);
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
 * @function merge

 * @function
 *
 * @description
 * Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
 * by passing an empty object as the target: `let object = angular.merge({}, object1, object2)`.
 *
 * Unlike {@link angular.extend extend()}, `merge()` recursively descends into object properties of source
 * objects, performing a deep copy.
 *
 * @deprecated
 * sinceVersion="1.6.5"
 * This function is deprecated, but will not be removed in the 1.x lifecycle.
 * There are edge cases (see {@link angular.merge#known-issues known issues}) that are not
 * supported by this function. We suggest using another, similar library for all-purpose merging,
 * such as [lodash's merge()](https://lodash.com/docs/4.17.4#merge).
 *
 * @knownIssue
 * This is a list of (known) object types that are not handled correctly by this function:
 * - [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob)
 * - [`MediaStream`](https://developer.mozilla.org/docs/Web/API/MediaStream)
 * - [`CanvasGradient`](https://developer.mozilla.org/docs/Web/API/CanvasGradient)
 * - AngularJS {@link $rootScope.Scope scopes};
 *
 * `angular.merge` also does not support merging objects with circular references.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @returns {Object} Reference to `dst`.
 */
function merge(dst) {
  return baseExtend(dst, Array.prototype.slice.call(arguments, 1), true);
}

/**
 * @module angular
 * @function identity

 * @function
 *
 * @description
 * A function that returns its first argument. This function is useful when writing code in the
 * functional style.
 *
   ```js
   function transformer(transformationFn, value) {
     return (transformationFn || angular.identity)(value);
   };

   // E.g.
   function getResult(fn, input) {
     return (fn || angular.identity)(input);
   };

   getResult(function(n) { return n * 2; }, 21);   // returns 42
   getResult(null, 21);                            // returns 21
   getResult(undefined, 21);                       // returns 21
   ```
 *
 * @param {*} value to be returned.
 * @returns {*} the value passed in.
 */
function identity(value) {
  return value;
}

/**
 * @param {*} value
 * @returns {() => *}
 */
function valueFn(value) {
  return () => value;
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

function nodeName_(element) {
  return lowercase(element.nodeName || (element[0] && element[0].nodeName));
}

function arrayRemove(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  }
  return index;
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
  const stackSource = [];
  const stackDest = [];
  maxDepth = isValidObjectMaxDepth(maxDepth) ? maxDepth : NaN;

  if (destination) {
    if (isTypedArray(destination) || isArrayBuffer(destination)) {
      throw ngMinErr$1(
        "cpta",
        "Can't copy! TypedArray destination cannot be mutated.",
      );
    }
    if (source === destination) {
      throw ngMinErr$1(
        "cpi",
        "Can't copy! Source and destination are identical.",
      );
    }

    // Empty the destination object
    if (isArray(destination)) {
      destination.length = 0;
    } else {
      forEach(destination, (value, key) => {
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
    const h = destination.$$hashKey;
    let key;
    if (isArray(source)) {
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
    if (!isObject(source)) {
      return source;
    }

    // Already copied values
    const index = stackSource.indexOf(source);
    if (index !== -1) {
      return stackDest[index];
    }

    if (isWindow(source) || isScope(source)) {
      throw ngMinErr$1(
        "cpws",
        "Can't copy! Making copies of Window or Scope instances is not supported.",
      );
    }

    let needsRecurse = false;
    let destination = copyType(source);

    if (destination === undefined) {
      destination = isArray(source)
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
          const copied = new ArrayBuffer(source.byteLength);
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
        const re = new RegExp(
          source.source,
          source.toString().match(/[^/]*$/)[0],
        );
        re.lastIndex = source.lastIndex;
        return re;

      case "[object Blob]":
        return new source.constructor([source], { type: source.type });
    }

    if (isFunction(source.cloneNode)) {
      return source.cloneNode(true);
    }
  }
}

function simpleCompare(a, b) {
  return a === b || (a !== a && b !== b);
}

/**
 * @module angular
 * @function equals

 * @function
 *
 * @description
 * Determines if two objects or two values are equivalent. Supports value types, regular
 * expressions, arrays and objects.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties are equal by
 *   comparing them with `angular.equals`.
 * * Both values are NaN. (In JavaScript, NaN == NaN => false. But we consider two NaN as equal)
 * * Both values represent the same regular expression (In JavaScript,
 *   /abc/ == /abc/ => false. But we consider two regular expressions as equal when their textual
 *   representation matches).
 *
 * During a property comparison, properties of `function` type and properties with names
 * that begin with `$` are ignored.
 *
 * Scope and DOMWindow objects are being compared only by identify (`===`).
 *
 * @param {*} o1 Object or value to compare.
 * @param {*} o2 Object or value to compare.
 * @returns {boolean} True if arguments are equal.
 *
 * @example
   <example module="equalsExample" name="equalsExample">
     <file name="index.html">
      <div ng-controller="ExampleController">
        <form novalidate>
          <h3>User 1</h3>
          Name: <input type="text" ng-model="user1.name">
          Age: <input type="number" ng-model="user1.age">

          <h3>User 2</h3>
          Name: <input type="text" ng-model="user2.name">
          Age: <input type="number" ng-model="user2.age">

          <div>
            <br/>
            <input type="button" value="Compare" ng-click="compare()">
          </div>
          User 1: <pre>{{user1 | json}}</pre>
          User 2: <pre>{{user2 | json}}</pre>
          Equal: <pre>{{result}}</pre>
        </form>
      </div>
    </file>
    <file name="script.js">
        angular.module('equalsExample', []).controller('ExampleController', ['$scope', function($scope) {
          $scope.user1 = {};
          $scope.user2 = {};
          $scope.compare = function() {
            $scope.result = angular.equals($scope.user1, $scope.user2);
          };
        }]);
    </file>
  </example>
 */
function equals(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  // eslint-disable-next-line no-self-compare
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  const t1 = typeof o1;
  const t2 = typeof o2;
  let length;
  let key;
  let keySet;
  if (t1 === t2 && t1 === "object") {
    if (isArray(o1)) {
      if (!isArray(o2)) return false;
      if ((length = o1.length) === o2.length) {
        for (key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) return false;
        }
        return true;
      }
    } else if (isDate(o1)) {
      if (!isDate(o2)) return false;
      return simpleCompare(o1.getTime(), o2.getTime());
    } else if (isRegExp(o1)) {
      if (!isRegExp(o2)) return false;
      return o1.toString() === o2.toString();
    } else {
      if (
        isScope(o1) ||
        isScope(o2) ||
        isWindow(o1) ||
        isWindow(o2) ||
        isArray(o2) ||
        isDate(o2) ||
        isRegExp(o2)
      )
        return false;
      keySet = createMap();
      for (key in o1) {
        if (key.charAt(0) === "$" || isFunction(o1[key])) continue;
        if (!equals(o1[key], o2[key])) return false;
        keySet[key] = true;
      }
      for (key in o2) {
        if (
          !(key in keySet) &&
          key.charAt(0) !== "$" &&
          isDefined(o2[key]) &&
          !isFunction(o2[key])
        )
          return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * throw error if the name given is hasOwnProperty
 * @param  {String} name    the name to test
 * @param  {String} context the context in which the name is used, such as module or directive
 */
function assertNotHasOwnProperty(name, context) {
  if (name === "hasOwnProperty") {
    throw ngMinErr$1(
      "badname",
      "hasOwnProperty is not a valid {0} name",
      context,
    );
  }
}

/**
 * Creates a new object without a prototype. This object is useful for lookup without having to
 * guard against prototypically inherited properties via hasOwnProperty.
 *
 * Related micro-benchmarks:
 * - http://jsperf.com/object-create2
 * - http://jsperf.com/proto-map-lookup/2
 * - http://jsperf.com/for-in-vs-object-keys2
 *
 * @returns {Object}
 */
function createMap() {
  return Object.create(null);
}

/**
 * @param {Number} maxDepth
 * @return {boolean}
 */
function isValidObjectMaxDepth(maxDepth) {
  return isNumber(maxDepth) && maxDepth > 0;
}

function concat(array1, array2, index) {
  return array1.concat(Array.prototype.slice.call(array2, index));
}

function sliceArgs(args, startIndex) {
  return Array.prototype.slice.call(args, startIndex || 0);
}

/**
 * @module angular
 * @function bind

 * @function
 *
 * @description
 * Returns a function which calls function `fn` bound to `self` (`self` becomes the `this` for
 * `fn`). You can supply optional `args` that are prebound to the function. This feature is also
 * known as [partial application](http://en.wikipedia.org/wiki/Partial_application), as
 * distinguished from [function currying](http://en.wikipedia.org/wiki/Currying#Contrast_with_partial_function_application).
 *
 * @param {Object} self Context which `fn` should be evaluated in.
 * @param {*} fn Function to be bound.
 * @returns {function()} Function that wraps the `fn` with all the specified bindings.
 */
function bind(self, fn) {
  const curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
  if (isFunction(fn) && !(fn instanceof RegExp)) {
    return curryArgs.length
      ? function () {
          return arguments.length
            ? fn.apply(self, concat(curryArgs, arguments, 0))
            : fn.apply(self, curryArgs);
        }
      : function () {
          return arguments.length ? fn.apply(self, arguments) : fn.call(self);
        };
  }
  // In IE, native methods are not functions so they cannot be bound (note: they don't need to be).
  return fn;
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
 * @module angular
 * @function toJson
 *
 * @description
 * Serializes input into a JSON-formatted string. Properties with leading $$ characters will be
 * stripped since AngularJS uses this notation internally.
 *
 * @param {Object|Array|Date|string|number|boolean} obj Input to be serialized into JSON.
 * @param {boolean|number} [pretty=2] If set to true, the JSON output will contain newlines and whitespace.
 *    If set to an integer, the JSON output will contain that many spaces per indentation.
 * @returns {string|undefined} JSON-ified string representing `obj`.
 * @knownIssue
 *
 * The Safari browser throws a `RangeError` instead of returning `null` when it tries to stringify a `Date`
 * object with an invalid date value. The only reliable way to prevent this is to monkeypatch the
 * `Date.prototype.toJSON` method as follows:
 *
 * ```
 * let _DatetoJSON = Date.prototype.toJSON;
 * Date.prototype.toJSON = function() {
 *   try {
 *     return _DatetoJSON.call(this);
 *   } catch(e) {
 *     if (e instanceof RangeError) {
 *       return null;
 *     }
 *     throw e;
 *   }
 * };
 * ```
 *
 * See https://github.com/angular/angular.js/pull/14221 for more information.
 */
function toJson(obj, pretty) {
  if (isUndefined(obj)) return undefined;
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null;
  }
  return JSON.stringify(obj, toJsonReplacer, pretty);
}

/**
 * @module angular
 * @function fromJson
 *
 * @description
 * Deserializes a JSON string.
 *
 * @param {string} json JSON string to deserialize.
 * @returns {Object|Array|string|number} Deserialized JSON string.
 */
function fromJson(json) {
  return isString(json) ? JSON.parse(json) : json;
}

/**
 * @returns {string} Returns the string representation of the element.
 */
function startingTag(element) {
  const clonedElement = element.cloneNode(true);
  while (clonedElement.firstChild) {
    clonedElement.removeChild(clonedElement.firstChild);
  }
  const tempDiv = document.createElement("div");

  // Append the cloned element to the temp div and get its HTML
  tempDiv.appendChild(clonedElement);
  const elemHtml = tempDiv.innerHTML;
  try {
    return element[0].nodeType === NODE_TYPE_TEXT
      ? lowercase(elemHtml)
      : elemHtml
          .match(/^(<[^>]+>)/)[1]
          .replace(
            /^<([\w-]+)/,
            (match, nodeName) => `<${lowercase(nodeName)}`,
          );
  } catch (e) {
    return lowercase(elemHtml);
  }
}

/**
 * Creates a shallow copy of an object, an array or a primitive.
 *
 * Assumes that there are no proto properties for objects.
 */
function shallowCopy(src, dst) {
  if (isArray(src)) {
    dst = dst || [];

    for (let i = 0, ii = src.length; i < ii; i++) {
      dst[i] = src[i];
    }
  } else if (isObject(src)) {
    dst = dst || {};

    for (const key in src) {
      if (!(key.startsWith("$") && key.charAt(1) === "$")) {
        dst[key] = src[key];
      }
    }
  }

  return dst || src;
}

/**
 * throw error if the argument is falsy.
 */
function assertArg(arg, name, reason) {
  if (!arg) {
    throw ngMinErr$1(
      "areq",
      "Argument '{0}' is {1}",
      name || "?",
      reason || "required",
    );
  }
  return arg;
}

function assertArgFn(arg, name, acceptArrayAnnotation) {
  if (acceptArrayAnnotation && isArray(arg)) {
    arg = arg[arg.length - 1];
  }

  assertArg(
    isFunction(arg),
    name,
    `not a function, got ${
      arg && typeof arg === "object"
        ? arg.constructor.name || "Object"
        : typeof arg
    }`,
  );
  return arg;
}

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

function minErr(module) {
  const url = 'https://errors.angularjs.org/"NG_VERSION_FULL"/';
  const regex = `${url.replace(".", "\\.")}[\\s\\S]*`;
  const errRegExp = new RegExp(regex, "g");

  return function () {
    const code = arguments[0];
    const template = arguments[1];
    let message = `[${module ? `${module}:` : ""}${code}] `;
    const templateArgs = sliceArgs(arguments, 2).map((arg) =>
      toDebugString(arg, minErrConfig.objectMaxDepth),
    );
    let paramPrefix;
    let i;

    // A minErr message has two parts: the message itself and the url that contains the
    // encoded message.
    // The message's parameters can contain other error messages which also include error urls.
    // To prevent the messages from getting too long, we strip the error urls from the parameters.

    message += template.replace(/\{\d+\}/g, (match) => {
      const index = +match.slice(1, -1);

      if (index < templateArgs.length) {
        return templateArgs[index].replace(errRegExp, "");
      }

      return match;
    });

    message += `\n${url}${module ? `${module}/` : ""}${code}`;

    if (minErrConfig.urlErrorParamsEnabled) {
      for (
        i = 0, paramPrefix = "?";
        i < templateArgs.length;
        i++, paramPrefix = "&"
      ) {
        message += `${paramPrefix}p${i}=${encodeURIComponent(templateArgs[i])}`;
      }
    }

    return Error(message);
  };
}

/* eslint-disable no-multi-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable class-methods-use-this */

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

for (const key in wrapMap) {
  const wrapMapValueClosing = wrapMap[key];
  const wrapMapValue = wrapMapValueClosing.slice().reverse();
  [
    wrapMapValue.length,
    `<${wrapMapValue.join("><")}>`,
    `</${wrapMapValueClosing.join("></")}>`,
  ];
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

function jqLiteHasData(node) {
  for (const key in jqCache[node.ng339]) {
    return true;
  }
  return false;
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
function jqLite(element) {
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

/// ///////////////////////////////////////
// Functions iterating getter/setters.
// these functions return self on setter and
// value on get.
/// ///////////////////////////////////////
const BOOLEAN_ATTR = {};
forEach(
  "multiple,selected,checked,disabled,readOnly,required,open".split(","),
  (value) => {
    BOOLEAN_ATTR[lowercase(value)] = value;
  },
);
forEach(
  "input,select,option,textarea,button,form,details".split(","),
  (value) => {
  },
);

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

/* eslint-disable no-use-before-define */

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

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const $injectorMinErr = minErr("$injector");

function stringifyFn(fn) {
  return Function.prototype.toString.call(fn);
}

function extractArgs(fn) {
  const fnText = stringifyFn(fn).replace(STRIP_COMMENTS, "");
  const args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
  return args;
}

function anonFn(fn) {
  // For anonymous functions, showing at the very least the function signature can help in
  // debugging.
  const args = extractArgs(fn);
  if (args) {
    return `function(${(args[1] || "").replace(/[\s\r\n]+/, " ")})`;
  }
  return "fn";
}

function annotate(fn, strictDi, name) {
  let $inject;
  let argDecl;
  let last;

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
        forEach(argDecl[1].split(FN_ARG_SPLIT), (arg) => {
          arg.replace(FN_ARG, (all, underscore, name) => {
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

/// ////////////////////////////////////

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
  const INSTANTIATING = {};
  const providerSuffix = "Provider";
  const path = [];
  const loadedModules = new Map();
  const providerCache = {
    $provide: {
      provider: supportObject(provider),
      factory: supportObject(factory),
      service: supportObject(service),
      value: supportObject(value),
      constant: supportObject(constant),
      decorator,
    },
  };
  const providerInjector = (providerCache.$injector = createInternalInjector(
    providerCache,
    (serviceName, caller) => {
      if (angular.isString(caller)) {
        path.push(caller);
      }
      throw $injectorMinErr("unpr", "Unknown provider: {0}", path.join(" <- "));
    },
  ));
  const instanceCache = {};
  const protoInstanceInjector = createInternalInjector(
    instanceCache,
    (serviceName, caller) => {
      const provider = providerInjector.get(
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
  );
  let instanceInjector = protoInstanceInjector;

  providerCache[`$injector${providerSuffix}`] = {
    $get: valueFn(protoInstanceInjector),
  };
  instanceInjector.modules = providerInjector.modules = createMap();
  const runBlocks = loadModules(modulesToLoad);
  instanceInjector = protoInstanceInjector.get("$injector");
  instanceInjector.strictDi = strictDi;
  forEach(runBlocks, (fn) => {
    if (fn) instanceInjector.invoke(fn);
  });

  instanceInjector.loadNewModules = function (mods) {
    forEach(loadModules(mods), (fn) => {
      if (fn) instanceInjector.invoke(fn);
    });
  };

  return instanceInjector;

  /// /////////////////////////////////
  // $provider
  /// /////////////////////////////////

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
      const result = instanceInjector.invoke(factory, this);
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
    const origProvider = providerInjector.get(serviceName + providerSuffix);
    const orig$get = origProvider.$get;

    origProvider.$get = function () {
      const origInstance = instanceInjector.invoke(orig$get, origProvider);
      return instanceInjector.invoke(decorFn, null, {
        $delegate: origInstance,
      });
    };
  }

  /// /////////////////////////////////
  // Module Loading
  /// /////////////////////////////////
  function loadModules(modulesToLoad) {
    assertArg(
      isUndefined(modulesToLoad) || isArray(modulesToLoad),
      "modulesToLoad",
      "not an array",
    );
    let runBlocks = [];
    let moduleFn;
    forEach(modulesToLoad, (module) => {
      if (loadedModules.get(module)) return;
      loadedModules.set(module, true);

      function runInvokeQueue(queue) {
        let i;
        let ii;
        for (i = 0, ii = queue.length; i < ii; i++) {
          const invokeArgs = queue[i];
          const provider = providerInjector.get(invokeArgs[0]);

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
          e = `${e.message}\n${e.stack}`;
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

  /// /////////////////////////////////
  // internal Injector
  /// /////////////////////////////////

  function createInternalInjector(cache, factory) {
    function getService(serviceName, caller) {
      if (cache.hasOwnProperty(serviceName)) {
        if (cache[serviceName] === INSTANTIATING) {
          throw $injectorMinErr(
            "cdep",
            "Circular dependency found: {0}",
            `${serviceName} <- ${path.join(" <- ")}`,
          );
        }
        return cache[serviceName];
      }
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

    function injectionArgs(fn, locals, serviceName) {
      const args = [];
      const $inject = createInjector.$$annotate(fn, strictDi, serviceName);

      for (let i = 0, { length } = $inject; i < length; i++) {
        const key = $inject[i];
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

      const args = injectionArgs(fn, locals, serviceName);
      if (isArray(fn)) {
        fn = fn[fn.length - 1];
      }

      if (!isClass(fn)) {
        // http://jsperf.com/angularjs-invoke-apply-vs-switch
        // #5388
        return fn.apply(self, args);
      }
      args.unshift(null);
      return new (Function.prototype.bind.apply(fn, args))();
    }

    function instantiate(Type, locals, serviceName) {
      // Check if Type is annotated and use just the given function at n-1 as parameter
      // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
      const ctor = isArray(Type) ? Type[Type.length - 1] : Type;
      const args = injectionArgs(Type, locals, serviceName);
      // Empty object at position 0 is ignored for invocation with `new`, but required.
      args.unshift(null);
      return new (Function.prototype.bind.apply(ctor, args))();
    }

    return {
      invoke,
      instantiate,
      get: getService,
      annotate: createInjector.$$annotate,
      has(name) {
        return (
          providerCache.hasOwnProperty(name + providerSuffix) ||
          cache.hasOwnProperty(name)
        );
      },
    };
  }
}

createInjector.$$annotate = annotate;

/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */

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

const minErrConfig$1 = {
  objectMaxDepth: 5,
  urlErrorParamsEnabled: true,
};
const ngMinErr = minErr("ng");

/** @type {Object.<string, angular.IModule>} */
const moduleCache = {};

let doBootstrap = () => {};

class Angular {
  constructor() {
    this.element = undefined;
    this.version = {
      full: "",
      major: 0,
      minor: 0,
      dot: 0,
      codeName: "",
    };

    // Utility methods kept for backwards purposes
    this.bind = bind;
    this.copy = copy;
    this.equals = equals;
    this.extend = extend;
    this.forEach = forEach;
    this.fromJson = fromJson;
    this.toJson = toJson;
    this.identity = identity;
    this.isArray = isArray;
    this.isDate = isDate;
    this.isDefined = isDefined;
    this.isElement = isElement;
    this.isFunction = isFunction;
    this.isNumber = isNumber;
    this.isObject = isObject;
    this.isString = isString;
    this.isUndefined = isUndefined;
    this.merge = merge;
    this.noop = () => {};
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
 * @param {Element} element DOM element which is the root of AngularJS application.
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
  bootstrap(element, modules, config) {
    // eslint-disable-next-line no-param-reassign
    if (!isObject(config)) config = {};
    const defaultConfig = {
      strictDi: false,
    };
    config = extend(defaultConfig, config);
    doBootstrap = () => {
      // @ts-ignore
      element = jqLite(element);

      if (element.injector()) {
        const tag =
          element[0] === window.document ? "document" : startingTag(element);
        // Encode angle brackets to prevent input from being sanitized to empty string #8683.
        throw ngMinErr(
          "btstrpd",
          "App already bootstrapped with this element '{0}'",
          tag.replace(/</, "&lt;").replace(/>/, "&gt;"),
        );
      }

      if (config.debugInfoEnabled) ;
      const injector = createInjector(modules, config.strictDi);
      injector.invoke([
        "$rootScope",
        "$rootElement",
        "$compile",
        "$injector",
        function bootstrapApply(scope, el, compile, $injector) {
          scope.$apply(() => {
            el.data("$injector", $injector);
            compile(el)(scope);
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
  }

  /**
   *
   * @param {any[]} modules
   * @param {boolean?} strictDi
   * @returns {angular.auto.IInjectorService}
   */
  injector(modules, strictDi) {
    return createInjector(modules, strictDi);
  }

  resumeBootstrap(extraModules) {
    forEach(extraModules, (module) => {
    });
    return doBootstrap();
  }

  /**
   * @ngdoc function
   * @name angular.errorHandlingConfig
   * @module ng
   * @kind function
   *
   * @description
   * Configure several aspects of error handling in AngularJS if used as a setter or return the
   * current configuration if used as a getter. The following options are supported:
   *
   * - **objectMaxDepth**: The maximum depth to which objects are traversed when stringified for error messages.
   *
   * Omitted or undefined options will leave the corresponding configuration values unchanged.
   *
   * @param {Object=} config - The configuration object. May only contain the options that need to be
   *     updated. Supported keys:
   *
   * * `objectMaxDepth`  **{Number}** - The max depth for stringifying objects. Setting to a
   *   non-positive or non-numeric value, removes the max depth limit.
   *   Default: 5
   *
   * * `urlErrorParamsEnabled`  **{Boolean}** - Specifies whether the generated error url will
   *   contain the parameters of the thrown error. Disabling the parameters can be useful if the
   *   generated error url is very long.
   *
   *   Default: true. When used without argument, it returns the current value.
   */
  errorHandlingConfig(config) {
    if (isObject(config)) {
      if (isDefined(config.objectMaxDepth)) {
        minErrConfig$1.objectMaxDepth = isValidObjectMaxDepth(
          config.objectMaxDepth,
        )
          ? config.objectMaxDepth
          : NaN;
      }
      if (
        isDefined(config.urlErrorParamsEnabled) &&
        isBoolean(config.urlErrorParamsEnabled)
      ) {
        minErrConfig$1.urlErrorParamsEnabled = config.urlErrorParamsEnabled;
      }
    }
    return minErrConfig$1;
  }

  /**
   * @ngdoc function
   * @name angular.module
   * @module ng
   * @description
   *
   * The `angular.module` is a global place for creating, registering and retrieving AngularJS
   * modules.
   * All modules (AngularJS core or 3rd party) that should be available to an application must be
   * registered using this mechanism.
   *
   * Passing one argument retrieves an existing {@link angular.Module},
   * whereas passing more than one argument creates a new {@link angular.Module}
   *
   *
   * # Module
   *
   * A module is a collection of services, directives, controllers, filters, and configuration information.
   * `angular.module` is used to configure the {@link auto.$injector $injector}.
   *
   * ```js
   * // Create a new module
   * let myModule = angular.module('myModule', []);
   *
   * // register a new service
   * myModule.value('appName', 'MyCoolApp');
   *
   * // configure existing services inside initialization blocks.
   * myModule.config(['$locationProvider', function($locationProvider) {
   *   // Configure existing providers
   *   $locationProvider.hashPrefix('!');
   * }]);
   * ```
   *
   * Then you can create an injector and load your modules like this:
   *
   * ```js
   * let injector = angular.injector(['ng', 'myModule'])
   * ```
   *
   * However it's more likely that you'll just use
   * {@link ng.directive:ngApp ngApp} or
   * {@link angular.bootstrap} to simplify this process for you.
   *
   * @param {!string} name The name of the module to create or retrieve.
   * @param {!Array.<string>=} requires If specified then new module is being created. If
   *        unspecified then the module is being retrieved for further configuration.
   * @param {Function=} configFn Optional configuration function for the module. Same as
   *        {@link angular.Module#config Module#config()}.
   * @returns {angular.IModule} new module with the {@link angular.Module} api.
   */
  module(name, requires, configFn) {
    const $injectorMinErr = minErr("$injector");
    let info = {};

    assertNotHasOwnProperty(name, "module");
    if (requires && moduleCache.hasOwnProperty(name)) {
      moduleCache[name] = null;
    }

    function ensure(obj, name, factory) {
      // eslint-disable-next-line no-return-assign, no-param-reassign
      return obj[name] || (obj[name] = factory());
    }

    return ensure(moduleCache, name, () => {
      if (!requires) {
        throw $injectorMinErr(
          "nomod",
          "Module '{0}' is not available! You either misspelled " +
            "the module name or forgot to load it. If registering a module ensure that you " +
            "specify the dependencies as the second argument.",
          name,
        );
      }

      /** @type {!Array.<Array.<*>>} */
      const invokeQueue = [];

      /** @type {!Array.<Function>} */
      const configBlocks = [];

      /** @type {!Array.<Function>} */
      const runBlocks = [];

      // eslint-disable-next-line no-use-before-define
      const config = invokeLater("$injector", "invoke", "push", configBlocks);

      /** @type {angular.IModule} */
      const moduleInstance = {
        // Private state

        // @ts-ignore
        _invokeQueue: invokeQueue,
        _configBlocks: configBlocks,
        _runBlocks: runBlocks,

        /**
         * @ngdoc method
         * @name angular.Module#info
         * @module ng
         *
         * @param {Object=} value Information about the module
         * @returns {Object|angular.IModule} The current info object for this module if called as a getter,
         *                          or `this` if called as a setter.
         *
         * @description
         * Read and write custom information about this module.
         * For example you could put the version of the module in here.
         *
         * ```js
         * angular.module('myModule', []).info({ version: '1.0.0' });
         * ```
         *
         * The version could then be read back out by accessing the module elsewhere:
         *
         * ```
         * let version = angular.module('myModule').info().version;
         * ```
         *
         * You can also retrieve this information during runtime via the
         * {@link $injector#modules `$injector.modules`} property:
         *
         * ```js
         * let version = $injector.modules['myModule'].info().version;
         * ```
         */
        info(value) {
          if (isDefined(value)) {
            if (!isObject(value))
              throw ngMinErr(
                "aobj",
                "Argument '{0}' must be an object",
                "value",
              );
            info = value;
            return this;
          }
          return info;
        },

        /**
         * @ngdoc property
         * @name angular.Module#requires
         * @module ng
         *
         * @description
         * Holds the list of modules which the injector will load before the current module is
         * loaded.
         */
        requires,

        /**
         * @ngdoc property
         * @name angular.Module#name
         * @module ng
         *
         * @description
         * Name of the module.
         */
        name,

        /**
         * @ngdoc method
         * @name angular.Module#provider
         * @module ng
         * @param {string} name service name
         * @param {Function} providerType Construction function for creating new instance of the
         *                                service.
         * @description
         * See {@link auto.$provide#provider $provide.provider()}.
         */
        provider: invokeLaterAndSetModuleName("$provide", "provider"),

        /**
         * @ngdoc method
         * @name angular.Module#factory
         * @module ng
         * @param {string} name service name
         * @param {Function} providerFunction Function for creating new instance of the service.
         * @description
         * See {@link auto.$provide#factory $provide.factory()}.
         */
        factory: invokeLaterAndSetModuleName("$provide", "factory"),

        /**
         * @ngdoc method
         * @name angular.Module#service
         * @module ng
         * @param {string} name service name
         * @param {Function} constructor A constructor function that will be instantiated.
         * @description
         * See {@link auto.$provide#service $provide.service()}.
         */
        service: invokeLaterAndSetModuleName("$provide", "service"),

        /**
         * @ngdoc method
         * @name angular.Module#value
         * @module ng
         * @param {string} name service name
         * @param {*} object Service instance object.
         * @description
         * See {@link auto.$provide#value $provide.value()}.
         */
        value: invokeLater("$provide", "value"),

        /**
         * @ngdoc method
         * @name angular.Module#constant
         * @module ng
         * @param {string} name constant name
         * @param {*} object Constant value.
         * @description
         * Because the constants are fixed, they get applied before other provide methods.
         * See {@link auto.$provide#constant $provide.constant()}.
         */
        constant: invokeLater("$provide", "constant", "unshift"),

        /**
         * @ngdoc method
         * @name angular.Module#decorator
         * @module ng
         * @param {string} name The name of the service to decorate.
         * @param {Function} decorFn This function will be invoked when the service needs to be
         *                           instantiated and should return the decorated service instance.
         * @description
         * See {@link auto.$provide#decorator $provide.decorator()}.
         */
        decorator: invokeLaterAndSetModuleName(
          "$provide",
          "decorator",
          configBlocks,
        ),

        /**
         * @ngdoc method
         * @name angular.Module#animation
         * @module ng
         * @param {string} name animation name
         * @param {Function} animationFactory Factory function for creating new instance of an
         *                                    animation.
         * @description
         *
         * **NOTE**: animations take effect only if the **ngAnimate** module is loaded.
         *
         *
         * Defines an animation hook that can be later used with
         * {@link $animate $animate} service and directives that use this service.
         *
         * ```js
         * module.animation('.animation-name', function($inject1, $inject2) {
         *   return {
         *     eventName : function(element, done) {
         *       //code to run the animation
         *       //once complete, then run done()
         *       return function cancellationFunction(element) {
         *         //code to cancel the animation
         *       }
         *     }
         *   }
         * })
         * ```
         *
         * See {@link ng.$animateProvider#register $animateProvider.register()} and
         * {@link ngAnimate ngAnimate module} for more information.
         */
        animation: invokeLaterAndSetModuleName("$animateProvider", "register"),

        /**
         * @ngdoc method
         * @name angular.Module#filter
         * @module ng
         * @param {string} name Filter name - this must be a valid AngularJS expression identifier
         * @param {Function} filterFactory Factory function for creating new instance of filter.
         * @description
         * See {@link ng.$filterProvider#register $filterProvider.register()}.
         *
         * <div class="alert alert-warning">
         * **Note:** Filter names must be valid AngularJS {@link expression} identifiers, such as `uppercase` or `orderBy`.
         * Names with special characters, such as hyphens and dots, are not allowed. If you wish to namespace
         * your filters, then you can use capitalization (`myappSubsectionFilterx`) or underscores
         * (`myapp_subsection_filterx`).
         * </div>
         */
        filter: invokeLaterAndSetModuleName("$filterProvider", "register"),

        /**
         * @ngdoc method
         * @name angular.Module#controller
         * @module ng
         * @param {string|Object} name Controller name, or an object map of controllers where the
         *    keys are the names and the values are the constructors.
         * @param {Function} constructor Controller constructor function.
         * @description
         * See {@link ng.$controllerProvider#register $controllerProvider.register()}.
         */
        controller: invokeLaterAndSetModuleName(
          "$controllerProvider",
          "register",
        ),

        /**
         * @ngdoc method
         * @name angular.Module#directive
         * @module ng
         * @param {string|Object} name Directive name, or an object map of directives where the
         *    keys are the names and the values are the factories.
         * @param {Function} directiveFactory Factory function for creating new instance of
         * directives.
         * @description
         * See {@link ng.$compileProvider#directive $compileProvider.directive()}.
         */
        directive: invokeLaterAndSetModuleName("$compileProvider", "directive"),

        /**
         * @ngdoc method
         * @name angular.Module#component
         * @module ng
         * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
         *    or an object map of components where the keys are the names and the values are the component definition objects.
         * @param {Object} options Component definition object (a simplified
         *    {@link ng.$compile#directive-definition-object directive definition object})
         *
         * @description
         * See {@link ng.$compileProvider#component $compileProvider.component()}.
         */
        component: invokeLaterAndSetModuleName("$compileProvider", "component"),

        /**
         * @ngdoc method
         * @name angular.Module#config
         * @module ng
         * @param {Function} configFn Execute this function on module load. Useful for service
         *    configuration.
         * @description
         * Use this method to configure services by injecting their
         * {@link angular.Module#provider `providers`}, e.g. for adding routes to the
         * {@link ngRoute.$routeProvider $routeProvider}.
         *
         * Note that you can only inject {@link angular.Module#provider `providers`} and
         * {@link angular.Module#constant `constants`} into this function.
         *
         * For more about how to configure services, see
         * {@link providers#provider-recipe Provider Recipe}.
         */
        config,

        /**
         * @ngdoc method
         * @name angular.Module#run
         * @module ng
         * @param {Function} initializationFn Execute this function after injector creation.
         *    Useful for application initialization.
         * @description
         * Use this method to register work which should be performed when the injector is done
         * loading all modules.
         */
        run(block) {
          runBlocks.push(block);
          return this;
        },
      };

      if (configFn) {
        config(configFn);
      }

      return moduleInstance;

      /**
       * @param {string} provider
       * @param {string} method
       * @param {String=} insertMethod
       * @returns {angular.IModule}
       */
      function invokeLater(provider, method, insertMethod, queue) {
        if (!queue) queue = invokeQueue;
        return function () {
          queue[insertMethod || "push"]([provider, method, arguments]);
          return moduleInstance;
        };
      }

      /**
       * @param {string} provider
       * @param {string} method
       * @returns {angular.IModule}
       */
      function invokeLaterAndSetModuleName(provider, method, queue) {
        if (!queue) queue = invokeQueue;
        return function (recipeName, factoryFunction) {
          if (factoryFunction && isFunction(factoryFunction))
            factoryFunction.$$moduleName = name;
          queue.push([provider, method, arguments]);
          return moduleInstance;
        };
      }
    });
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
  reloadWithDebugInfo() {
    window.name = `NG_ENABLE_DEBUG_INFO!${window.name}`;
    window.location.reload();
  }

  UNSAFE_restoreLegacyJqLiteXHTMLReplacement() {
    throw new Error("Legacy function kept for TS purposes.");
  }
}

/// //////////////////////////////////////////////

function allowAutoBootstrap(document) {
  const script = document.currentScript;

  // If the `currentScript` property has been clobbered just return false, since this indicates a probable attack
  if (
    !(
      script instanceof window.HTMLScriptElement ||
      script instanceof window.SVGScriptElement
    )
  ) {
    return false;
  }

  const { attributes } = script;
  const srcs = [
    attributes.getNamedItem("src"),
    attributes.getNamedItem("href"),
    attributes.getNamedItem("xlink:href"),
  ];

  return srcs.every((src) => {
    if (!src) {
      return true;
    }
    if (!src.value) {
      return false;
    }

    const link = document.createElement("a");
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
allowAutoBootstrap(window.document);

/**
 * @type {angular.IAngularStatic}
 */
window.angular = new Angular();
