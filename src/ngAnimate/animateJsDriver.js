let $$AnimateJsDriverProvider = [
  "$$animationProvider",
  /** @this */ function ($$animationProvider) {
    $$animationProvider.drivers.push("$$animateJsDriver");
    this.$get = [
      "$$animateJs",
      "$$AnimateRunner",
      function ($$animateJs, $$AnimateRunner) {
        return function initDriverFn(animationDetails) {
          if (animationDetails.from && animationDetails.to) {
            let fromAnimation = prepareAnimation(animationDetails.from);
            let toAnimation = prepareAnimation(animationDetails.to);
            if (!fromAnimation && !toAnimation) return;

            return {
              start: function () {
                let animationRunners = [];

                if (fromAnimation) {
                  animationRunners.push(fromAnimation.start());
                }

                if (toAnimation) {
                  animationRunners.push(toAnimation.start());
                }

                $$AnimateRunner.all(animationRunners, done);

                let runner = new $$AnimateRunner({
                  end: endFnFactory(),
                  cancel: endFnFactory(),
                });

                return runner;

                function endFnFactory() {
                  return function () {
                    forEach(animationRunners, function (runner) {
                      // at this point we cannot cancel animations for groups just yet. 1.5+
                      runner.end();
                    });
                  };
                }

                function done(status) {
                  runner.complete(status);
                }
              },
            };
          } else {
            return prepareAnimation(animationDetails);
          }
        };

        function prepareAnimation(animationDetails) {
          // TODO(matsko): make sure to check for grouped animations and delegate down to normal animations
          let element = animationDetails.element;
          let event = animationDetails.event;
          let options = animationDetails.options;
          let classes = animationDetails.classes;
          return $$animateJs(element, event, classes, options);
        }
      },
    ];
  },
];
