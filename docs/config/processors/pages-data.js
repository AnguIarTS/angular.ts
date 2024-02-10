

const _ = require('lodash');
const path = require('canonical-path');

const AREA_NAMES = {
  api: 'API',
  guide: 'Developer Guide',
  misc: 'Miscellaneous',
  tutorial: 'Tutorial',
  error: 'Error Reference'
};

function getNavGroup(pages, area, pageSorter, pageMapper) {

  const navItems = _(pages)
    // We don't want the child to include the index page as this is already catered for
    .omit((page) => page.id === 'index')

    // Apply the supplied sorting function
    .sortBy(pageSorter)

    // Apply the supplied mapping function
    .map(pageMapper)

    .value();

  return {
    name: area.name,
    type: 'group',
    href: area.id,
    navItems
  };
}


/**
 * @dgProcessor generatePagesDataProcessor
 * @description
 * This processor will create a new doc that will be rendered as a JavaScript file
 * containing meta information about the pages and navigation
 */
module.exports = function generatePagesDataProcessor(log) {


  const navGroupMappers = {
    api(areaPages, area) {
      const navGroups = _(areaPages)
        .filter('module') // We are not interested in docs that are not in a module

        .groupBy('module')

        .map((modulePages, moduleName) => {
          log.debug(`moduleName: ${  moduleName}`);
          const navItems = [];
          let modulePage;

          _(modulePages)

            .groupBy('docType')

            .tap((docTypes) => {
              log.debug(moduleName, _.keys(docTypes));
              // Extract the module page from the collection
              modulePage = docTypes.module[0];
              delete docTypes.module;
            })

            .tap((docTypes) => {
              if (docTypes.input) {
                docTypes.directive = docTypes.directive || [];
                // Combine input docTypes into directive docTypes
                docTypes.directive = docTypes.directive.concat(docTypes.input);
                delete docTypes.input;
              }
            })

            .forEach((sectionPages, sectionName) => {

              sectionPages = _.sortBy(sectionPages, 'name');

              if (sectionPages.length > 0) {
                // Push a navItem for this section
                navItems.push({
                  name: sectionName,
                  type: 'section',
                  href: path.dirname(sectionPages[0].path)
                });

                // Push the rest of the sectionPages for this section
                _.forEach(sectionPages, (sectionPage) => {

                  navItems.push({
                    name: sectionPage.name,
                    href: sectionPage.path,
                    type: sectionPage.docType
                  });

                });
              }
            });
          return {
            name: moduleName,
            href: modulePage.path,
            type: 'group',
            navItems
          };
        })
        .value();
      return navGroups;
    },
    tutorial(pages, area) {
      return [getNavGroup(pages, area, 'step', (page) => ({
          name: page.name,
          step: page.step,
          href: page.path,
          type: 'tutorial'
        }))];
    },
    error(pages, area) {
      return [getNavGroup(pages, area, 'path', (page) => ({
          name: page.name,
          href: page.path,
          type: page.docType === 'errorNamespace' ? 'section' : 'error'
        }))];
    },
    pages(pages, area) {
      return [getNavGroup(
        pages,
        area,
        (page) => page.sortOrder || page.path,
        (page) => ({
            name: page.name,
            href: page.path,
            type: 'page'
          })
      )];
    }
  };

  return {
    $runAfter: ['paths-computed', 'generateKeywordsProcessor'],
    $runBefore: ['rendering-docs'],
    $process(docs) {

      // We are only interested in docs that are in an area
      const pages = _.filter(docs, (doc) => doc.area);

      // We are only interested in pages that are not landing pages
      const navPages = _.filter(pages, (page) => page.docType !== 'componentGroup');

      // Generate an object collection of pages that is grouped by area e.g.
      // - area "api"
      //  - group "ng"
      //    - section "directive"
      //    - ngApp
      //    - ngBind
      //    - section "global"
      //    - angular.element
      //    - angular.bootstrap
      //    - section "service"
      //    - $compile
      //  - group "ngRoute"
      //    - section "directive"
      //    - ngView
      //    - section "service"
      //    - $route
      //
      const areas = {};
      _(navPages)
        .groupBy('area')
        .forEach((pages, areaId) => {
          const area = {
            id: areaId,
            name: AREA_NAMES[areaId]
          };
          areas[areaId] = area;

          const navGroupMapper = navGroupMappers[area.id] || navGroupMappers.pages;
          area.navGroups = navGroupMapper(pages, area);
        });

      docs.push({
        docType: 'nav-data',
        id: 'nav-data',
        template: 'nav-data.template.js',
        outputPath: 'js/nav-data.js',
        areas
      });



      const searchData = _(pages)
        .filter((page) => page.searchTerms)
        .map((page) => _.extend({ path: page.path }, page.searchTerms))
        .value();

      docs.push({
        docType: 'json-doc',
        id: 'search-data-json',
        template: 'json-doc.template.json',
        outputPath: 'js/search-data.json',
        data: searchData
      });

      // Extract a list of basic page information for mapping paths to partials and for client side searching
      const pageData = _(docs)
        .map((doc) => _.pick(doc, ['name', 'area', 'path']))
        .keyBy('path')
        .value();

      docs.push({
        docType: 'pages-data',
        id: 'pages-data',
        template: 'pages-data.template.js',
        outputPath: 'js/pages-data.js',
        pages: pageData
      });
    }
  };
};
