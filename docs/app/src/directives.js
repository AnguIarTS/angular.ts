

const directivesModule = angular.module('directives', []);

directivesModule
/**
 * backToTop Directive
 * @param  {Function} $anchorScroll
 *
 * @description Ensure that the browser scrolls when the anchor is clicked
 */
.directive('backToTop', ['$anchorScroll', '$location', function($anchorScroll, $location) {
  return function link(scope, element) {
    element.on('click', (event) => {
      $location.hash('');
      scope.$apply($anchorScroll);
    });
  };
}])


.directive('code', () => ({
    restrict: 'E',
    terminal: true,
    compile(element) {
      const linenums = element.hasClass('linenum');// || element.parent()[0].nodeName === 'PRE';
      const match = /lang-(\S+)/.exec(element[0].className);
      const lang = match && match[1];
      const html = element.html();
      element.html(window.prettyPrintOne(html, lang, linenums));
    }
  }))

.directive('scrollYOffsetElement', ['$anchorScroll', function($anchorScroll) {
  return function(scope, element) {
    $anchorScroll.yOffset = element;
  };
}])

.directive('table', () => ({
    restrict: 'E',
    link(scope, element, attrs) {
      if (!attrs.class) {
        element.addClass('table table-bordered table-striped code-table');
      }
    }
  }))

.directive('tocCollector', ['$rootScope', function($rootScope) {
  return {
    controller: ['$element', function($element) {
      /* eslint-disable no-invalid-this */
      const ctrl = this;

      $rootScope.$on('$includeContentRequested', () => {
        ctrl.hs = [];
        ctrl.root = [];
      });

      this.hs = [];
      this.root = [];
      this.element = $element;

      this.register = function(h) {
        let previousLevel;

        for (let i = ctrl.hs.length - 1; i >= 0; i--) {
          if (ctrl.hs[i].level === (h.level - 1)) {
            previousLevel = ctrl.hs[i];
            break;
          }
        }

        if (previousLevel) {
          previousLevel.children.push(h);
        } else {
          this.root.push(h);
        }

        ctrl.hs.push(h);
        /* eslint-enable no-invalid-this */
      };
    }]
  };
}])

.component('tocTree', {
  template: '<ul>' +
      '<li ng-repeat="item in $ctrl.items">' +
        '<a ng-href="{{ $ctrl.path }}#{{item.fragment}}">{{item.title}}</a>' +
        '<toc-tree ng-if="::item.children.length > 0" items="item.children"></toc-tree>' +
      '</li>' +
    '</ul>',
  bindings: {
    items: '<'
  },
  controller: ['$location', /** @this */ function($location) {
    this.path = $location.path().replace(/^\/?(.+?)(\/index)?\/?$/, '$1');
  }]
})
.directive('tocContainer', () => ({
    scope: true,
    restrict: 'E',
    require: {
      tocContainer: '',
      tocCollector: '^^'
    },
    controller() {
      this.showToc = true;
      this.items = [];
    },
    controllerAs: '$ctrl',
    link(scope, element, attrs, ctrls) {
      ctrls.tocContainer.items = ctrls.tocCollector.root;
    },
    template: '<div ng-if="::$ctrl.items.length > 1">' +
      '<b>Contents</b>' +
      '<button class="btn" ng-click="$ctrl.showToc = !$ctrl.showToc">{{$ctrl.showToc ? \'Hide\' : \'Show\'}}</button><br>' +
      '<toc-tree items="$ctrl.items" ng-show="$ctrl.showToc"></toc-tree>' +
      '</div>'
  }))
.directive('header', () => ({
    restrict: 'E',
    controller: ['$element', function($element) {
      // eslint-disable-next-line no-invalid-this
      this.element = $element;
    }]
  }))
.directive('h1', ['$compile', function($compile) {
  return {
    restrict: 'E',
    require: {
      tocCollector: '^^?',
      header: '^^?'
    },
    link(scope, element, attrs, ctrls) {
      if (!ctrls.tocCollector) return;

      const tocContainer = angular.element('<toc-container></toc-container>');
      const containerElement = ctrls.header ? ctrls.header.element : element;

      containerElement.after(tocContainer);
      $compile(tocContainer)(scope);
    }
  };
}]);

for (let i = 2; i <= 5; i++) {
  registerHDirective(i);
}

function registerHDirective(i) {
  directivesModule.directive(`h${  i}`, () => ({
      restrict: 'E',
      require: {
        'tocCollector': '^^?'
      },
      link(scope, element, attrs, ctrls) {
        const toc = ctrls.tocCollector;

        if (!toc || !attrs.id) return;

        toc.register({
          level: i,
          fragment: attrs.id,
          title: element.text(),
          children: []
        });

      }
    }));
}

