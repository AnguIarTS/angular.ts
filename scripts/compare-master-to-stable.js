#!/usr/bin/env node



let util = require('util');
let cp = require('child_process');

let Q = require('q');
let _ = require('lodash');
let semver = require('semver');

let exec = function(cmd) {
  return function() {
    let args = Array.prototype.slice.call(arguments, 0);
    args.unshift(cmd);
    let fullCmd = util.format.apply(util, args);
    return Q.nfcall(cp.exec, fullCmd).then(function(out) {
      return out[0].split('\n');
    });
  };
};

let andThen = function(fn, after) {
  return /** @this */ function() {
    return fn.apply(this, arguments).then(after);
  };
};

let oneArg = function(fn) {
  return function(arg) {
    return fn(arg);
  };
};

let oneLine = function(lines) {
  return lines[0].trim();
};

let noArgs = function(fn) {
  return function() {
    return fn();
  };
};

let identity = function(i) { return i; };

// like Q.all, but runs the commands in series
// useful for ensuring env state (like which branch is checked out)
let allInSeries = function(fn) {
  return function(args) {
    let results = [];
    let def;
    while (args.length > 0) {
      (function(arg) {
        if (def) {
          def = def.then(function() {
            return fn(arg);
          });
        } else {
          def = fn(arg);
        }
        def = def.then(function(res) {
          results.push(res);
        });
      })(args.pop());
    }
    return def.then(function() {
      return results;
    });
  };
};

let compareBranches = function(left, right) {
  console.log('# These commits are in ' + left.name + ' but not in ' + right.name + '\n');
  console.log(_(left.log).
    difference(right.log).
    map(function(line) {
      return left.full[left.log.indexOf(line)]; // lol O(n^2)
    }).
    value().
    join('\n'));
};

let checkout = oneArg(exec('git checkout %s'));

let getCurrentBranch = andThen(noArgs(exec('git rev-parse --abbrev-ref HEAD')), oneLine);
let getTags = noArgs(exec('git tag'));
let getTheLog = oneArg(exec('git log --pretty=oneline %s..HEAD | cat'));

// remember this so we can restore state
let currentBranch;

getCurrentBranch().
then(function(branch) {
  currentBranch = branch;
}).
then(getTags).
then(function(tags) {
  return tags.
    filter(semver.valid).
    map(semver.clean).
    sort(semver.rcompare);
}).
then(function(tags) {
  let major = semver(tags[0]).major;
  return tags.
    filter(function(ver) {
      return semver(ver).major === major;
    });
}).
then(function(tags) {
  return _(tags).
    groupBy(function(tag) {
      return tag.split('.')[1];
    }).
    map(function(group) {
      return _.first(group);
    }).
    map(function(tag) {
      return 'v' + tag;
    }).
    value();
}).
then(function(tags) {
  let master = tags.pop();
  let stable = tags.pop();

  return [
    { name: stable.replace(/\d+$/, 'x'), tag: stable },
    { name: 'master', tag: master}
  ];
}).
then(allInSeries(function(branch) {
  return checkout(branch.name).
    then(function() {
      return getTheLog(branch.tag);
    }).
    then(function(log) {
      return log.
        filter(identity);
    }).
    then(function(log) {
      branch.full = log.map(function(line) {
        line = line.split(' ');
        let sha = line.shift();
        let msg = line.join(' ');
        return sha + ((/fix\([^)]+\):/i.test(msg))  ? ' * ' : '   ') + msg;
      });
      branch.log = log.map(function(line) {
        return line.substr(41);
      });
      return branch;
    });
})).
then(function(pairs) {
  compareBranches(pairs[0], pairs[1]);
  console.log('\n');
  compareBranches(pairs[1], pairs[0]);
  return pairs;
}).
then(function() {
  return checkout(currentBranch);
}).
catch(function(e) {
  console.log(e.stack);
});

