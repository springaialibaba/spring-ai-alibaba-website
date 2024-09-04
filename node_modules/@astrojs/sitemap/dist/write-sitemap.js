import { createWriteStream } from "fs";
import { normalize, resolve } from "path";
import { Readable, pipeline } from "stream";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import replace from "stream-replace-string";
import { SitemapAndIndexStream, SitemapStream } from "sitemap";
async function writeSitemap({
  hostname,
  sitemapHostname = hostname,
  sourceData,
  destinationDir,
  limit = 5e4,
  publicBasePath = "./"
}, astroConfig) {
  await mkdir(destinationDir, { recursive: true });
  const sitemapAndIndexStream = new SitemapAndIndexStream({
    limit,
    getSitemapStream: (i) => {
      const sitemapStream = new SitemapStream({
        hostname
      });
      const path = `./sitemap-${i}.xml`;
      const writePath = resolve(destinationDir, path);
      if (!publicBasePath.endsWith("/")) {
        publicBasePath += "/";
      }
      const publicPath = normalize(publicBasePath + path);
      let stream;
      if (astroConfig.trailingSlash === "never" || astroConfig.build.format === "file") {
        const host = hostname.endsWith("/") ? hostname.slice(0, -1) : hostname;
        const searchStr = `<loc>${host}/</loc>`;
        const replaceStr = `<loc>${host}</loc>`;
        stream = sitemapStream.pipe(replace(searchStr, replaceStr)).pipe(createWriteStream(writePath));
      } else {
        stream = sitemapStream.pipe(createWriteStream(writePath));
      }
      return [new URL(publicPath, sitemapHostname).toString(), sitemapStream, stream];
    }
  });
  let src = Readable.from(sourceData);
  const indexPath = resolve(destinationDir, `./sitemap-index.xml`);
  return promisify(pipeline)(src, sitemapAndIndexStream, createWriteStream(indexPath));
}
export {
  writeSitemap
};
