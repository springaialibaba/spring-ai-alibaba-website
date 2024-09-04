import fsMod from "node:fs";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { dim } from "kleur/colors";
import { createServer } from "vite";
import { getPackage } from "../../cli/install-package.js";
import { createContentTypesGenerator } from "../../content/index.js";
import { globalContentConfigObserver } from "../../content/utils.js";
import { telemetry } from "../../events/index.js";
import { eventCliSession } from "../../events/session.js";
import { runHookConfigSetup } from "../../integrations/hooks.js";
import { setUpEnvTs } from "../../vite-plugin-inject-env-ts/index.js";
import { getTimeStat } from "../build/util.js";
import { resolveConfig } from "../config/config.js";
import { createNodeLogger } from "../config/logging.js";
import { createSettings } from "../config/settings.js";
import { createVite } from "../create-vite.js";
import { collectErrorMetadata } from "../errors/dev/utils.js";
import {
  AstroError,
  AstroErrorData,
  AstroUserError,
  createSafeError,
  isAstroError
} from "../errors/index.js";
import { formatErrorMessage } from "../messages.js";
import { ensureProcessNodeEnv } from "../util.js";
async function sync(inlineConfig, options) {
  ensureProcessNodeEnv("production");
  const logger = createNodeLogger(inlineConfig);
  const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, "sync");
  telemetry.record(eventCliSession("sync", userConfig));
  const _settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));
  const settings = await runHookConfigSetup({
    settings: _settings,
    logger,
    command: "build"
  });
  const timerStart = performance.now();
  const dbPackage = await getPackage(
    "@astrojs/db",
    logger,
    {
      optional: true,
      cwd: inlineConfig.root
    },
    []
  );
  try {
    await dbPackage?.typegen?.(astroConfig);
    const exitCode = await syncContentCollections(settings, { ...options, logger });
    if (exitCode !== 0) return exitCode;
    logger.info(null, `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);
    return 0;
  } catch (err) {
    const error = createSafeError(err);
    logger.error(
      "content",
      formatErrorMessage(collectErrorMetadata(error), logger.level() === "debug") + "\n"
    );
    return 1;
  }
}
async function syncContentCollections(settings, { logger, fs }) {
  const tempViteServer = await createServer(
    await createVite(
      {
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true },
        ssr: { external: [] },
        logLevel: "silent"
      },
      { settings, logger, mode: "build", command: "build", fs }
    )
  );
  const hotSend = tempViteServer.hot.send;
  tempViteServer.hot.send = (payload) => {
    if (payload.type === "error") {
      throw payload.err;
    }
    return hotSend(payload);
  };
  try {
    const contentTypesGenerator = await createContentTypesGenerator({
      contentConfigObserver: globalContentConfigObserver,
      logger,
      fs: fs ?? fsMod,
      settings,
      viteServer: tempViteServer
    });
    const typesResult = await contentTypesGenerator.init();
    const contentConfig = globalContentConfigObserver.get();
    if (contentConfig.status === "error") {
      throw contentConfig.error;
    }
    if (typesResult.typesGenerated === false) {
      switch (typesResult.reason) {
        case "no-content-dir":
        default:
          logger.debug("types", "No content directory found. Skipping type generation.");
          return 0;
      }
    }
  } catch (e) {
    const safeError = createSafeError(e);
    if (isAstroError(e)) {
      throw e;
    }
    const hint = AstroUserError.is(e) ? e.hint : AstroErrorData.GenerateContentTypesError.hint;
    throw new AstroError(
      {
        ...AstroErrorData.GenerateContentTypesError,
        hint,
        message: AstroErrorData.GenerateContentTypesError.message(safeError.message)
      },
      { cause: e }
    );
  } finally {
    await tempViteServer.close();
  }
  await setUpEnvTs({ settings, logger, fs: fs ?? fsMod });
  return 0;
}
export {
  sync as default,
  syncContentCollections
};
