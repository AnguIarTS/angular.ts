

const app = angular.module('boostrapCompileBenchmark', []);

let commentDirectivesEnabled;
let cssClassDirectivesEnabled;

app.config(($compileProvider) => {
  $compileProvider.debugInfoEnabled(false);

  commentDirectivesEnabled = window.location.toString().indexOf('comment=disabled') === -1;
  cssClassDirectivesEnabled = window.location.toString().indexOf('css=disabled') === -1;

  $compileProvider
    .commentDirectivesEnabled(commentDirectivesEnabled)
    .cssClassDirectivesEnabled(cssClassDirectivesEnabled);
})
.controller('DataController', function DataController($compile, $http, $rootScope) {

  this.isEA = !commentDirectivesEnabled && !cssClassDirectivesEnabled;
  this.isEAC = !commentDirectivesEnabled && cssClassDirectivesEnabled;
  this.isEAM = commentDirectivesEnabled && !cssClassDirectivesEnabled;
  this.isEACM = commentDirectivesEnabled && cssClassDirectivesEnabled;

  this.repeats = 50;

  this.templates = [
    'bootstrap-carousel.tpl.html',
    'bootstrap-theme.tpl.html'
  ];

  this.html = null;
  this.loadTemplate = function() {
    this.html = null;
    $http.get(window.location.pathname + this.selectedTemplate)
      .then((response) => { this.html = response.data; });
  };

  this.selectedTemplate = this.templates[0];
  this.loadTemplate();


  const linkers = [];
  benchmarkSteps.push({
    name: 'create',
    fn: function() {
      for (let i = 0; i < this.repeats; i++) {
        const linker = $compile(this.html);
        linkers.push(linker);
      }
    }.bind(this)
  });

  benchmarkSteps.push({
    name: 'destroy',
    fn() {
      linkers.length = 0;
    }
  });

});
