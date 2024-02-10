

angular.
  module('test', []).
  run(($rootScope) => {
    $rootScope.jqueryVersion = window.angular.element().jquery || 'jqLite';
  });
