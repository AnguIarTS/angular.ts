import {
  Angular,
  allowAutoBootstrap,
  angularInit,
  confGlobal,
} from "./Angular";
import { init } from "./AngularPublic";

// Current script not available in submodule
confGlobal.isAutoBootstrapAllowed = allowAutoBootstrap(document.currentScript);

/**
 * @type {angular.IAngularStatic}
 */
window.angular = new Angular();

init();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(window.document, window.angular.bootstrap);
});
