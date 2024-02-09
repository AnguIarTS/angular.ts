let $$AnimateCssDriverProvider = [
  "$$animationProvider",
  /** @this */ function ($$animationProvider) {
    $$animationProvider.drivers.push("$$animateCssDriver");

    let NG_ANIMATE_SHIM_CLASS_NAME = "ng-animate-shim";
    let NG_ANIMATE_ANCHOR_CLASS_NAME = "ng-anchor";

    let NG_OUT_ANCHOR_CLASS_NAME = "ng-anchor-out";
    let NG_IN_ANCHOR_CLASS_NAME = "ng-anchor-in";

    function isDocumentFragment(node) {
      return node.parentNode && node.parentNode.nodeType === 11;
    }

    this.$get = [
      "$animateCss",
      "$rootScope",
      "$$AnimateRunner",
      "$rootElement",
      "$sniffer",
      "$$jqLite",
      "$document",
      function (
        $animateCss,
        $rootScope,
        $$AnimateRunner,
        $rootElement,
        $sniffer,
        $$jqLite,
        $document,
      ) {
        // only browsers that support these properties can render animations
        if (!$sniffer.animations && !$sniffer.transitions) return noop;

        let bodyNode = $document[0].body;
        let rootNode = getDomNode($rootElement);

        let rootBodyElement = jqLite(
          // this is to avoid using something that exists outside of the body
          // we also special case the doc fragment case because our unit test code
          // appends the $rootElement to the body after the app has been bootstrapped
          isDocumentFragment(rootNode) || bodyNode.contains(rootNode)
            ? rootNode
            : bodyNode,
        );

        return function initDriverFn(animationDetails) {
          return animationDetails.from && animationDetails.to
            ? prepareFromToAnchorAnimation(
                animationDetails.from,
                animationDetails.to,
                animationDetails.classes,
                animationDetails.anchors,
              )
            : prepareRegularAnimation(animationDetails);
        };

        function filterCssClasses(classes) {
          //remove all the `ng-` stuff
          return classes.replace(/\bng-\S+\b/g, "");
        }

        function getUniqueValues(a, b) {
          if (isString(a)) a = a.split(" ");
          if (isString(b)) b = b.split(" ");
          return a
            .filter(function (val) {
              return b.indexOf(val) === -1;
            })
            .join(" ");
        }

        function prepareAnchoredAnimation(classes, outAnchor, inAnchor) {
          let clone = jqLite(getDomNode(outAnchor).cloneNode(true));
          let startingClasses = filterCssClasses(getClassVal(clone));

          outAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);
          inAnchor.addClass(NG_ANIMATE_SHIM_CLASS_NAME);

          clone.addClass(NG_ANIMATE_ANCHOR_CLASS_NAME);

          rootBodyElement.append(clone);

          let animatorIn,
            animatorOut = prepareOutAnimation();

          // the user may not end up using the `out` animation and
          // only making use of the `in` animation or vice-versa.
          // In either case we should allow this and not assume the
          // animation is over unless both animations are not used.
          if (!animatorOut) {
            animatorIn = prepareInAnimation();
            if (!animatorIn) {
              return end();
            }
          }

          let startingAnimator = animatorOut || animatorIn;

          return {
            start: function () {
              let runner;

              let currentAnimation = startingAnimator.start();
              currentAnimation.done(function () {
                currentAnimation = null;
                if (!animatorIn) {
                  animatorIn = prepareInAnimation();
                  if (animatorIn) {
                    currentAnimation = animatorIn.start();
                    currentAnimation.done(function () {
                      currentAnimation = null;
                      end();
                      runner.complete();
                    });
                    return currentAnimation;
                  }
                }
                // in the event that there is no `in` animation
                end();
                runner.complete();
              });

              runner = new $$AnimateRunner({
                end: endFn,
                cancel: endFn,
              });

              return runner;

              function endFn() {
                if (currentAnimation) {
                  currentAnimation.end();
                }
              }
            },
          };

          function calculateAnchorStyles(anchor) {
            let styles = {};

            let coords = getDomNode(anchor).getBoundingClientRect();

            // we iterate directly since safari messes up and doesn't return
            // all the keys for the coords object when iterated
            forEach(["width", "height", "top", "left"], function (key) {
              let value = coords[key];
              switch (key) {
                case "top":
                  value += bodyNode.scrollTop;
                  break;
                case "left":
                  value += bodyNode.scrollLeft;
                  break;
              }
              styles[key] = Math.floor(value) + "px";
            });
            return styles;
          }

          function prepareOutAnimation() {
            let animator = $animateCss(clone, {
              addClass: NG_OUT_ANCHOR_CLASS_NAME,
              delay: true,
              from: calculateAnchorStyles(outAnchor),
            });

            // read the comment within `prepareRegularAnimation` to understand
            // why this check is necessary
            return animator.$$willAnimate ? animator : null;
          }

          function getClassVal(element) {
            return element.attr("class") || "";
          }

          function prepareInAnimation() {
            let endingClasses = filterCssClasses(getClassVal(inAnchor));
            let toAdd = getUniqueValues(endingClasses, startingClasses);
            let toRemove = getUniqueValues(startingClasses, endingClasses);

            let animator = $animateCss(clone, {
              to: calculateAnchorStyles(inAnchor),
              addClass: NG_IN_ANCHOR_CLASS_NAME + " " + toAdd,
              removeClass: NG_OUT_ANCHOR_CLASS_NAME + " " + toRemove,
              delay: true,
            });

            // read the comment within `prepareRegularAnimation` to understand
            // why this check is necessary
            return animator.$$willAnimate ? animator : null;
          }

          function end() {
            clone.remove();
            outAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
            inAnchor.removeClass(NG_ANIMATE_SHIM_CLASS_NAME);
          }
        }

        function prepareFromToAnchorAnimation(from, to, classes, anchors) {
          let fromAnimation = prepareRegularAnimation(from, noop);
          let toAnimation = prepareRegularAnimation(to, noop);

          let anchorAnimations = [];
          forEach(anchors, function (anchor) {
            let outElement = anchor["out"];
            let inElement = anchor["in"];
            let animator = prepareAnchoredAnimation(
              classes,
              outElement,
              inElement,
            );
            if (animator) {
              anchorAnimations.push(animator);
            }
          });

          // no point in doing anything when there are no elements to animate
          if (!fromAnimation && !toAnimation && anchorAnimations.length === 0)
            return;

          return {
            start: function () {
              let animationRunners = [];

              if (fromAnimation) {
                animationRunners.push(fromAnimation.start());
              }

              if (toAnimation) {
                animationRunners.push(toAnimation.start());
              }

              forEach(anchorAnimations, function (animation) {
                animationRunners.push(animation.start());
              });

              let runner = new $$AnimateRunner({
                end: endFn,
                cancel: endFn, // CSS-driven animations cannot be cancelled, only ended
              });

              $$AnimateRunner.all(animationRunners, function (status) {
                runner.complete(status);
              });

              return runner;

              function endFn() {
                forEach(animationRunners, function (runner) {
                  runner.end();
                });
              }
            },
          };
        }

        function prepareRegularAnimation(animationDetails) {
          let element = animationDetails.element;
          let options = animationDetails.options || {};

          if (animationDetails.structural) {
            options.event = animationDetails.event;
            options.structural = true;
            options.applyClassesEarly = true;

            // we special case the leave animation since we want to ensure that
            // the element is removed as soon as the animation is over. Otherwise
            // a flicker might appear or the element may not be removed at all
            if (animationDetails.event === "leave") {
              options.onDone = options.domOperation;
            }
          }

          // We assign the preparationClasses as the actual animation event since
          // the internals of $animateCss will just suffix the event token values
          // with `-active` to trigger the animation.
          if (options.preparationClasses) {
            options.event = concatWithSpace(
              options.event,
              options.preparationClasses,
            );
          }

          let animator = $animateCss(element, options);

          // the driver lookup code inside of $$animation attempts to spawn a
          // driver one by one until a driver returns a.$$willAnimate animator object.
          // $animateCss will always return an object, however, it will pass in
          // a flag as a hint as to whether an animation was detected or not
          return animator.$$willAnimate ? animator : null;
        }
      },
    ];
  },
];
