

let exec = require('shelljs').exec;
let semver = require('semver');

/**
 * @dgProcessor generateVersionDocProcessor
 * @description
 * This processor will create a new doc that will be rendered as a JavaScript file
 * containing meta information about the current versions of AngularJS
 */
module.exports = function generateVersionDocProcessor(gitData) {
  return {
    $runAfter: ['generatePagesDataProcessor'],
    $runBefore: ['rendering-docs'],
    // Remove rogue builds that are in the npm repository but not on code.angularjs.org
    ignoredBuilds: ['1.3.4-build.3588'],
    $process: function(docs) {

      let ignoredBuilds = this.ignoredBuilds;
      let currentVersion = require('../../../build/version.json');
      let output = exec('yarn info angular versions --json', { silent: true }).stdout.split('\n')[0];
      let allVersions = processAllVersionsResponse(JSON.parse(output).data);

      docs.push({
        docType: 'current-version-data',
        id: 'current-version-data',
        template: 'angular-service.template.js',
        outputPath: 'js/current-version-data.js',
        ngModuleName: 'currentVersionData',
        serviceName: 'CURRENT_NG_VERSION',
        serviceValue: currentVersion
      });

      docs.push({
        docType: 'allversions-data',
        id: 'allversions-data',
        template: 'angular-service.template.js',
        outputPath: 'js/all-versions-data.js',
        ngModuleName: 'allVersionsData',
        serviceName: 'ALL_NG_VERSIONS',
        serviceValue: allVersions
      });


      function processAllVersionsResponse(versions) {

        let latestMap = {};

        // When the docs are built on a tagged commit, yarn info won't include the latest release,
        // so we add it manually based on the local version.json file.
        let missesCurrentVersion = !currentVersion.isSnapshot && !versions.find(function(version) {
          return version === currentVersion.version;
        });

        if (missesCurrentVersion) versions.push(currentVersion.version);

        versions = versions
            .filter(function(versionStr) {
              return ignoredBuilds.indexOf(versionStr) === -1;
            })
            .map(function(versionStr) {
              return semver.parse(versionStr);
            })
            .filter(function(version) {
              return version && version.major > 0;
            })
            .map(function(version) {
              let key = version.major + '.' + version.minor;
              let latest = latestMap[key];
              if (!latest || version.compare(latest) > 0) {
                latestMap[key] = version;
              }
              return version;
            })
            .map(function(version) {
              return makeOption(version);
            })
            .reverse();

        // List the latest version for each branch
        let latest = sortObject(latestMap, reverse(semver.compare))
            .map(function(version) { return makeOption(version, 'Latest'); });

        // Get the stable release with the highest version
        let highestStableRelease = versions.find(semverIsStable);

        // Generate master and stable snapshots
        let snapshots = [
          makeOption(
            {version: 'snapshot'},
            'Latest',
            'master-snapshot'
          ),
          makeOption(
            {version: 'snapshot-stable'},
            'Latest',
            createSnapshotStableLabel(highestStableRelease)
          )
        ];

        return snapshots
            .concat(latest)
            .concat(versions);
      }

      function makeOption(version, group, label) {
        return {
          version: version,
          label: label || 'v' + version.raw,
          group: group || 'v' + version.major + '.' + version.minor,
          docsUrl: createDocsUrl(version)
        };
      }

      function createDocsUrl(version) {
        let url = 'https://code.angularjs.org/' + version.version + '/docs';
        // Versions before 1.0.2 had a different docs folder name
        if (version.major === 1 && version.minor === 0 && version.patch < 2) {
          url += '-' + version.version;
        }
        return url;
      }

      function reverse(fn) {
        return function(left, right) { return -fn(left, right); };
      }

      function sortObject(obj, cmp) {
        return Object.keys(obj).map(function(key) { return obj[key]; }).sort(cmp);
      }

      // Adapted from
      // https://github.com/kaelzhang/node-semver-stable/blob/34dd29842409295d49889d45871bec55a992b7f6/index.js#L25
      function semverIsStable(version) {
        let semverObj = version.version;
        return semverObj === null ? false : !semverObj.prerelease.length;
      }

      function createSnapshotStableLabel(version) {
        let label = version.label.replace(/.$/, 'x') + '-snapshot';

        return label;
      }
    }
  };
};
