import * as colors from "kleur/colors";
import { debug } from "../logger/core.js";
import { makePageDataKey } from "./plugins/util.js";
async function collectPagesData(opts) {
  const { settings, manifest } = opts;
  const assets = {};
  const allPages = {};
  const builtPaths = /* @__PURE__ */ new Set();
  const dataCollectionLogTimeout = setInterval(() => {
    opts.logger.info("build", "The data collection step may take longer for larger projects...");
    clearInterval(dataCollectionLogTimeout);
  }, 3e4);
  for (const route of manifest.routes) {
    const key = makePageDataKey(route.route, route.component);
    if (route.pathname) {
      const routeCollectionLogTimeout = setInterval(() => {
        opts.logger.info(
          "build",
          `${colors.bold(
            route.component
          )} is taking a bit longer to import. This is common for larger "Astro.glob(...)" or "import.meta.glob(...)" calls, for instance. Hang tight!`
        );
        clearInterval(routeCollectionLogTimeout);
      }, 1e4);
      builtPaths.add(route.pathname);
      allPages[key] = {
        key,
        component: route.component,
        route,
        moduleSpecifier: "",
        styles: [],
        hoistedScript: void 0,
        hasSharedModules: false
      };
      clearInterval(routeCollectionLogTimeout);
      if (settings.config.output === "static") {
        const html = `${route.pathname}`.replace(/\/?$/, "/index.html");
        debug(
          "build",
          `\u251C\u2500\u2500 ${colors.bold(colors.green("\u2714"))} ${route.component} \u2192 ${colors.yellow(html)}`
        );
      } else {
        debug("build", `\u251C\u2500\u2500 ${colors.bold(colors.green("\u2714"))} ${route.component}`);
      }
      continue;
    }
    allPages[key] = {
      key,
      component: route.component,
      route,
      moduleSpecifier: "",
      styles: [],
      hoistedScript: void 0,
      hasSharedModules: false
    };
  }
  clearInterval(dataCollectionLogTimeout);
  return { assets, allPages };
}
export {
  collectPagesData
};
