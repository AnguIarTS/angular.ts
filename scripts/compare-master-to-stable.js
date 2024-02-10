#!/usr/bin/env node



const util = require('util');
const cp = require('child_process');

const Q = require('q');
const _ = require('lodash');
const semver = require('semver');

const exec = function(cmd) {
  return function() {
    const args = Array.prototype.slice.call(arguments, 0);
    args.unshift(cmd);
    const fullCmd = util.format.apply(util, args);
    return Q.nfcall(cp.exec, fullCmd).then((out) => out[0].split('\n'));
  };
};

const andThen = function(fn, after) {
  return /** @this */ function() {
    return fn.apply(this, arguments).then(after);
  };
};

const oneArg = function(fn) {
  return function(arg) {
    return fn(arg);
  };
};

const oneLine = function(lines) {
  return lines[0].trim();
};

const noArgs = function(fn) {
  return function() {
    return fn();
  };
};

const identity = function(i) { return i; };

// like Q.all, but runs the commands in series
// useful for ensuring env state (like which branch is checked out)
const allInSeries = function(fn) {
  return function(args) {
    const results = [];
    let def;
    while (args.length > 0) {
      (function(arg) {
        if (def) {
          def = def.then(() => fn(arg));
        } else {
          def = fn(arg);
        }
        def = def.then((res) => {
          results.push(res);
        });
      })(args.pop());
    }
    return def.then(() => results);
  };
};

const compareBranches = function(left, right) {
  console.log(`# These commits are in ${  left.name  } but not in ${  right.name  }\n`);
  console.log(_(left.log).
    difference(right.log).
    map((line) => 
       left.full[left.log.indexOf(line)] // lol O(n^2)
    ).
    value().
    join('\n'));
};

const checkout = oneArg(exec('git checkout %s'));

const getCurrentBranch = andThen(noArgs(exec('git rev-parse --abbrev-ref HEAD')), oneLine);
const getTags = noArgs(exec('git tag'));
const getTheLog = oneArg(exec('git log --pretty=oneline %s..HEAD | cat'));

// remember this so we can restore state
let currentBranch;

getCurrentBranch().
then((branch) => {
  currentBranch = branch;
}).
then(getTags).
then((tags) => tags.
    filter(semver.valid).
    map(semver.clean).
    sort(semver.rcompare)).
then((tags) => {
  const {major} = semver(tags[0]);
  return tags.
    filter((ver) => semver(ver).major === major);
}).
then((tags) => _(tags).
    groupBy((tag) => tag.split('.')[1]).
    map((group) => _.first(group)).
    map((tag) => `v${  tag}`).
    value()).
then((tags) => {
  const master = tags.pop();
  const stable = tags.pop();

  return [
    { name: stable.replace(/\d+$/, 'x'), tag: stable },
    { name: 'master', tag: master}
  ];
}).
then(allInSeries((branch) => checkout(branch.name).
    then(() => getTheLog(branch.tag)).
    then((log) => log.
        filter(identity)).
    then((log) => {
      branch.full = log.map((line) => {
        line = line.split(' ');
        const sha = line.shift();
        const msg = line.join(' ');
        return sha + ((/fix\([^)]+\):/i.test(msg))  ? ' * ' : '   ') + msg;
      });
      branch.log = log.map((line) => line.substr(41));
      return branch;
    }))).
then((pairs) => {
  compareBranches(pairs[0], pairs[1]);
  console.log('\n');
  compareBranches(pairs[1], pairs[0]);
  return pairs;
}).
then(() => checkout(currentBranch)).
catch((e) => {
  console.log(e.stack);
});

