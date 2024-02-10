/**
 * @name $$cookieWriter
 * @requires $document
 *
 * @description
 * This is a private service for writing cookies
 *
 * @param {string} name Cookie name
 * @param {string=} value Cookie value (if undefined, cookie will be deleted)
 * @param {Object=} options Object with options that need to be stored for the cookie.
 */
function $$CookieWriter($document, $log, $browser) {
  const cookiePath = $browser.baseHref();
  const rawDocument = $document[0];

  function buildCookieString(name, value, options) {
    let path;
    let expires;
    options = options || {};
    expires = options.expires;
    path = angular.isDefined(options.path) ? options.path : cookiePath;
    if (angular.isUndefined(value)) {
      expires = "Thu, 01 Jan 1970 00:00:00 GMT";
      value = "";
    }
    if (angular.isString(expires)) {
      expires = new Date(expires);
    }

    let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    str += path ? `;path=${path}` : "";
    str += options.domain ? `;domain=${options.domain}` : "";
    str += expires ? `;expires=${expires.toUTCString()}` : "";
    str += options.secure ? ";secure" : "";
    str += options.samesite ? `;samesite=${options.samesite}` : "";

    // per http://www.ietf.org/rfc/rfc2109.txt browser must allow at minimum:
    // - 300 cookies
    // - 20 cookies per unique domain
    // - 4096 bytes per cookie
    const cookieLength = str.length + 1;
    if (cookieLength > 4096) {
      $log.warn(
        `Cookie '${name}' possibly not set or overflowed because it was too large (${cookieLength} > 4096 bytes)!`,
      );
    }

    return str;
  }

  return function (name, value, options) {
    rawDocument.cookie = buildCookieString(name, value, options);
  };
}

$$CookieWriter.$inject = ["$document", "$log", "$browser"];

angular.module("ngCookies").provider(
  "$$cookieWriter",
  /** @this */ function $$CookieWriterProvider() {
    this.$get = $$CookieWriter;
  },
);
