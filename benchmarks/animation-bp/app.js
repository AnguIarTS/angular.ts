

angular
  .module('animationBenchmark', ['ngAnimate'], config)
  .controller('BenchmarkController', BenchmarkController);

// Functions - Definitions
function config($compileProvider) {
  $compileProvider
    .commentDirectivesEnabled(false)
    .cssClassDirectivesEnabled(false)
    .debugInfoEnabled(false);
}

function BenchmarkController($scope) {
  let self = this;
  let itemCount = 1000;
  let items = (new Array(itemCount + 1)).join('.').split('');

  benchmarkSteps.push({
    name: 'create',
    fn: function() {
      $scope.$apply(function() {
        self.items = items;
      });
    }
  });

  benchmarkSteps.push({
    name: '$digest',
    fn: function() {
      $scope.$root.$digest();
    }
  });

  benchmarkSteps.push({
    name: 'destroy',
    fn: function() {
      $scope.$apply(function() {
        self.items = [];
      });
    }
  });
}
