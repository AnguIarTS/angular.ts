import { createInjector } from "./auto/injector";
import { jqLite } from "./jqLite";
import { setupModuleLoader } from "./loader";

const { bootstrap, reloadWithDebugInfo, getTestability } = require("./Angular");
const { errorHandlingConfig, minErr } = require("./minErr");
import {
  extend,
  copy,
  merge,
  equals,
  forEach,
  noop,
  toJson,
  fromJson,
  identity,
  isUndefined,
  isDefined,
  isString,
  isFunction,
  isObject,
  isNumber,
  isElement,
  isArray,
  isDate,
  csp,
  encodeUriSegment,
  encodeUriQuery,
  lowercase,
  stringify,
  uppercase,
} from "./ng/utils";

/**
 * @ngdoc object
 * @name angular.version
 * @module ng
 * @description
 * An object that contains information about the current AngularJS version.
 *
 * This object has the following properties:
 *
 * - `full` – `{string}` – Full version string, such as "0.9.18".
 * - `major` – `{number}` – Major version number, such as "0".
 * - `minor` – `{number}` – Minor version number, such as "9".
 * - `dot` – `{number}` – Dot version number, such as "18".
 * - `codeName` – `{string}` – Code name of the release, such as "jiggling-armfat".
 */
let version = {
  // These placeholder strings will be replaced by grunt's `build` task.
  // They need to be double- or single-quoted.
  full: '"NG_VERSION_FULL"',
  major: "NG_VERSION_MAJOR",
  minor: "NG_VERSION_MINOR",
  dot: "NG_VERSION_DOT",
  codeName: '"NG_VERSION_CODENAME"',
};

export function publishExternalAPI(angular) {
  extend(angular, {
    errorHandlingConfig: errorHandlingConfig,
    bootstrap: bootstrap,
    copy: copy,
    extend: extend,
    merge: merge,
    equals: equals,
    element: jqLite,
    forEach: forEach,
    injector: createInjector,
    noop: noop,
    bind: bind,
    toJson: toJson,
    fromJson: fromJson,
    identity: identity,
    isUndefined: isUndefined,
    isDefined: isDefined,
    isString: isString,
    isFunction: isFunction,
    isObject: isObject,
    isNumber: isNumber,
    isElement: isElement,
    isArray: isArray,
    version: version,
    isDate: isDate,
    callbacks: { $$counter: 0 },
    getTestability: getTestability,
    reloadWithDebugInfo: reloadWithDebugInfo,
    $$minErr: minErr,
    $$csp: csp,
    $$encodeUriSegment: encodeUriSegment,
    $$encodeUriQuery: encodeUriQuery,
    $$lowercase: lowercase,
    $$stringify: stringify,
    $$uppercase: uppercase,
  });

  const angularModule = setupModuleLoader(window);

  angularModule("ng", [
    "$provide",
    function ngModule($provide) {
      // $$sanitizeUriProvider needs to be before $compileProvider as it is used by it.
      $provide.provider({
        $$sanitizeUri: $$SanitizeUriProvider,
      });
      $provide
        .provider("$compile", $CompileProvider)
        .directive({
          a: htmlAnchorDirective,
          input: inputDirective,
          textarea: inputDirective,
          form: formDirective,
          script: scriptDirective,
          select: selectDirective,
          option: optionDirective,
          ngBind: ngBindDirective,
          ngBindHtml: ngBindHtmlDirective,
          ngBindTemplate: ngBindTemplateDirective,
          ngClass: ngClassDirective,
          ngClassEven: ngClassEvenDirective,
          ngClassOdd: ngClassOddDirective,
          ngCloak: ngCloakDirective,
          ngController: ngControllerDirective,
          ngForm: ngFormDirective,
          ngHide: ngHideDirective,
          ngIf: ngIfDirective,
          ngInclude: ngIncludeDirective,
          ngInit: ngInitDirective,
          ngNonBindable: ngNonBindableDirective,
          ngPluralize: ngPluralizeDirective,
          ngRef: ngRefDirective,
          ngRepeat: ngRepeatDirective,
          ngShow: ngShowDirective,
          ngStyle: ngStyleDirective,
          ngSwitch: ngSwitchDirective,
          ngSwitchWhen: ngSwitchWhenDirective,
          ngSwitchDefault: ngSwitchDefaultDirective,
          ngOptions: ngOptionsDirective,
          ngTransclude: ngTranscludeDirective,
          ngModel: ngModelDirective,
          ngList: ngListDirective,
          ngChange: ngChangeDirective,
          pattern: patternDirective,
          ngPattern: patternDirective,
          required: requiredDirective,
          ngRequired: requiredDirective,
          minlength: minlengthDirective,
          ngMinlength: minlengthDirective,
          maxlength: maxlengthDirective,
          ngMaxlength: maxlengthDirective,
          ngValue: ngValueDirective,
          ngModelOptions: ngModelOptionsDirective,
        })
        .directive({
          ngInclude: ngIncludeFillContentDirective,
          input: hiddenInputBrowserCacheDirective,
        })
        .directive(ngAttributeAliasDirectives)
        .directive(ngEventDirectives);
      $provide.provider({
        $anchorScroll: $AnchorScrollProvider,
        $animate: $AnimateProvider,
        $animateCss: $CoreAnimateCssProvider,
        $$animateJs: $$CoreAnimateJsProvider,
        $$animateQueue: $$CoreAnimateQueueProvider,
        $$AnimateRunner: $$AnimateRunnerFactoryProvider,
        $$animateAsyncRun: $$AnimateAsyncRunFactoryProvider,
        $browser: $BrowserProvider,
        $cacheFactory: $CacheFactoryProvider,
        $controller: $ControllerProvider,
        $document: $DocumentProvider,
        $$isDocumentHidden: $$IsDocumentHiddenProvider,
        $exceptionHandler: $ExceptionHandlerProvider,
        $filter: $FilterProvider,
        $$forceReflow: $$ForceReflowProvider,
        $interpolate: $InterpolateProvider,
        $interval: $IntervalProvider,
        $$intervalFactory: $$IntervalFactoryProvider,
        $http: $HttpProvider,
        $httpParamSerializer: $HttpParamSerializerProvider,
        $httpParamSerializerJQLike: $HttpParamSerializerJQLikeProvider,
        $httpBackend: $HttpBackendProvider,
        $xhrFactory: $xhrFactoryProvider,
        $jsonpCallbacks: $jsonpCallbacksProvider,
        $location: $LocationProvider,
        $log: $LogProvider,
        $parse: $ParseProvider,
        $rootScope: $RootScopeProvider,
        $q: $QProvider,
        $$q: $$QProvider,
        $sce: $SceProvider,
        $sceDelegate: $SceDelegateProvider,
        $sniffer: $SnifferProvider,
        $$taskTrackerFactory: $$TaskTrackerFactoryProvider,
        $templateCache: $TemplateCacheProvider,
        $templateRequest: $TemplateRequestProvider,
        $$testability: $$TestabilityProvider,
        $timeout: $TimeoutProvider,
        $window: $WindowProvider,
        $$rAF: $$RAFProvider,
        $$jqLite: $$jqLiteProvider,
        $$Map: $$MapProvider,
        $$cookieReader: $$CookieReaderProvider,
      });
    },
  ]).info({ angularVersion: '"NG_VERSION_FULL"' });
}
