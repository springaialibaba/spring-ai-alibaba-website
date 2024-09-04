import path from "node:path";
import { getPrerenderMetadata } from "../../../prerender/metadata.js";
import { extendManualChunks } from "./util.js";
function vitePluginPrerender(opts, internals) {
  return {
    name: "astro:rollup-plugin-prerender",
    outputOptions(outputOptions) {
      extendManualChunks(outputOptions, {
        after(id, meta) {
          if (id.includes("astro/dist/runtime")) {
            return "astro";
          }
          const pageInfo = internals.pagesByViteID.get(id);
          let hasSharedModules = false;
          if (pageInfo) {
            if (getPrerenderMetadata(meta.getModuleInfo(id))) {
              const infoMeta = meta.getModuleInfo(id);
              for (const moduleId of infoMeta.importedIds) {
                const moduleMeta = meta.getModuleInfo(moduleId);
                if (
                  // a shared modules should be inside the `src/` folder, at least
                  moduleMeta.id.startsWith(opts.settings.config.srcDir.pathname) && // and has at least two importers: the current page and something else
                  moduleMeta.importers.length > 1
                ) {
                  for (const importer of moduleMeta.importedIds) {
                    if (importer !== id) {
                      const importerModuleMeta = meta.getModuleInfo(importer);
                      if (importerModuleMeta) {
                        if (importerModuleMeta.id.includes("/pages")) {
                          if (getPrerenderMetadata(importerModuleMeta) === false) {
                            hasSharedModules = true;
                            break;
                          }
                        } else if (importerModuleMeta.id.includes("/middleware")) {
                          hasSharedModules = true;
                          break;
                        }
                      }
                    }
                  }
                }
              }
              pageInfo.hasSharedModules = hasSharedModules;
              pageInfo.route.prerender = true;
              return "prerender";
            }
            pageInfo.route.prerender = false;
            return `pages/${path.basename(pageInfo.component)}`;
          }
        }
      });
    }
  };
}
function pluginPrerender(opts, internals) {
  if (opts.settings.config.output === "static") {
    return { targets: ["server"] };
  }
  return {
    targets: ["server"],
    hooks: {
      "build:before": () => {
        return {
          vitePlugin: vitePluginPrerender(opts, internals)
        };
      }
    }
  };
}
export {
  pluginPrerender
};
