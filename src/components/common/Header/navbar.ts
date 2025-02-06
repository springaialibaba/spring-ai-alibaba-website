import DocsMenu from "./DocsMenu.astro";
import CommunityMenu from "./CommunityMenu.astro";
import LearnMenu from "./LearnMenu.astro";
import SolutionsMenu from "./SolutionsMenu.astro";


export default [
  {
    label: "文档",
    translations: {
      en: "DOCS",
    },
    trigger: "hover",
    slot: DocsMenu,
    position: "absolute",
    activePath: ["/docs"],
  },
  {
    label: "博客",
    translations: {
      en: "BLOG",
    },
    trigger: "click",
    target: "_self",
    route: "/blog/",
  },
  {
    label: "插件生态",
    translations: {
      en: "Tools",
    },
    trigger: "click",
    target: "_self",
    route: "/cloud/",
    activePath: ["/cloud"],
  },
  {
    label: "脚手架",
    translations: {
      en: "Initializer",
    },
    trigger: "click",
    target: "_self",
    route: "/initializer/",
    activePath: ["/initializer"],
  },
  {
    label: "社区",
    translations: {
      en: "COMMUNITY",
    },
    trigger: "hover",
    relativePosition: 'page',
    slot: CommunityMenu,
    position:"absolute",
    activePath: ["/news", "/activity", "/blog", "/docs/ebook/", "/download"],
  },
];