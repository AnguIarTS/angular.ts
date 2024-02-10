export function $$RAFProvider() {
  // rAF
  this.$get = [
    "$window",
    "$timeout",
    function ($window, $timeout) {
      const requestAnimationFrame =
        $window.requestAnimationFrame || $window.webkitRequestAnimationFrame;

      const cancelAnimationFrame =
        $window.cancelAnimationFrame ||
        $window.webkitCancelAnimationFrame ||
        $window.webkitCancelRequestAnimationFrame;

      const rafSupported = !!requestAnimationFrame;
      const raf = rafSupported
        ? function (fn) {
            const id = requestAnimationFrame(fn);
            return function () {
              cancelAnimationFrame(id);
            };
          }
        : function (fn) {
            const timer = $timeout(fn, 16.66, false); // 1000 / 60 = 16.666
            return function () {
              $timeout.cancel(timer);
            };
          };

      raf.supported = rafSupported;

      return raf;
    },
  ];
}
