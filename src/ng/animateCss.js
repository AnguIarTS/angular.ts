/**
 * @ngdoc service
 * @name $animateCss
 * @kind object
 * @this
 *
 * @description
 * This is the core version of `$animateCss`. By default, only when the `ngAnimate` is included,
 * then the `$animateCss` service will actually perform animations.
 *
 * Click here {@link ngAnimate.$animateCss to read the documentation for $animateCss}.
 */
export function CoreAnimateCssProvider() {
  this.$get = [
    "$$rAF",
    "$q",
    "$$AnimateRunner",
    ($$rAF, $q, $$AnimateRunner) =>
      function (element, initialOptions) {
        // all of the animation functions should create
        // a copy of the options data, however, if a
        // parent service has already created a copy then
        // we should stick to using that
        let options = initialOptions || {};
        if (!options.$$prepared) {
          options = copy(options);
        }

        // there is no point in applying the styles since
        // there is no animation that goes on at all in
        // this version of $animateCss.
        if (options.cleanupStyles) {
          options.from = options.to = null;
        }

        if (options.from) {
          element.css(options.from);
          options.from = null;
        }

        let closed;
        const runner = new $$AnimateRunner();
        return {
          start: run,
          end: run,
        };

        function run() {
          $$rAF(() => {
            applyAnimationContents();
            if (!closed) {
              runner.complete();
            }
            closed = true;
          });
          return runner;
        }

        function applyAnimationContents() {
          if (options.addClass) {
            element.addClass(options.addClass);
            options.addClass = null;
          }
          if (options.removeClass) {
            element.removeClass(options.removeClass);
            options.removeClass = null;
          }
          if (options.to) {
            element.css(options.to);
            options.to = null;
          }
        }
      },
  ];
}
