import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import glob from "fast-glob";
import { bold, cyan } from "kleur/colors";
import { normalizePath } from "vite";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AstroError } from "../core/errors/errors.js";
import { AstroErrorData } from "../core/errors/index.js";
import { isRelativePath } from "../core/path.js";
import { CONTENT_TYPES_FILE, VIRTUAL_MODULE_ID } from "./consts.js";
import {
  getContentEntryIdAndSlug,
  getContentPaths,
  getDataEntryExts,
  getDataEntryId,
  getEntryCollectionName,
  getEntryConfigByExtMap,
  getEntrySlug,
  getEntryType,
  reloadContentConfigObserver
} from "./utils.js";
async function createContentTypesGenerator({
  contentConfigObserver,
  fs,
  logger,
  settings,
  viteServer
}) {
  const collectionEntryMap = {};
  const contentPaths = getContentPaths(settings.config, fs);
  const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
  const contentEntryExts = [...contentEntryConfigByExt.keys()];
  const dataEntryExts = getDataEntryExts(settings);
  let events = [];
  let debounceTimeout;
  const typeTemplateContent = await fs.promises.readFile(contentPaths.typesTemplate, "utf-8");
  async function init() {
    if (!fs.existsSync(contentPaths.contentDir)) {
      return { typesGenerated: false, reason: "no-content-dir" };
    }
    events.push({ name: "add", entry: contentPaths.config.url });
    const globResult = await glob("**", {
      cwd: fileURLToPath(contentPaths.contentDir),
      fs: {
        readdir: fs.readdir.bind(fs),
        readdirSync: fs.readdirSync.bind(fs)
      },
      onlyFiles: false,
      objectMode: true
    });
    for (const entry of globResult) {
      const fullPath = path.join(fileURLToPath(contentPaths.contentDir), entry.path);
      const entryURL = pathToFileURL(fullPath);
      if (entryURL.href.startsWith(contentPaths.config.url.href)) continue;
      if (entry.dirent.isFile()) {
        events.push({ name: "add", entry: entryURL });
      } else if (entry.dirent.isDirectory()) {
        events.push({ name: "addDir", entry: entryURL });
      }
    }
    await runEvents();
    return { typesGenerated: true };
  }
  async function handleEvent(event) {
    if (event.name === "addDir" || event.name === "unlinkDir") {
      const collection2 = normalizePath(
        path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry))
      );
      const collectionKey2 = JSON.stringify(collection2);
      const isCollectionEvent = collection2.split("/").length === 1;
      if (!isCollectionEvent) return { shouldGenerateTypes: false };
      switch (event.name) {
        case "addDir":
          collectionEntryMap[JSON.stringify(collection2)] = {
            type: "unknown",
            entries: {}
          };
          logger.debug("content", `${cyan(collection2)} collection added`);
          break;
        case "unlinkDir":
          if (collectionKey2 in collectionEntryMap) {
            delete collectionEntryMap[JSON.stringify(collection2)];
          }
          break;
      }
      return { shouldGenerateTypes: true };
    }
    const fileType = getEntryType(
      fileURLToPath(event.entry),
      contentPaths,
      contentEntryExts,
      dataEntryExts
    );
    if (fileType === "ignored") {
      return { shouldGenerateTypes: false };
    }
    if (fileType === "config") {
      await reloadContentConfigObserver({ fs, settings, viteServer });
      return { shouldGenerateTypes: true };
    }
    const { entry } = event;
    const { contentDir } = contentPaths;
    const collection = getEntryCollectionName({ entry, contentDir });
    if (collection === void 0) {
      logger.warn(
        "content",
        `${bold(
          normalizePath(
            path.relative(fileURLToPath(contentPaths.contentDir), fileURLToPath(event.entry))
          )
        )} must live in a ${bold("content/...")} collection subdirectory.`
      );
      return { shouldGenerateTypes: false };
    }
    if (fileType === "data") {
      const id2 = getDataEntryId({ entry, contentDir, collection });
      const collectionKey2 = JSON.stringify(collection);
      const entryKey2 = JSON.stringify(id2);
      switch (event.name) {
        case "add":
          if (!(collectionKey2 in collectionEntryMap)) {
            collectionEntryMap[collectionKey2] = { type: "data", entries: {} };
          }
          const collectionInfo2 = collectionEntryMap[collectionKey2];
          if (collectionInfo2.type === "content") {
            viteServer.hot.send({
              type: "error",
              err: new AstroError({
                ...AstroErrorData.MixedContentDataCollectionError,
                message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey2),
                location: { file: entry.pathname }
              })
            });
            return { shouldGenerateTypes: false };
          }
          if (!(entryKey2 in collectionEntryMap[collectionKey2])) {
            collectionEntryMap[collectionKey2] = {
              type: "data",
              entries: { ...collectionInfo2.entries, [entryKey2]: {} }
            };
          }
          return { shouldGenerateTypes: true };
        case "unlink":
          if (collectionKey2 in collectionEntryMap && entryKey2 in collectionEntryMap[collectionKey2].entries) {
            delete collectionEntryMap[collectionKey2].entries[entryKey2];
          }
          return { shouldGenerateTypes: true };
        case "change":
          return { shouldGenerateTypes: false };
      }
    }
    const contentEntryType = contentEntryConfigByExt.get(path.extname(event.entry.pathname));
    if (!contentEntryType) return { shouldGenerateTypes: false };
    const { id, slug: generatedSlug } = getContentEntryIdAndSlug({
      entry,
      contentDir,
      collection
    });
    const collectionKey = JSON.stringify(collection);
    if (!(collectionKey in collectionEntryMap)) {
      collectionEntryMap[collectionKey] = { type: "content", entries: {} };
    }
    const collectionInfo = collectionEntryMap[collectionKey];
    if (collectionInfo.type === "data") {
      viteServer.hot.send({
        type: "error",
        err: new AstroError({
          ...AstroErrorData.MixedContentDataCollectionError,
          message: AstroErrorData.MixedContentDataCollectionError.message(collectionKey),
          location: { file: entry.pathname }
        })
      });
      return { shouldGenerateTypes: false };
    }
    const entryKey = JSON.stringify(id);
    switch (event.name) {
      case "add":
        const addedSlug = await getEntrySlug({
          generatedSlug,
          id,
          collection,
          fileUrl: event.entry,
          contentEntryType,
          fs
        });
        if (!(entryKey in collectionEntryMap[collectionKey].entries)) {
          collectionEntryMap[collectionKey] = {
            type: "content",
            entries: {
              ...collectionInfo.entries,
              [entryKey]: { slug: addedSlug }
            }
          };
        }
        return { shouldGenerateTypes: true };
      case "unlink":
        if (collectionKey in collectionEntryMap && entryKey in collectionEntryMap[collectionKey].entries) {
          delete collectionEntryMap[collectionKey].entries[entryKey];
        }
        return { shouldGenerateTypes: true };
      case "change":
        const changedSlug = await getEntrySlug({
          generatedSlug,
          id,
          collection,
          fileUrl: event.entry,
          contentEntryType,
          fs
        });
        const entryMetadata = collectionInfo.entries[entryKey];
        if (entryMetadata?.slug !== changedSlug) {
          collectionInfo.entries[entryKey].slug = changedSlug;
          return { shouldGenerateTypes: true };
        }
        return { shouldGenerateTypes: false };
    }
  }
  function queueEvent(rawEvent) {
    const event = {
      entry: pathToFileURL(rawEvent.entry),
      name: rawEvent.name
    };
    if (!event.entry.pathname.startsWith(contentPaths.contentDir.pathname)) return;
    events.push(event);
    debounceTimeout && clearTimeout(debounceTimeout);
    const runEventsSafe = async () => {
      try {
        await runEvents();
      } catch {
      }
    };
    debounceTimeout = setTimeout(
      runEventsSafe,
      50
      /* debounce to batch chokidar events */
    );
  }
  async function runEvents() {
    const eventResponses = [];
    for (const event of events) {
      const response = await handleEvent(event);
      eventResponses.push(response);
    }
    events = [];
    const observable = contentConfigObserver.get();
    if (eventResponses.some((r) => r.shouldGenerateTypes)) {
      await writeContentFiles({
        fs,
        collectionEntryMap,
        contentPaths,
        typeTemplateContent,
        contentConfig: observable.status === "loaded" ? observable.config : void 0,
        contentEntryTypes: settings.contentEntryTypes,
        viteServer,
        logger,
        settings
      });
      invalidateVirtualMod(viteServer);
    }
  }
  return { init, queueEvent };
}
function invalidateVirtualMod(viteServer) {
  const virtualMod = viteServer.moduleGraph.getModuleById("\0" + VIRTUAL_MODULE_ID);
  if (!virtualMod) return;
  viteServer.moduleGraph.invalidateModule(virtualMod);
}
function normalizeConfigPath(from, to) {
  const configPath = path.relative(from, to).replace(/\.ts$/, ".js");
  const normalizedPath = configPath.replaceAll("\\", "/");
  return `"${isRelativePath(configPath) ? "" : "./"}${normalizedPath}"`;
}
async function writeContentFiles({
  fs,
  contentPaths,
  collectionEntryMap,
  typeTemplateContent,
  contentEntryTypes,
  contentConfig,
  viteServer,
  logger,
  settings
}) {
  let contentTypesStr = "";
  let dataTypesStr = "";
  const collectionSchemasDir = new URL("./collections/", contentPaths.cacheDir);
  if (settings.config.experimental.contentCollectionJsonSchema && !fs.existsSync(collectionSchemasDir)) {
    fs.mkdirSync(collectionSchemasDir, { recursive: true });
  }
  for (const [collection, config] of Object.entries(contentConfig?.collections ?? {})) {
    collectionEntryMap[JSON.stringify(collection)] ??= {
      type: config.type,
      entries: {}
    };
  }
  for (const collectionKey of Object.keys(collectionEntryMap).sort()) {
    const collectionConfig = contentConfig?.collections[JSON.parse(collectionKey)];
    const collection = collectionEntryMap[collectionKey];
    if (collectionConfig?.type && collection.type !== "unknown" && collection.type !== collectionConfig.type) {
      viteServer.hot.send({
        type: "error",
        err: new AstroError({
          ...AstroErrorData.ContentCollectionTypeMismatchError,
          message: AstroErrorData.ContentCollectionTypeMismatchError.message(
            collectionKey,
            collection.type,
            collectionConfig.type
          ),
          hint: collection.type === "data" ? "Try adding `type: 'data'` to your collection config." : void 0,
          location: {
            file: ""
          }
        })
      });
      return;
    }
    const resolvedType = collection.type === "unknown" ? (
      // Add empty / unknown collections to the data type map by default
      // This ensures `getCollection('empty-collection')` doesn't raise a type error
      collectionConfig?.type ?? "data"
    ) : collection.type;
    switch (resolvedType) {
      case "content":
        contentTypesStr += `${collectionKey}: {
`;
        for (const entryKey of Object.keys(collection.entries).sort()) {
          const entryMetadata = collection.entries[entryKey];
          const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : "any";
          const renderType = `{ render(): Render[${JSON.stringify(
            path.extname(JSON.parse(entryKey))
          )}] }`;
          const slugType = JSON.stringify(entryMetadata.slug);
          contentTypesStr += `${entryKey}: {
	id: ${entryKey};
  slug: ${slugType};
  body: string;
  collection: ${collectionKey};
  data: ${dataType}
} & ${renderType};
`;
        }
        contentTypesStr += `};
`;
        break;
      case "data":
        dataTypesStr += `${collectionKey}: {
`;
        for (const entryKey of Object.keys(collection.entries).sort()) {
          const dataType = collectionConfig?.schema ? `InferEntrySchema<${collectionKey}>` : "any";
          dataTypesStr += `${entryKey}: {
	id: ${entryKey};
  collection: ${collectionKey};
  data: ${dataType}
};
`;
          if (settings.config.experimental.contentCollectionJsonSchema && collectionConfig?.schema) {
            let zodSchemaForJson = typeof collectionConfig.schema === "function" ? collectionConfig.schema({ image: () => z.string() }) : collectionConfig.schema;
            if (zodSchemaForJson instanceof z.ZodObject) {
              zodSchemaForJson = zodSchemaForJson.extend({
                $schema: z.string().optional()
              });
            }
            try {
              await fs.promises.writeFile(
                new URL(`./${collectionKey.replace(/"/g, "")}.schema.json`, collectionSchemasDir),
                JSON.stringify(
                  zodToJsonSchema(zodSchemaForJson, {
                    name: collectionKey.replace(/"/g, ""),
                    markdownDescription: true,
                    errorMessages: true
                  }),
                  null,
                  2
                )
              );
            } catch (err) {
              logger.warn(
                "content",
                `An error was encountered while creating the JSON schema for the ${entryKey} entry in ${collectionKey} collection. Proceeding without it. Error: ${err}`
              );
            }
          }
        }
        dataTypesStr += `};
`;
        break;
    }
  }
  if (!fs.existsSync(contentPaths.cacheDir)) {
    fs.mkdirSync(contentPaths.cacheDir, { recursive: true });
  }
  const configPathRelativeToCacheDir = normalizeConfigPath(
    contentPaths.cacheDir.pathname,
    contentPaths.config.url.pathname
  );
  for (const contentEntryType of contentEntryTypes) {
    if (contentEntryType.contentModuleTypes) {
      typeTemplateContent = contentEntryType.contentModuleTypes + "\n" + typeTemplateContent;
    }
  }
  typeTemplateContent = typeTemplateContent.replace("// @@CONTENT_ENTRY_MAP@@", contentTypesStr);
  typeTemplateContent = typeTemplateContent.replace("// @@DATA_ENTRY_MAP@@", dataTypesStr);
  typeTemplateContent = typeTemplateContent.replace(
    "'@@CONTENT_CONFIG_TYPE@@'",
    contentConfig ? `typeof import(${configPathRelativeToCacheDir})` : "never"
  );
  await fs.promises.writeFile(
    new URL(CONTENT_TYPES_FILE, contentPaths.cacheDir),
    typeTemplateContent
  );
}
export {
  createContentTypesGenerator
};
