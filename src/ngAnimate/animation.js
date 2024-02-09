/* exported $$AnimationProvider */

let $$AnimationProvider = [
  "$animateProvider",
  /** @this */ function ($animateProvider) {
    let NG_ANIMATE_REF_ATTR = "ng-animate-ref";

    let drivers = (this.drivers = []);

    let RUNNER_STORAGE_KEY = "$$animationRunner";
    let PREPARE_CLASSES_KEY = "$$animatePrepareClasses";

    function setRunner(element, runner) {
      element.data(RUNNER_STORAGE_KEY, runner);
    }

    function removeRunner(element) {
      element.removeData(RUNNER_STORAGE_KEY);
    }

    function getRunner(element) {
      return element.data(RUNNER_STORAGE_KEY);
    }

    this.$get = [
      "$$jqLite",
      "$rootScope",
      "$injector",
      "$$AnimateRunner",
      "$$Map",
      "$$rAFScheduler",
      "$$animateCache",
      function (
        $$jqLite,
        $rootScope,
        $injector,
        $$AnimateRunner,
        $$Map,
        $$rAFScheduler,
        $$animateCache,
      ) {
        let animationQueue = [];
        let applyAnimationClasses = applyAnimationClassesFactory($$jqLite);

        function sortAnimations(animations) {
          let tree = { children: [] };
          let i,
            lookup = new $$Map();

          // this is done first beforehand so that the map
          // is filled with a list of the elements that will be animated
          for (i = 0; i < animations.length; i++) {
            let animation = animations[i];
            lookup.set(
              animation.domNode,
              (animations[i] = {
                domNode: animation.domNode,
                element: animation.element,
                fn: animation.fn,
                children: [],
              }),
            );
          }

          for (i = 0; i < animations.length; i++) {
            processNode(animations[i]);
          }

          return flatten(tree);

          function processNode(entry) {
            if (entry.processed) return entry;
            entry.processed = true;

            let elementNode = entry.domNode;
            let parentNode = elementNode.parentNode;
            lookup.set(elementNode, entry);

            let parentEntry;
            while (parentNode) {
              parentEntry = lookup.get(parentNode);
              if (parentEntry) {
                if (!parentEntry.processed) {
                  parentEntry = processNode(parentEntry);
                }
                break;
              }
              parentNode = parentNode.parentNode;
            }

            (parentEntry || tree).children.push(entry);
            return entry;
          }

          function flatten(tree) {
            let result = [];
            let queue = [];
            let i;

            for (i = 0; i < tree.children.length; i++) {
              queue.push(tree.children[i]);
            }

            let remainingLevelEntries = queue.length;
            let nextLevelEntries = 0;
            let row = [];

            for (i = 0; i < queue.length; i++) {
              let entry = queue[i];
              if (remainingLevelEntries <= 0) {
                remainingLevelEntries = nextLevelEntries;
                nextLevelEntries = 0;
                result.push(row);
                row = [];
              }
              row.push(entry);
              entry.children.forEach(function (childEntry) {
                nextLevelEntries++;
                queue.push(childEntry);
              });
              remainingLevelEntries--;
            }

            if (row.length) {
              result.push(row);
            }

            return result;
          }
        }

        // TODO(matsko): document the signature in a better way
        return function (element, event, options) {
          options = prepareAnimationOptions(options);
          let isStructural = ["enter", "move", "leave"].indexOf(event) >= 0;

          // there is no animation at the current moment, however
          // these runner methods will get later updated with the
          // methods leading into the driver's end/cancel methods
          // for now they just stop the animation from starting
          let runner = new $$AnimateRunner({
            end: function () {
              close();
            },
            cancel: function () {
              close(true);
            },
          });

          if (!drivers.length) {
            close();
            return runner;
          }

          let classes = mergeClasses(
            element.attr("class"),
            mergeClasses(options.addClass, options.removeClass),
          );
          let tempClasses = options.tempClasses;
          if (tempClasses) {
            classes += " " + tempClasses;
            options.tempClasses = null;
          }

          if (isStructural) {
            element.data(
              PREPARE_CLASSES_KEY,
              "ng-" + event + PREPARE_CLASS_SUFFIX,
            );
          }

          setRunner(element, runner);

          animationQueue.push({
            // this data is used by the postDigest code and passed into
            // the driver step function
            element: element,
            classes: classes,
            event: event,
            structural: isStructural,
            options: options,
            beforeStart: beforeStart,
            close: close,
          });

          element.on("$destroy", handleDestroyedElement);

          // we only want there to be one function called within the post digest
          // block. This way we can group animations for all the animations that
          // were apart of the same postDigest flush call.
          if (animationQueue.length > 1) return runner;

          $rootScope.$$postDigest(function () {
            let animations = [];
            forEach(animationQueue, function (entry) {
              // the element was destroyed early on which removed the runner
              // form its storage. This means we can't animate this element
              // at all and it already has been closed due to destruction.
              if (getRunner(entry.element)) {
                animations.push(entry);
              } else {
                entry.close();
              }
            });

            // now any future animations will be in another postDigest
            animationQueue.length = 0;

            let groupedAnimations = groupAnimations(animations);
            let toBeSortedAnimations = [];

            forEach(groupedAnimations, function (animationEntry) {
              let element = animationEntry.from
                ? animationEntry.from.element
                : animationEntry.element;
              let extraClasses = options.addClass;

              extraClasses =
                (extraClasses ? extraClasses + " " : "") + NG_ANIMATE_CLASSNAME;
              let cacheKey = $$animateCache.cacheKey(
                element[0],
                animationEntry.event,
                extraClasses,
                options.removeClass,
              );

              toBeSortedAnimations.push({
                element: element,
                domNode: getDomNode(element),
                fn: function triggerAnimationStart() {
                  let startAnimationFn,
                    closeFn = animationEntry.close;

                  // in the event that we've cached the animation status for this element
                  // and it's in fact an invalid animation (something that has duration = 0)
                  // then we should skip all the heavy work from here on
                  if (
                    $$animateCache.containsCachedAnimationWithoutDuration(
                      cacheKey,
                    )
                  ) {
                    closeFn();
                    return;
                  }

                  // it's important that we apply the `ng-animate` CSS class and the
                  // temporary classes before we do any driver invoking since these
                  // CSS classes may be required for proper CSS detection.
                  animationEntry.beforeStart();

                  // in the event that the element was removed before the digest runs or
                  // during the RAF sequencing then we should not trigger the animation.
                  let targetElement = animationEntry.anchors
                    ? animationEntry.from.element || animationEntry.to.element
                    : animationEntry.element;

                  if (getRunner(targetElement)) {
                    let operation = invokeFirstDriver(animationEntry);
                    if (operation) {
                      startAnimationFn = operation.start;
                    }
                  }

                  if (!startAnimationFn) {
                    closeFn();
                  } else {
                    let animationRunner = startAnimationFn();
                    animationRunner.done(function (status) {
                      closeFn(!status);
                    });
                    updateAnimationRunners(animationEntry, animationRunner);
                  }
                },
              });
            });

            // we need to sort each of the animations in order of parent to child
            // relationships. This ensures that the child classes are applied at the
            // right time.
            let finalAnimations = sortAnimations(toBeSortedAnimations);
            for (let i = 0; i < finalAnimations.length; i++) {
              let innerArray = finalAnimations[i];
              for (let j = 0; j < innerArray.length; j++) {
                let entry = innerArray[j];
                let element = entry.element;

                // the RAFScheduler code only uses functions
                finalAnimations[i][j] = entry.fn;

                // the first row of elements shouldn't have a prepare-class added to them
                // since the elements are at the top of the animation hierarchy and they
                // will be applied without a RAF having to pass...
                if (i === 0) {
                  element.removeData(PREPARE_CLASSES_KEY);
                  continue;
                }

                let prepareClassName = element.data(PREPARE_CLASSES_KEY);
                if (prepareClassName) {
                  $$jqLite.addClass(element, prepareClassName);
                }
              }
            }

            $$rAFScheduler(finalAnimations);
          });

          return runner;

          // TODO(matsko): change to reference nodes
          function getAnchorNodes(node) {
            let SELECTOR = "[" + NG_ANIMATE_REF_ATTR + "]";
            let items = node.hasAttribute(NG_ANIMATE_REF_ATTR)
              ? [node]
              : node.querySelectorAll(SELECTOR);
            let anchors = [];
            forEach(items, function (node) {
              let attr = node.getAttribute(NG_ANIMATE_REF_ATTR);
              if (attr && attr.length) {
                anchors.push(node);
              }
            });
            return anchors;
          }

          function groupAnimations(animations) {
            let preparedAnimations = [];
            let refLookup = {};
            forEach(animations, function (animation, index) {
              let element = animation.element;
              let node = getDomNode(element);
              let event = animation.event;
              let enterOrMove = ["enter", "move"].indexOf(event) >= 0;
              let anchorNodes = animation.structural
                ? getAnchorNodes(node)
                : [];

              if (anchorNodes.length) {
                let direction = enterOrMove ? "to" : "from";

                forEach(anchorNodes, function (anchor) {
                  let key = anchor.getAttribute(NG_ANIMATE_REF_ATTR);
                  refLookup[key] = refLookup[key] || {};
                  refLookup[key][direction] = {
                    animationID: index,
                    element: jqLite(anchor),
                  };
                });
              } else {
                preparedAnimations.push(animation);
              }
            });

            let usedIndicesLookup = {};
            let anchorGroups = {};
            forEach(refLookup, function (operations, key) {
              let from = operations.from;
              let to = operations.to;

              if (!from || !to) {
                // only one of these is set therefore we can't have an
                // anchor animation since all three pieces are required
                let index = from ? from.animationID : to.animationID;
                let indexKey = index.toString();
                if (!usedIndicesLookup[indexKey]) {
                  usedIndicesLookup[indexKey] = true;
                  preparedAnimations.push(animations[index]);
                }
                return;
              }

              let fromAnimation = animations[from.animationID];
              let toAnimation = animations[to.animationID];
              let lookupKey = from.animationID.toString();
              if (!anchorGroups[lookupKey]) {
                let group = (anchorGroups[lookupKey] = {
                  structural: true,
                  beforeStart: function () {
                    fromAnimation.beforeStart();
                    toAnimation.beforeStart();
                  },
                  close: function () {
                    fromAnimation.close();
                    toAnimation.close();
                  },
                  classes: cssClassesIntersection(
                    fromAnimation.classes,
                    toAnimation.classes,
                  ),
                  from: fromAnimation,
                  to: toAnimation,
                  anchors: [], // TODO(matsko): change to reference nodes
                });

                // the anchor animations require that the from and to elements both have at least
                // one shared CSS class which effectively marries the two elements together to use
                // the same animation driver and to properly sequence the anchor animation.
                if (group.classes.length) {
                  preparedAnimations.push(group);
                } else {
                  preparedAnimations.push(fromAnimation);
                  preparedAnimations.push(toAnimation);
                }
              }

              anchorGroups[lookupKey].anchors.push({
                out: from.element,
                in: to.element,
              });
            });

            return preparedAnimations;
          }

          function cssClassesIntersection(a, b) {
            a = a.split(" ");
            b = b.split(" ");
            let matches = [];

            for (let i = 0; i < a.length; i++) {
              let aa = a[i];
              if (aa.substring(0, 3) === "ng-") continue;

              for (let j = 0; j < b.length; j++) {
                if (aa === b[j]) {
                  matches.push(aa);
                  break;
                }
              }
            }

            return matches.join(" ");
          }

          function invokeFirstDriver(animationDetails) {
            // we loop in reverse order since the more general drivers (like CSS and JS)
            // may attempt more elements, but custom drivers are more particular
            for (let i = drivers.length - 1; i >= 0; i--) {
              let driverName = drivers[i];
              let factory = $injector.get(driverName);
              let driver = factory(animationDetails);
              if (driver) {
                return driver;
              }
            }
          }

          function beforeStart() {
            tempClasses =
              (tempClasses ? tempClasses + " " : "") + NG_ANIMATE_CLASSNAME;
            $$jqLite.addClass(element, tempClasses);

            let prepareClassName = element.data(PREPARE_CLASSES_KEY);
            if (prepareClassName) {
              $$jqLite.removeClass(element, prepareClassName);
              prepareClassName = null;
            }
          }

          function updateAnimationRunners(animation, newRunner) {
            if (animation.from && animation.to) {
              update(animation.from.element);
              update(animation.to.element);
            } else {
              update(animation.element);
            }

            function update(element) {
              let runner = getRunner(element);
              if (runner) runner.setHost(newRunner);
            }
          }

          function handleDestroyedElement() {
            let runner = getRunner(element);
            if (runner && (event !== "leave" || !options.$$domOperationFired)) {
              runner.end();
            }
          }

          function close(rejected) {
            element.off("$destroy", handleDestroyedElement);
            removeRunner(element);

            applyAnimationClasses(element, options);
            applyAnimationStyles(element, options);
            options.domOperation();

            if (tempClasses) {
              $$jqLite.removeClass(element, tempClasses);
            }

            runner.complete(!rejected);
          }
        };
      },
    ];
  },
];
