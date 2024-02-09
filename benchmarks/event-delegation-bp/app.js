

let app = angular.module('eventDelegationBenchmark', []);

app.directive('noopDir', function() {
  return {
    compile: function($element, $attrs) {
      return function($scope, $element) {
        return 1;
      };
    }
  };
});

app.directive('nativeClick', ['$parse', function($parse) {
  return {
    compile: function($element, $attrs) {
      $parse($attrs.tstEvent);
      return function($scope, $element) {
        $element[0].addEventListener('click', function() {
          console.log('clicked');
        }, false);
      };
    }
  };
}]);

app.directive('dlgtClick', function() {
  return {
    compile: function($element, $attrs) {
      // We don't setup the global event listeners as the costs are small and one time only...
    }
  };
});

app.controller('DataController', function DataController($rootScope) {
  this.ngRepeatCount = 1000;
  this.rows = [];
  let self = this;

  benchmarkSteps.push({
    name: '$apply',
    fn: function() {
      let oldRows = self.rows;
      $rootScope.$apply(function() {
        self.rows = [];
      });
      self.rows = oldRows;
      if (self.rows.length !== self.ngRepeatCount) {
        self.rows = [];
        for (let i = 0; i < self.ngRepeatCount; i++) {
          self.rows.push('row' + i);
        }
      }
      $rootScope.$apply();
    }
  });
});
