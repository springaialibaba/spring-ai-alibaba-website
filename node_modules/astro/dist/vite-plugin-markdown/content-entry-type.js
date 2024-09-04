import { fileURLToPath } from "node:url";
import { safeParseFrontmatter } from "../content/utils.js";
const markdownContentEntryType = {
  extensions: [".md"],
  async getEntryInfo({ contents, fileUrl }) {
    const parsed = safeParseFrontmatter(contents, fileURLToPath(fileUrl));
    return {
      data: parsed.data,
      body: parsed.content,
      slug: parsed.data.slug,
      rawData: parsed.matter
    };
  },
  // We need to handle propagation for Markdown because they support layouts which will bring in styles.
  handlePropagation: true
};
export {
  markdownContentEntryType
};
