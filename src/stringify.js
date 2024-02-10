import {
  copy,
  isObject,
  isUndefined,
  isValidObjectMaxDepth,
  toJsonReplacer,
} from "./ng/utils";

export function serializeObject(obj, maxDepth) {
  const seen = [];
  let copyObj = obj;
  // There is no direct way to stringify object until reaching a specific depth
  // and a very deep object can cause a performance issue, so we copy the object
  // based on this specific depth and then stringify it.
  if (isValidObjectMaxDepth(maxDepth)) {
    // This file is also included in `angular-loader`, so `copy()` might not always be available in
    // the closure. Therefore, it is lazily retrieved as `angular.copy()` when needed.
    copyObj = copy(obj, null, maxDepth);
  }
  return JSON.stringify(copyObj, (key, val) => {
    const replace = toJsonReplacer(key, val);
    if (isObject(replace)) {
      if (seen.indexOf(replace) >= 0) return "...";

      seen.push(replace);
    }
    return replace;
  });
}

export function toDebugString(obj, maxDepth) {
  if (typeof obj === "function") {
    return obj.toString().replace(/ \{[\s\S]*$/, "");
  }
  if (isUndefined(obj)) {
    return "undefined";
  }
  if (typeof obj !== "string") {
    return serializeObject(obj, maxDepth);
  }
  return obj;
}
