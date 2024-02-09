import { isArray, isObject } from "./ng/utils";

/**
 * Creates a shallow copy of an object, an array or a primitive.
 *
 * Assumes that there are no proto properties for objects.
 */
export function shallowCopy(src, dst) {
  if (isArray(src)) {
    dst = dst || [];

    for (let i = 0, ii = src.length; i < ii; i++) {
      dst[i] = src[i];
    }
  } else if (isObject(src)) {
    dst = dst || {};

    for (let key in src) {
      if (!(key.startsWith("$") && key.charAt(1) === "$")) {
        dst[key] = src[key];
      }
    }
  }

  return dst || src;
}
