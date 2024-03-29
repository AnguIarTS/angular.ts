/* exported $SnifferProvider */

import { csp, isUndefined, lowercase, toInt } from "./utils";

/**
 * !!! This is an undocumented "private" service !!!
 *
 * @name $sniffer
 * @requires $window
 * @requires $document
 * @this
 *
 * @property {boolean} history Does the browser support html5 history api ?
 * @property {boolean} transitions Does the browser support CSS transition events ?
 * @property {boolean} animations Does the browser support CSS animation events ?
 *
 * @description
 * This is very simple implementation of testing browser's features.
 */
export function $SnifferProvider() {
  this.$get = [
    "$window",
    "$document",
    function ($window, $document) {
      const eventSupport = {};
      // Chrome Packaged Apps are not allowed to access `history.pushState`.
      // If not sandboxed, they can be detected by the presence of `chrome.app.runtime`
      // (see https://developer.chrome.com/apps/api_index). If sandboxed, they can be detected by
      // the presence of an extension runtime ID and the absence of other Chrome runtime APIs
      // (see https://developer.chrome.com/apps/manifest/sandbox).
      // (NW.js apps have access to Chrome APIs, but do support `history`.)
      const isNw = $window.nw && $window.nw.process;
      const isChromePackagedApp =
        !isNw &&
        $window.chrome &&
        (($window.chrome.app && $window.chrome.app.runtime) ||
          (!$window.chrome.app &&
            $window.chrome.runtime &&
            $window.chrome.runtime.id));
      const hasHistoryPushState =
        !isChromePackagedApp && $window.history && $window.history.pushState;
      const android = toInt(
        (/android (\d+)/.exec(lowercase(($window.navigator || {}).userAgent)) ||
          [])[1],
      );
      const boxee = /Boxee/i.test(($window.navigator || {}).userAgent);
      const document = $document[0] || {};
      const bodyStyle = document.body && document.body.style;
      let transitions = false;
      let animations = false;

      if (bodyStyle) {
        // Support: Android <5, Blackberry Browser 10, default Chrome in Android 4.4.x
        // Mentioned browsers need a -webkit- prefix for transitions & animations.
        transitions = !!(
          "transition" in bodyStyle || "webkitTransition" in bodyStyle
        );
        animations = !!(
          "animation" in bodyStyle || "webkitAnimation" in bodyStyle
        );
      }

      return {
        // Android has history.pushState, but it does not update location correctly
        // so let's not use the history API at all.
        // http://code.google.com/p/android/issues/detail?id=17471
        // https://github.com/angular/angular.js/issues/904

        // older webkit browser (533.9) on Boxee box has exactly the same problem as Android has
        // so let's not use the history API also
        // We are purposefully using `!(android < 4)` to cover the case when `android` is undefined
        history: !!(hasHistoryPushState && !(android < 4) && !boxee),
        hasEvent(event) {
          if (isUndefined(eventSupport[event])) {
            const divElm = document.createElement("div");
            eventSupport[event] = `on${event}` in divElm;
          }

          return eventSupport[event];
        },
        csp: csp(),
        transitions,
        animations,
        android,
      };
    },
  ];
}
