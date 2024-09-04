import { viteID } from "../../util.js";
import { getPageDataByViteID } from "../internal.js";
import { shouldInlineAsset } from "./util.js";
function virtualHoistedEntry(id) {
  return id.startsWith("/astro/hoisted.js?q=");
}
function vitePluginHoistedScripts(settings, internals) {
  let assetsInlineLimit;
  return {
    name: "@astro/rollup-plugin-astro-hoisted-scripts",
    configResolved(config) {
      assetsInlineLimit = config.build.assetsInlineLimit;
    },
    resolveId(id) {
      if (virtualHoistedEntry(id)) {
        return id;
      }
    },
    load(id) {
      if (virtualHoistedEntry(id)) {
        let code = "";
        for (let path of internals.hoistedScriptIdToHoistedMap.get(id)) {
          let importPath = path;
          if (importPath.startsWith("/@fs")) {
            importPath = importPath.slice("/@fs".length);
          }
          code += `import "${importPath}";`;
        }
        return {
          code
        };
      }
      return void 0;
    },
    async generateBundle(_options, bundle) {
      const considerInlining = /* @__PURE__ */ new Map();
      const importedByOtherScripts = /* @__PURE__ */ new Set();
      Object.entries(bundle).forEach(([id, output]) => {
        if (output.type === "chunk" && output.facadeModuleId && virtualHoistedEntry(output.facadeModuleId)) {
          considerInlining.set(id, output);
          output.imports.forEach((imported) => importedByOtherScripts.add(imported));
        }
      });
      for (const [id, output] of considerInlining.entries()) {
        const canBeInlined = importedByOtherScripts.has(output.fileName) === false && output.imports.length === 0 && output.dynamicImports.length === 0 && shouldInlineAsset(output.code, output.fileName, assetsInlineLimit);
        let removeFromBundle = false;
        const facadeId = output.facadeModuleId;
        const pages = internals.hoistedScriptIdToPagesMap.get(facadeId);
        for (const pathname of pages) {
          const vid = viteID(new URL("." + pathname, settings.config.root));
          const pageInfo = getPageDataByViteID(internals, vid);
          if (pageInfo) {
            if (canBeInlined) {
              pageInfo.hoistedScript = {
                type: "inline",
                value: output.code
              };
              removeFromBundle = true;
            } else {
              pageInfo.hoistedScript = {
                type: "external",
                value: id
              };
            }
          }
        }
        if (removeFromBundle) {
          delete bundle[id];
        }
      }
    }
  };
}
function pluginHoistedScripts(options, internals) {
  return {
    targets: ["client"],
    hooks: {
      "build:before": () => {
        return {
          vitePlugin: vitePluginHoistedScripts(options.settings, internals)
        };
      }
    }
  };
}
export {
  pluginHoistedScripts,
  vitePluginHoistedScripts
};
