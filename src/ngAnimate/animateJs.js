// TODO(matsko): use caching here to speed things up for detection
// TODO(matsko): add documentation
//  by the time...

let $$AnimateJsProvider = [
  "$animateProvider",
  /** @this */ function ($animateProvider) {
    this.$get = [
      "$injector",
      "$$AnimateRunner",
      "$$jqLite",
      function ($injector, $$AnimateRunner, $$jqLite) {
        let applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
        // $animateJs(element, 'enter');
        return function (element, event, classes, options) {
          let animationClosed = false;

          // the `classes` argument is optional and if it is not used
          // then the classes will be resolved from the element's className
          // property as well as options.addClass/options.removeClass.
          if (arguments.length === 3 && isObject(classes)) {
            options = classes;
            classes = null;
          }

          options = prepareAnimationOptions(options);
          if (!classes) {
            classes = element.attr("class") || "";
            if (options.addClass) {
              classes += " " + options.addClass;
            }
            if (options.removeClass) {
              classes += " " + options.removeClass;
            }
          }

          let classesToAdd = options.addClass;
          let classesToRemove = options.removeClass;

          // the lookupAnimations function returns a series of animation objects that are
          // matched up with one or more of the CSS classes. These animation objects are
          // defined via the module.animation factory function. If nothing is detected then
          // we don't return anything which then makes $animation query the next driver.
          let animations = lookupAnimations(classes);
          let before, after;
          if (animations.length) {
            let afterFn, beforeFn;
            if (event === "leave") {
              beforeFn = "leave";
              afterFn = "afterLeave"; // TODO(matsko): get rid of this
            } else {
              beforeFn =
                "before" + event.charAt(0).toUpperCase() + event.substr(1);
              afterFn = event;
            }

            if (event !== "enter" && event !== "move") {
              before = packageAnimations(
                element,
                event,
                options,
                animations,
                beforeFn,
              );
            }
            after = packageAnimations(
              element,
              event,
              options,
              animations,
              afterFn,
            );
          }

          // no matching animations
          if (!before && !after) return;

          function applyOptions() {
            options.domOperation();
            applyAnimationClasses(element, options);
          }

          function close() {
            animationClosed = true;
            applyOptions();
            applyAnimationStyles(element, options);
          }

          let runner;

          return {
            $$willAnimate: true,
            end: function () {
              if (runner) {
                runner.end();
              } else {
                close();
                runner = new $$AnimateRunner();
                runner.complete(true);
              }
              return runner;
            },
            start: function () {
              if (runner) {
                return runner;
              }

              runner = new $$AnimateRunner();
              let closeActiveAnimations;
              let chain = [];

              if (before) {
                chain.push(function (fn) {
                  closeActiveAnimations = before(fn);
                });
              }

              if (chain.length) {
                chain.push(function (fn) {
                  applyOptions();
                  fn(true);
                });
              } else {
                applyOptions();
              }

              if (after) {
                chain.push(function (fn) {
                  closeActiveAnimations = after(fn);
                });
              }

              runner.setHost({
                end: function () {
                  endAnimations();
                },
                cancel: function () {
                  endAnimations(true);
                },
              });

              $$AnimateRunner.chain(chain, onComplete);
              return runner;

              function onComplete(success) {
                close(success);
                runner.complete(success);
              }

              function endAnimations(cancelled) {
                if (!animationClosed) {
                  (closeActiveAnimations || noop)(cancelled);
                  onComplete(cancelled);
                }
              }
            },
          };

          function executeAnimationFn(fn, element, event, options, onDone) {
            let args;
            switch (event) {
              case "animate":
                args = [element, options.from, options.to, onDone];
                break;

              case "setClass":
                args = [element, classesToAdd, classesToRemove, onDone];
                break;

              case "addClass":
                args = [element, classesToAdd, onDone];
                break;

              case "removeClass":
                args = [element, classesToRemove, onDone];
                break;

              default:
                args = [element, onDone];
                break;
            }

            args.push(options);

            let value = fn.apply(fn, args);
            if (value) {
              if (isFunction(value.start)) {
                value = value.start();
              }

              if (value instanceof $$AnimateRunner) {
                value.done(onDone);
              } else if (isFunction(value)) {
                // optional onEnd / onCancel callback
                return value;
              }
            }

            return noop;
          }

          function groupEventedAnimations(
            element,
            event,
            options,
            animations,
            fnName,
          ) {
            let operations = [];
            forEach(animations, function (ani) {
              let animation = ani[fnName];
              if (!animation) return;

              // note that all of these animations will run in parallel
              operations.push(function () {
                let runner;
                let endProgressCb;

                let resolved = false;
                let onAnimationComplete = function (rejected) {
                  if (!resolved) {
                    resolved = true;
                    (endProgressCb || noop)(rejected);
                    runner.complete(!rejected);
                  }
                };

                runner = new $$AnimateRunner({
                  end: function () {
                    onAnimationComplete();
                  },
                  cancel: function () {
                    onAnimationComplete(true);
                  },
                });

                endProgressCb = executeAnimationFn(
                  animation,
                  element,
                  event,
                  options,
                  function (result) {
                    let cancelled = result === false;
                    onAnimationComplete(cancelled);
                  },
                );

                return runner;
              });
            });

            return operations;
          }

          function packageAnimations(
            element,
            event,
            options,
            animations,
            fnName,
          ) {
            let operations = groupEventedAnimations(
              element,
              event,
              options,
              animations,
              fnName,
            );
            if (operations.length === 0) {
              let a, b;
              if (fnName === "beforeSetClass") {
                a = groupEventedAnimations(
                  element,
                  "removeClass",
                  options,
                  animations,
                  "beforeRemoveClass",
                );
                b = groupEventedAnimations(
                  element,
                  "addClass",
                  options,
                  animations,
                  "beforeAddClass",
                );
              } else if (fnName === "setClass") {
                a = groupEventedAnimations(
                  element,
                  "removeClass",
                  options,
                  animations,
                  "removeClass",
                );
                b = groupEventedAnimations(
                  element,
                  "addClass",
                  options,
                  animations,
                  "addClass",
                );
              }

              if (a) {
                operations = operations.concat(a);
              }
              if (b) {
                operations = operations.concat(b);
              }
            }

            if (operations.length === 0) return;

            // TODO(matsko): add documentation
            return function startAnimation(callback) {
              let runners = [];
              if (operations.length) {
                forEach(operations, function (animateFn) {
                  runners.push(animateFn());
                });
              }

              if (runners.length) {
                $$AnimateRunner.all(runners, callback);
              } else {
                callback();
              }

              return function endFn(reject) {
                forEach(runners, function (runner) {
                  if (reject) {
                    runner.cancel();
                  } else {
                    runner.end();
                  }
                });
              };
            };
          }
        };

        function lookupAnimations(classes) {
          classes = isArray(classes) ? classes : classes.split(" ");
          let matches = [],
            flagMap = {};
          for (let i = 0; i < classes.length; i++) {
            let klass = classes[i],
              animationFactory = $animateProvider.$$registeredAnimations[klass];
            if (animationFactory && !flagMap[klass]) {
              matches.push($injector.get(animationFactory));
              flagMap[klass] = true;
            }
          }
          return matches;
        }
      },
    ];
  },
];
