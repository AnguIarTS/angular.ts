/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngSwipeLeft
 *
 * @deprecated
 * sinceVersion="1.7.0"
 *
 * See the {@link ngTouch module} documentation for more information.
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * To disable the mouse click and drag functionality, add `ng-swipe-disable-mouse` to
 * the `ng-swipe-left` or `ng-swipe-right` DOM Element.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeLeftExample" deps="angular-touch.js" name="ng-swipe-left">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeLeftExample', ['ngTouch']);
      </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name ngSwipeRight
 *
 * @deprecated
 * sinceVersion="1.7.0"
 *
 * See the {@link ngTouch module} documentation for more information.
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeRightExample" deps="angular-touch.js" name="ng-swipe-right">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeRightExample', ['ngTouch']);
      </file>
    </example>
 */

function makeSwipeDirective(directiveName, direction, eventName) {
  ngTouch.directive(directiveName, [
    "$parse",
    "$swipe",
    function ($parse, $swipe) {
      // The maximum vertical delta for a swipe should be less than 75px.
      const MAX_VERTICAL_DISTANCE = 75;
      // Vertical distance should not be more than a fraction of the horizontal distance.
      const MAX_VERTICAL_RATIO = 0.3;
      // At least a 30px lateral motion is necessary for a swipe.
      const MIN_HORIZONTAL_DISTANCE = 30;

      return function (scope, element, attr) {
        const swipeHandler = $parse(attr[directiveName]);

        let startCoords;
        let valid;

        function validSwipe(coords) {
          // Check that it's within the coordinates.
          // Absolute vertical distance must be within tolerances.
          // Horizontal distance, we take the current X - the starting X.
          // This is negative for leftward swipes and positive for rightward swipes.
          // After multiplying by the direction (-1 for left, +1 for right), legal swipes
          // (ie. same direction as the directive wants) will have a positive delta and
          // illegal ones a negative delta.
          // Therefore this delta must be positive, and larger than the minimum.
          if (!startCoords) return false;
          const deltaY = Math.abs(coords.y - startCoords.y);
          const deltaX = (coords.x - startCoords.x) * direction;
          return (
            valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO
          );
        }

        const pointerTypes = ["touch"];
        if (!angular.isDefined(attr.ngSwipeDisableMouse)) {
          pointerTypes.push("mouse");
        }
        $swipe.bind(
          element,
          {
            start(coords, event) {
              startCoords = coords;
              valid = true;
            },
            cancel(event) {
              valid = false;
            },
            end(coords, event) {
              if (validSwipe(coords)) {
                scope.$apply(() => {
                  element.triggerHandler(eventName);
                  swipeHandler(scope, { $event: event });
                });
              }
            },
          },
          pointerTypes,
        );
      };
    },
  ]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective("ngSwipeLeft", -1, "swipeleft");
makeSwipeDirective("ngSwipeRight", 1, "swiperight");
