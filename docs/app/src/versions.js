
/* global console */

angular.module('versions', ['currentVersionData', 'allVersionsData'])

.directive('versionPicker', () => {
  return {
    restrict: 'E',
    scope: true,
    controllerAs: '$ctrl',
    controller: ['$location', '$window', 'CURRENT_NG_VERSION', 'ALL_NG_VERSIONS',
            /** @this VersionPickerController */
            function VersionPickerController($location, $window, CURRENT_NG_VERSION, ALL_NG_VERSIONS) {

      let versionStr = CURRENT_NG_VERSION.version;

      if (CURRENT_NG_VERSION.isSnapshot) {
        versionStr = CURRENT_NG_VERSION.distTag === 'latest' ? 'snapshot-stable' : 'snapshot';
      }

      this.versions  = ALL_NG_VERSIONS;
      this.selectedVersion = find(ALL_NG_VERSIONS, (value) => value.version.version === versionStr);

      this.jumpToDocsVersion = function(value) {
        const currentPagePath = $location.path().replace(/\/$/, '');
        $window.location = value.docsUrl + currentPagePath;
      };
    }],
    template:
      '<div class="picker version-picker">' +
      '  <select ng-options="v as v.label group by v.group for v in $ctrl.versions"' +
      '          ng-model="$ctrl.selectedVersion"' +
      '          ng-change="$ctrl.jumpToDocsVersion($ctrl.selectedVersion)"' +
      '          class="docs-version-jump">' +
      '  </select>' +
      '</div>'
  };

  function find(collection, matcherFn) {
    for (let i = 0, ii = collection.length; i < ii; ++i) {
      if (matcherFn(collection[i])) {
        return collection[i];
      }
    }
  }
});
