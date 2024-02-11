const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const semver = require("semver");
const _ = require("lodash");

const process = require("process");
// We are only interested in whether this environment variable exists, hence the !!
const NO_REMOTE_REQUESTS = !!process.env.NG1_BUILD_NO_REMOTE_VERSION_REQUESTS;
const versionSource = NO_REMOTE_REQUESTS ? "local" : "remote";

let currentPackage;
let previousVersions;
let cdnVersion;

/**
 * Load information about this project from the package.json
 * @return {Object} The package information
 */
const getPackage = function () {
  // Search up the folder hierarchy for the first package.json
  let packageFolder = path.resolve(".");
  while (!fs.existsSync(path.join(packageFolder, "package.json"))) {
    const parent = path.dirname(packageFolder);
    if (parent === packageFolder) {
      break;
    }
    packageFolder = parent;
  }
  return JSON.parse(
    fs.readFileSync(path.join(packageFolder, "package.json"), "UTF-8"),
  );
};

/**
 * Parse the github URL for useful information
 * @return {Object} An object containing the github owner and repository name
 */
const getGitRepoInfo = function () {
  const GITURL_REGEX = /^https:\/\/github.com\/([^/]+)\/(.+).git$/;
  const match = GITURL_REGEX.exec(currentPackage.repository.url);
  const git = {
    owner: match[1],
    repo: match[2],
  };
  return git;
};

/**
 * Extract the code name from the tagged commit's message - it should contain the text of the form:
 * "codename(some-code-name)"
 * @param  {String} tagName Name of the tag to look in for the codename
 * @return {String}         The codename if found, otherwise null/undefined
 */
const getCodeName = function (tagName) {
  const gitCatOutput = shell.exec(`git cat-file -p ${tagName}`, {
    silent: true,
  }).stdout;
  const tagMessage = gitCatOutput.match(/^.*codename.*$/gm)[0];
  const codeName = tagMessage && tagMessage.match(/codename\((.*)\)/)[1];
  if (!codeName) {
    throw new Error(
      `Could not extract release code name. The message of tag ${tagName} must match '*codename(some release name)*'`,
    );
  }
  return codeName;
};

/**
 * Compute a build segment for the version, from the CI build number and current commit SHA
 * @return {String} The build segment of the version
 */
function getBuild() {
  const hash = shell
    .exec("git rev-parse --short HEAD", { silent: true })
    .stdout.replace("\n", "");
  return `sha.${hash}`;
}

function checkBranchPattern(version, branchPattern) {
  // check that the version starts with the branch pattern minus its asterisk
  // e.g. branchPattern = '1.6.*'; version = '1.6.0-rc.0' => '1.6.' === '1.6.'
  return (
    version.slice(0, branchPattern.length - 1) ===
    branchPattern.replace("*", "")
  );
}

/**
 * If the current commit is tagged as a version get that version
 * @return {SemVer} The version or null
 */
const getTaggedVersion = function () {
  const gitTagResult = shell.exec("git describe --exact-match", {
    silent: true,
  });

  if (gitTagResult.code === 0) {
    const tag = gitTagResult.stdout.trim();
    const version = semver.parse(tag);

    if (
      version &&
      checkBranchPattern(version.version, currentPackage.branchPattern)
    ) {
      version.codeName = getCodeName(tag);
      version.full = version.version;
      version.branch = `v${currentPackage.branchPattern.replace("*", "x")}`;
      return version;
    }
  }

  return null;
};

/**
 * Get a collection of all the previous versions sorted by semantic version
 * @return {Array.<SemVer>} The collection of previous versions
 */
const getPreviousVersions = function () {
  // If we are allowing remote requests then use the remote tags as the local clone might
  // not contain all commits when cloned with git clone --depth=...
  // Otherwise just use the tags in the local repository
  const repo_url = currentPackage.repository.url;
  const query = NO_REMOTE_REQUESTS
    ? "git tag"
    : `git ls-remote --tags ${repo_url}`;
  const tagResults = shell.exec(query, { silent: true });
  if (tagResults.code === 0) {
    return _(tagResults.stdout.match(/v[0-9].*[0-9]$/gm))
      .map((tag) => {
        const version = semver.parse(tag);
        return version;
      })
      .filter()
      .map((version) => {
        // angular.js didn't follow semantic version until 1.20rc1
        if (
          (version.major === 1 &&
            version.minor === 0 &&
            version.prerelease.length > 0) ||
          (version.major === 1 &&
            version.minor === 2 &&
            version.prerelease[0] === "rc1")
        ) {
          version.version =
            [version.major, version.minor, version.patch].join(".") +
            version.prerelease.join("");
          version.raw = `v${version.version}`;
        }
        version.docsUrl = `http://code.angularjs.org/${version.version}/docs`;
        // Versions before 1.0.2 had a different docs folder name
        if (
          version.major < 1 ||
          (version.major === 1 && version.minor === 0 && version.patch < 2)
        ) {
          version.docsUrl += `-${version.version}`;
          version.isOldDocsUrl = true;
        }
        return version;
      })
      .sort(semver.compare)
      .value();
  }
  return [];
};

const getCdnVersion = function () {
  return _(previousVersions)
    .filter((tag) => semver.satisfies(tag, currentPackage.branchVersion))
    .reverse()
    .reduce((cdnVersion, version) => {
      if (!cdnVersion) {
        if (NO_REMOTE_REQUESTS) {
          // We do not want to make any remote calls to the CDN so just use the most recent version
          cdnVersion = version;
        } else {
          // Note: need to use shell.exec and curl here
          // as version-infos returns its result synchronously...
          const cdnResult = shell.exec(
            `curl http://ajax.googleapis.com/ajax/libs/angularjs/${version}/angular.min.js ` +
              `--head --write-out "%{http_code}" -silent`,
            { silent: true },
          );
          if (cdnResult.code === 0) {
            // --write-out appends its content to the general request response, so extract it
            const statusCode = cdnResult.stdout.split("\n").pop().trim();
            if (statusCode === "200") {
              cdnVersion = version;
            }
          }
        }
      }
      return cdnVersion;
    }, null);
};

/**
 * Get the unstable snapshot version
 * @return {SemVer} The snapshot version
 */
const getSnapshotVersion = function () {
  let version = _(previousVersions)
    .filter((tag) => semver.satisfies(tag, currentPackage.branchVersion))
    .last();

  if (!version) {
    // a snapshot version before the first tag on the branch
    version = semver(currentPackage.branchPattern.replace("*", "0-beta.1"));
  }

  // We need to clone to ensure that we are not modifying another version
  version = semver(version.raw);

  const ciBuild = process.env.CIRCLE_BUILD_NUM || process.env.BUILD_NUMBER;
  if (!version.prerelease || !version.prerelease.length) {
    // last release was a non beta release. Increment the patch level to
    // indicate the next release that we will be doing.
    // E.g. last release was 1.3.0, then the snapshot will be
    // 1.3.1-build.1, which is lesser than 1.3.1 according to the semver!

    // If the last release was a beta release we don't update the
    // beta number by purpose, as otherwise the semver comparison
    // does not work any more when the next beta is released.
    // E.g. don't generate 1.3.0-beta.2.build.1
    // as this is bigger than 1.3.0-beta.2 according to semver
    version.patch++;
  }
  version.prerelease = ciBuild ? ["build", ciBuild] : ["local"];
  version.build = getBuild();
  version.codeName = "snapshot";
  version.isSnapshot = true;
  version.format();
  version.full = `${version.version}+${version.build}`;
  version.branch = "master";
  version.distTag = currentPackage.distTag;

  return version;
};

exports.currentPackage = currentPackage = getPackage();
exports.gitRepoInfo = getGitRepoInfo();
exports.previousVersions = previousVersions = getPreviousVersions();
exports.cdnVersion = cdnVersion = getCdnVersion();
exports.currentVersion = getTaggedVersion() || getSnapshotVersion();

if (NO_REMOTE_REQUESTS) {
  console.log(
    "==============================================================================================",
  );
  console.log("Running with no remote requests for version data:");
  console.log(
    ' - this is due to the "NG1_BUILD_NO_REMOTE_VERSION_REQUESTS" environment variable being defined.',
  );
  console.log(
    " - be aware that the generated docs may not have valid or the most recent version information.",
  );
  console.log(
    "==============================================================================================",
  );
}

console.log(
  `CDN version (${versionSource}):`,
  cdnVersion ? cdnVersion.raw : "No version found.",
);
console.log(`Current version (${versionSource}):`, exports.currentVersion.raw);
