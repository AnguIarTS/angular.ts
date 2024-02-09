

angular.
  module('test', []).
  config(function($httpProvider) {
    $httpProvider.interceptors.push(function($q) {
      return {
        request: function(config) {
          return $q(function(resolve) {
            window.setTimeout(resolve, 100, config);
          });
        },
        response: function(response) {
          return $q(function(resolve) {
            window.setTimeout(resolve, 100, response);
          });
        }
      };
    });
  }).
  controller('TestController', function($cacheFactory, $http, $scope) {
    let url = '/some/url';

    let cache = $cacheFactory('test');
    cache.put(url, 'Hello, world!');

    $http.
      get(url, {cache: cache}).
      then(function(response) { $scope.text = response.data; });
  });
