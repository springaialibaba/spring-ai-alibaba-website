import { fileURLToPath } from "node:url";
import * as vite from "vite";
import { eventCliSession, telemetry } from "../../events/index.js";
import { createNodeLogger, createSettings, resolveConfig } from "../config/index.js";
import { collectErrorMetadata } from "../errors/dev/utils.js";
import { isAstroConfigZodError } from "../errors/errors.js";
import { createSafeError } from "../errors/index.js";
import { formatErrorMessage } from "../messages.js";
import { createContainer, startContainer } from "./container.js";
async function createRestartedContainer(container, settings) {
  const { logger, fs, inlineConfig } = container;
  const newContainer = await createContainer({
    isRestart: true,
    logger,
    settings,
    inlineConfig,
    fs
  });
  await startContainer(newContainer);
  return newContainer;
}
const configRE = /.*astro.config.(?:mjs|cjs|js|ts)$/;
const preferencesRE = /.*\.astro\/settings.json$/;
function shouldRestartContainer({ settings, inlineConfig, restartInFlight }, changedFile) {
  if (restartInFlight) return false;
  let shouldRestart = false;
  if (inlineConfig.configFile) {
    shouldRestart = vite.normalizePath(inlineConfig.configFile) === vite.normalizePath(changedFile);
  } else {
    const normalizedChangedFile = vite.normalizePath(changedFile);
    shouldRestart = configRE.test(normalizedChangedFile);
    if (preferencesRE.test(normalizedChangedFile)) {
      shouldRestart = settings.preferences.ignoreNextPreferenceReload ? false : true;
      settings.preferences.ignoreNextPreferenceReload = false;
    }
  }
  if (!shouldRestart && settings.watchFiles.length > 0) {
    shouldRestart = settings.watchFiles.some(
      (path) => vite.normalizePath(path) === vite.normalizePath(changedFile)
    );
  }
  return shouldRestart;
}
async function restartContainer(container) {
  const { logger, close, settings: existingSettings } = container;
  container.restartInFlight = true;
  try {
    const { astroConfig } = await resolveConfig(container.inlineConfig, "dev", container.fs);
    const settings = await createSettings(astroConfig, fileURLToPath(existingSettings.config.root));
    await close();
    return await createRestartedContainer(container, settings);
  } catch (_err) {
    const error = createSafeError(_err);
    if (!isAstroConfigZodError(_err)) {
      logger.error(
        "config",
        formatErrorMessage(collectErrorMetadata(error), logger.level() === "debug") + "\n"
      );
    }
    container.viteServer.hot.send({
      type: "error",
      err: {
        message: error.message,
        stack: error.stack || ""
      }
    });
    container.restartInFlight = false;
    logger.error(null, "Continuing with previous valid configuration\n");
    return error;
  }
}
async function createContainerWithAutomaticRestart({
  inlineConfig,
  fs
}) {
  const logger = createNodeLogger(inlineConfig ?? {});
  const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, "dev", fs);
  telemetry.record(eventCliSession("dev", userConfig));
  const settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));
  const initialContainer = await createContainer({ settings, logger, inlineConfig, fs });
  let resolveRestart;
  let restartComplete = new Promise((resolve) => {
    resolveRestart = resolve;
  });
  let restart = {
    container: initialContainer,
    restarted() {
      return restartComplete;
    }
  };
  async function handleServerRestart(logMsg = "") {
    logger.info(null, (logMsg + " Restarting...").trim());
    const container = restart.container;
    const result = await restartContainer(container);
    if (result instanceof Error) {
      resolveRestart(result);
    } else {
      restart.container = result;
      setupContainer();
      resolveRestart(null);
    }
    restartComplete = new Promise((resolve) => {
      resolveRestart = resolve;
    });
  }
  function handleChangeRestart(logMsg) {
    return async function(changedFile) {
      if (shouldRestartContainer(restart.container, changedFile)) {
        handleServerRestart(logMsg);
      }
    };
  }
  function setupContainer() {
    const watcher = restart.container.viteServer.watcher;
    watcher.on("change", handleChangeRestart("Configuration file updated."));
    watcher.on("unlink", handleChangeRestart("Configuration file removed."));
    watcher.on("add", handleChangeRestart("Configuration file added."));
    restart.container.viteServer.restart = () => handleServerRestart();
    restart.container.viteServer.bindCLIShortcuts({
      customShortcuts: [
        // Disable Vite's builtin "r" (restart server), "u" (print server urls) and "c" (clear console) shortcuts
        { key: "r", description: "" },
        { key: "u", description: "" },
        { key: "c", description: "" }
      ]
    });
  }
  setupContainer();
  return restart;
}
export {
  createContainerWithAutomaticRestart,
  restartContainer,
  shouldRestartContainer
};
