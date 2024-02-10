

angular.
  module('test', []).
  controller('TestController', ($anchorScroll, $location, $scope) => {
    $scope.scrollTo = function(target) {
      // Set `$location.hash()` to `target` and
      // `$anchorScroll` will detect the change and scroll
      $location.hash(target);
    };
  });
