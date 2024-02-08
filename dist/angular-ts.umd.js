(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  minErr('ng');

      /** @name angular */
      window.angular || (window.angular = {});

  function allowAutoBootstrap(document) {
    var script = document.currentScript;

    if (!script) {
      // Support: IE 9-11 only
      // IE does not have `document.currentScript`
      return true;
    }

    // If the `currentScript` property has been clobbered just return false, since this indicates a probable attack
    if (!(script instanceof window.HTMLScriptElement || script instanceof window.SVGScriptElement)) {
      return false;
    }

    var attributes = script.attributes;
    var srcs = [attributes.getNamedItem('src'), attributes.getNamedItem('href'), attributes.getNamedItem('xlink:href')];

    return srcs.every(function(src) {
      if (!src) {
        return true;
      }
      if (!src.value) {
        return false;
      }

      var link = document.createElement('a');
      link.href = src.value;

      if (document.location.origin === link.origin) {
        // Same-origin resources are always allowed, even for banned URL schemes.
        return true;
      }
      // Disabled bootstrapping unless angular.js was loaded from a known scheme used on the web.
      // This is to prevent angular.js bundled with browser extensions from being used to bypass the
      // content security policy in web pages and other browser extensions.
      switch (link.protocol) {
        case 'http:':
        case 'https:':
        case 'ftp:':
        case 'blob:':
        case 'file:':
        case 'data:':
          return true;
        default:
          return false;
      }
    });
  }

  // Cached as it has to run during loading so that document.currentScript is available.
  allowAutoBootstrap(window.document);

}));
