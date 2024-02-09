export function $$RAFProvider() {
  //rAF
  this.$get = [
    "$window",
    "$timeout",
    function ($window, $timeout) {
      let requestAnimationFrame =
        $window.requestAnimationFrame || $window.webkitRequestAnimationFrame;

      let cancelAnimationFrame =
        $window.cancelAnimationFrame ||
        $window.webkitCancelAnimationFrame ||
        $window.webkitCancelRequestAnimationFrame;

      let rafSupported = !!requestAnimationFrame;
      let raf = rafSupported
        ? function (fn) {
            let id = requestAnimationFrame(fn);
            return function () {
              cancelAnimationFrame(id);
            };
          }
        : function (fn) {
            let timer = $timeout(fn, 16.66, false); // 1000 / 60 = 16.666
            return function () {
              $timeout.cancel(timer);
            };
          };

      raf.supported = rafSupported;

      return raf;
    },
  ];
}
