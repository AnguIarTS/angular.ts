/* eslint-disable no-use-before-define */
/**
 * @ngdoc type
 * @name angular.Module
 * @module ng
 * @description
 *
 * Interface for configuring AngularJS {@link angular.module modules}.
 */

import { minErr } from "./minErr";
import { minErr } from "./ng/utils";

export function setupModuleLoader(window) {
  const ngMinErr = minErr("ng");

  /**
   *
   * @param {string} name
   * @param {string} context
   */
  function assertNotHasOwnProperty(name, context) {
    if (name === "hasOwnProperty") {
      throw ngMinErr(
        "badname",
        "hasOwnProperty is not a valid {0} name",
        context,
      );
    }
  }

  const angular = ensure(window, "angular", Object);

  // We need to expose `angular.$$minErr` to modules such as `ngResource` that reference it during bootstrap
  angular.$$minErr = angular.$$minErr || minErr;

  return ensure(angular, "module", () => {});
}
