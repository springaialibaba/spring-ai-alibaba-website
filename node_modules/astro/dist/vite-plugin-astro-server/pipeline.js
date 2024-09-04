import { fileURLToPath } from "node:url";
import { getInfoOutput } from "../cli/info/index.js";
import { ASTRO_VERSION, DEFAULT_404_COMPONENT } from "../core/constants.js";
import { enhanceViteSSRError } from "../core/errors/dev/index.js";
import { RouteNotFound } from "../core/errors/errors-data.js";
import { AggregateError, AstroError, CSSError, MarkdownError } from "../core/errors/index.js";
import { Pipeline, loadRenderer } from "../core/render/index.js";
import { isPage, isServerLikeOutput, resolveIdToUrl, viteID } from "../core/util.js";
import { PAGE_SCRIPT_ID } from "../vite-plugin-scripts/index.js";
import { getStylesForURL } from "./css.js";
import { getComponentMetadata } from "./metadata.js";
import { createResolve } from "./resolve.js";
import { default404Page } from "./response.js";
import { getScriptsForURL } from "./scripts.js";
class DevPipeline extends Pipeline {
  constructor(loader, logger, manifest, settings, config = settings.config) {
    const mode = "development";
    const resolve = createResolve(loader, config.root);
    const serverLike = isServerLikeOutput(config);
    const streaming = true;
    super(logger, manifest, mode, [], resolve, serverLike, streaming);
    this.loader = loader;
    this.logger = logger;
    this.manifest = manifest;
    this.settings = settings;
    this.config = config;
  }
  // renderers are loaded on every request,
  // so it needs to be mutable here unlike in other environments
  renderers = new Array();
  manifestData;
  componentInterner = /* @__PURE__ */ new WeakMap();
  static create(manifestData, {
    loader,
    logger,
    manifest,
    settings
  }) {
    const pipeline = new DevPipeline(loader, logger, manifest, settings);
    pipeline.manifestData = manifestData;
    return pipeline;
  }
  async headElements(routeData) {
    const {
      config: { root },
      loader,
      mode,
      settings
    } = this;
    const filePath = new URL(`${routeData.component}`, root);
    const { scripts } = settings.config.experimental.directRenderScript ? { scripts: /* @__PURE__ */ new Set() } : await getScriptsForURL(filePath, settings.config.root, loader);
    if (isPage(filePath, settings) && mode === "development") {
      scripts.add({
        props: { type: "module", src: "/@vite/client" },
        children: ""
      });
      if (settings.config.devToolbar.enabled && await settings.preferences.get("devToolbar.enabled")) {
        const src = await resolveIdToUrl(loader, "astro/runtime/client/dev-toolbar/entrypoint.js");
        scripts.add({ props: { type: "module", src }, children: "" });
        const additionalMetadata = {
          root: fileURLToPath(settings.config.root),
          version: ASTRO_VERSION,
          latestAstroVersion: settings.latestAstroVersion,
          debugInfo: await getInfoOutput({ userConfig: settings.config, print: false })
        };
        const children = `window.__astro_dev_toolbar__ = ${JSON.stringify(additionalMetadata)}`;
        scripts.add({ props: {}, children });
      }
    }
    for (const script of settings.scripts) {
      if (script.stage === "head-inline") {
        scripts.add({
          props: {},
          children: script.content
        });
      } else if (script.stage === "page" && isPage(filePath, settings)) {
        scripts.add({
          props: { type: "module", src: `/@id/${PAGE_SCRIPT_ID}` },
          children: ""
        });
      }
    }
    const links = /* @__PURE__ */ new Set();
    const { urls, styles: _styles } = await getStylesForURL(filePath, loader);
    for (const href of urls) {
      links.add({ props: { rel: "stylesheet", href }, children: "" });
    }
    const styles = /* @__PURE__ */ new Set();
    for (const { id, url: src, content } of _styles) {
      scripts.add({ props: { type: "module", src }, children: "" });
      styles.add({ props: { "data-vite-dev-id": id }, children: content });
    }
    return { scripts, styles, links };
  }
  componentMetadata(routeData) {
    const {
      config: { root },
      loader
    } = this;
    const filePath = new URL(`${routeData.component}`, root);
    return getComponentMetadata(filePath, loader);
  }
  async preload(routeData, filePath) {
    const { loader } = this;
    if (filePath.href === new URL(DEFAULT_404_COMPONENT, this.config.root).href) {
      return { default: default404Page };
    }
    const renderers__ = this.settings.renderers.map((r) => loadRenderer(r, loader));
    const renderers_ = await Promise.all(renderers__);
    this.renderers = renderers_.filter((r) => Boolean(r));
    try {
      const componentInstance = await loader.import(viteID(filePath));
      this.componentInterner.set(routeData, componentInstance);
      return componentInstance;
    } catch (error) {
      if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
        throw error;
      }
      throw enhanceViteSSRError({ error, filePath, loader });
    }
  }
  clearRouteCache() {
    this.routeCache.clearAll();
    this.componentInterner = /* @__PURE__ */ new WeakMap();
  }
  async getComponentByRoute(routeData) {
    const component = this.componentInterner.get(routeData);
    if (component) {
      return component;
    } else {
      const filePath = new URL(`${routeData.component}`, this.config.root);
      return await this.preload(routeData, filePath);
    }
  }
  async tryRewrite(payload, request) {
    let foundRoute;
    if (!this.manifestData) {
      throw new Error("Missing manifest data. This is an internal error, please file an issue.");
    }
    for (const route of this.manifestData.routes) {
      if (payload instanceof URL) {
        if (route.pattern.test(payload.pathname)) {
          foundRoute = route;
          break;
        }
      } else if (payload instanceof Request) {
        const url = new URL(payload.url);
        if (route.pattern.test(url.pathname)) {
          foundRoute = route;
          break;
        }
      } else {
        const newUrl = new URL(payload, new URL(request.url).origin);
        if (route.pattern.test(decodeURI(newUrl.pathname))) {
          foundRoute = route;
          break;
        }
      }
    }
    if (foundRoute) {
      const componentInstance = await this.getComponentByRoute(foundRoute);
      return [foundRoute, componentInstance];
    } else {
      throw new AstroError(RouteNotFound);
    }
  }
  setManifestData(manifestData) {
    this.manifestData = manifestData;
  }
}
export {
  DevPipeline
};
