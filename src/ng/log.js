/**
 * @ngdoc service
 * @name $log
 * @requires $window
 *
 * @description
 * Simple service for logging. Default implementation safely writes the message
 * into the browser's console (if present).
 *
 * The main purpose of this service is to simplify debugging and troubleshooting.
 *
 * To reveal the location of the calls to `$log` in the JavaScript console,
 * you can "blackbox" the AngularJS source in your browser:
 *
 * [Mozilla description of blackboxing](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Black_box_a_source).
 * [Chrome description of blackboxing](https://developer.chrome.com/devtools/docs/blackboxing).
 *
 * Note: Not all browsers support blackboxing.
 *
 * The default is to log `debug` messages. You can use
 * {@link ng.$logProvider ng.$logProvider#debugEnabled} to change this.
 *
 * @example
   <example module="logExample" name="log-service">
     <file name="script.js">
       angular.module('logExample', [])
         .controller('LogController', ['$scope', '$log', function($scope, $log) {
           $scope.$log = $log;
           $scope.message = 'Hello World!';
         }]);
     </file>
     <file name="index.html">
       <div ng-controller="LogController">
         <p>Reload this page with open console, enter text and hit the log button...</p>
         <label>Message:
         <input type="text" ng-model="message" /></label>
         <button ng-click="$log.log(message)">log</button>
         <button ng-click="$log.warn(message)">warn</button>
         <button ng-click="$log.info(message)">info</button>
         <button ng-click="$log.error(message)">error</button>
         <button ng-click="$log.debug(message)">debug</button>
       </div>
     </file>
   </example>
 */

/**
 * @ngdoc provider
 * @name $logProvider
 * @this
 *
 * @description
 * Use the `$logProvider` to configure how the application logs messages
 */
export function $LogProvider() {
  let debug = true;
  const self = this;

  /**
   * @ngdoc method
   * @name $logProvider#debugEnabled
   * @description
   * @param {boolean=} flag enable or disable debug level messages
   * @returns {*} current value if used as getter or itself (chaining) if used as setter
   */
  this.debugEnabled = function (flag) {
    if (isDefined(flag)) {
      debug = flag;
      return this;
    }
    return debug;
  };

  this.$get = [
    "$window",
    function ($window) {
      return {
        /**
         * @ngdoc method
         * @name $log#log
         *
         * @description
         * Write a log message
         */
        log: consoleLog("log"),

        /**
         * @ngdoc method
         * @name $log#info
         *
         * @description
         * Write an information message
         */
        info: consoleLog("info"),

        /**
         * @ngdoc method
         * @name $log#warn
         *
         * @description
         * Write a warning message
         */
        warn: consoleLog("warn"),

        /**
         * @ngdoc method
         * @name $log#error
         *
         * @description
         * Write an error message
         */
        error: consoleLog("error"),

        /**
         * @ngdoc method
         * @name $log#debug
         *
         * @description
         * Write a debug message
         */
        debug: (function () {
          const fn = consoleLog("debug");

          return function () {
            if (debug) {
              fn.apply(self, arguments);
            }
          };
        })(),
      };

      function formatError(arg) {
        if (isError(arg)) {
          if (arg.stack && formatStackTrace) {
            arg =
              arg.message && arg.stack.indexOf(arg.message) === -1
                ? `Error: ${arg.message}\n${arg.stack}`
                : arg.stack;
          } else if (arg.sourceURL) {
            arg = `${arg.message}\n${arg.sourceURL}:${arg.line}`;
          }
        }
        return arg;
      }

      function consoleLog(type) {
        const console = $window.console || {};
        const logFn = console[type] || console.log || noop;

        return function () {
          const args = [];
          forEach(arguments, (arg) => {
            args.push(formatError(arg));
          });
          // Support: IE 9 only
          // console methods don't inherit from Function.prototype in IE 9 so we can't
          // call `logFn.apply(console, args)` directly.
          return Function.prototype.apply.call(logFn, console, args);
        };
      }
    },
  ];
}
