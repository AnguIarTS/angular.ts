import { minErr } from "./minErr";
import {
  extend,
  forEach,
  getNgAttribute,
  isObject,
  ngAttrPrefixes,
  startingTag,
} from "./ng/utils";

import { createInjector } from "./auto/injector";

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

export const REGEX_STRING_REGEXP = /^\/(.+)\/([a-z]*)$/;

// The name of a form control's ValidityState property.
// This is used so that it's possible for internal tests to create mock ValidityStates.
export const VALIDITY_STATE_PROPERTY = "validity";

let jqLite, // delay binding since jQuery could be loaded after us.
  ngMinErr = minErr("ng"),
  /** @name angular */
  angular = window["angular"] || (window["angular"] = {});

/////////////////////////////////////////////////

export function allowAutoBootstrap(document) {
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
export function angularInit(element, bootstrap) {
  let appElement,
    module,
    config = {};

  // The element `element` has priority over any other element.
  forEach(ngAttrPrefixes, function (prefix) {
    let name = prefix + "app";

    if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
      appElement = element;
      module = element.getAttribute(name);
    }
  });
  forEach(ngAttrPrefixes, function (prefix) {
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
export function bootstrap(element, modules, config) {
  if (!isObject(config)) config = {};
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
  angular.resumeBootstrap = function (extraModules) {
    forEach(extraModules, function (module) {
      modules.push(module);
    });
    return doBootstrap();
  };

  if (isFunction(angular.resumeDeferredBootstrap)) {
    angular.resumeDeferredBootstrap();
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
export function reloadWithDebugInfo() {
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
export function getTestability(rootElement) {
  let injector = angular.element(rootElement).injector();
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
export function assertArg(arg, name, reason) {
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

export function assertArgFn(arg, name, acceptArrayAnnotation) {
  if (acceptArrayAnnotation && isArray(arg)) {
    arg = arg[arg.length - 1];
  }

  assertArg(
    isFunction(arg),
    name,
    "not a function, got " +
      (arg && typeof arg === "object"
        ? arg.constructor.name || "Object"
        : typeof arg),
  );
  return arg;
}
