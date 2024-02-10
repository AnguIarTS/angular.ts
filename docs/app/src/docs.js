

angular.module('DocsController', ['currentVersionData'])

.controller('DocsController', [
          '$scope', '$rootScope', '$location', '$window', '$cookies',
              'NG_PAGES', 'NG_NAVIGATION', 'CURRENT_NG_VERSION',
  function($scope, $rootScope, $location, $window, $cookies,
              NG_PAGES, NG_NAVIGATION, CURRENT_NG_VERSION) {

  const errorPartialPath = 'Error404.html';

  $scope.navClass = function(navItem) {
    return {
      active: navItem.href && this.currentPage && this.currentPage.path,
      current: this.currentPage && this.currentPage.path === navItem.href,
      'nav-index-section': navItem.type === 'section'
    };
  };

  $scope.$on('$includeContentLoaded', () => {
    const pagePath = $scope.currentPage ? $scope.currentPage.path : $location.path();
    $window._gaq.push(['_trackPageview', pagePath]);
    $scope.loading = false;
  });

  $scope.$on('$includeContentError', () => {
    $scope.loading = false;
    $scope.loadingError = true;
  });

  $scope.$watch(() => $location.path(), (path) => {

    path = path.replace(/^\/?(.+?)(\/index)?\/?$/, '$1');

    const currentPage = $scope.currentPage = NG_PAGES[path];

    $scope.loading = true;
    $scope.loadingError = false;

    if (currentPage) {
      $scope.partialPath = `partials/${  path  }.html`;
      $scope.currentArea = NG_NAVIGATION[currentPage.area];
      const pathParts = currentPage.path.split('/');
      const breadcrumb = $scope.breadcrumb = [];
      let breadcrumbPath = '';
      angular.forEach(pathParts, (part) => {
        breadcrumbPath += part;
        breadcrumb.push({ name: (NG_PAGES[breadcrumbPath] && NG_PAGES[breadcrumbPath].name) || part, url: breadcrumbPath });
        breadcrumbPath += '/';
      });
    } else {
      $scope.currentArea = NG_NAVIGATION.api;
      $scope.breadcrumb = [];
      $scope.partialPath = errorPartialPath;
    }
  });

  $scope.hasError = function() {
    return $scope.partialPath === errorPartialPath || $scope.loadingError;
  };

  /** ********************************
   Initialize
   ********************************** */

  $scope.versionNumber = CURRENT_NG_VERSION.full;
  $scope.version = `${CURRENT_NG_VERSION.full  } ${  CURRENT_NG_VERSION.codeName}`;
  $scope.loading = false;
  $scope.loadingError = false;

  const INDEX_PATH = /^(\/|\/index[^.]*.html)$/;
  if (!$location.path() || INDEX_PATH.test($location.path())) {
    $location.path('/api').replace();
  }

}]);
