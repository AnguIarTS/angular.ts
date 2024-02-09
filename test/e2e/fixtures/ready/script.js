

let beforeReady;
(function() {
  let divAfterScripts = window.document.getElementById('div-after-scripts');
  beforeReady = divAfterScripts && divAfterScripts.textContent;
})();

let afterReady;
angular.element(function() {
  let divAfterScripts = window.document.getElementById('div-after-scripts');
  afterReady = divAfterScripts && divAfterScripts.textContent;
});

let afterReadyMethod;
angular.element(window.document).ready(function() {
  let divAfterScripts = window.document.getElementById('div-after-scripts');
  afterReadyMethod = divAfterScripts && divAfterScripts.textContent;
});

let afterReadySync = afterReady;
let afterReadyMethodSync = afterReadyMethod;

angular
  .module('test', [])
  .run(function($rootScope) {
    $rootScope.beforeReady = beforeReady;
    $rootScope.afterReady = afterReady;
    $rootScope.afterReadySync = afterReadySync;
    $rootScope.afterReadyMethod = afterReadyMethod;
    $rootScope.afterReadyMethodSync = afterReadyMethodSync;
  });
