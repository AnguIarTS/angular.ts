

/* global qFactory: false */
/* exported
 isFunction,
 isPromiseLike,
 isObject,
 isUndefined,
 minErr,
 extend
*/

/* eslint-disable no-unused-vars */
function isFunction(value) { return typeof value === 'function'; }
function isPromiseLike(obj) { return obj && isFunction(obj.then); }
function isObject(value) { return value !== null && typeof value === 'object'; }
function isUndefined(value) { return typeof value === 'undefined'; }

function minErr(module, constructor) {
  return function() {
    let ErrorConstructor = constructor || Error;
    throw new ErrorConstructor(module + arguments[0] + arguments[1]);
  };
}

function extend(dst) {
  for (let i = 1, ii = arguments.length; i < ii; i++) {
    let obj = arguments[i];
    if (obj) {
      let keys = Object.keys(obj);
      for (let j = 0, jj = keys.length; j < jj; j++) {
        let key = keys[j];
        dst[key] = obj[key];
      }
    }
  }
  return dst;
}
/* eslint-enable */

let $q = qFactory(process.nextTick, function noopExceptionHandler() {});

exports.resolved = $q.resolve;
exports.rejected = $q.reject;
exports.deferred = $q.defer;
