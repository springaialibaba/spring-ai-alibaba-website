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
    label: "企业版 SCA",
    translations: {
      en: "SCA CLOUD",
    },
    trigger: "click",
    target: "_self",
    route: "/cloud/",
    activePath: ["/cloud"],
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
    label: "学习",
    translations: {
      en: "LEARN",
    },
    trigger: "hover",
    slot: LearnMenu,
    position: "absolute",
    relativePosition: 'page',
    activePath: ["/learn"],
  },
  // {
  //   label: "答疑样例",
  //   translations: {
  //     en: "FAQ",
  //   },
  //   trigger: "click",
  //   target: "_self",
  //   route: "/faq/",
  //   activePath: ["/faq"],
  // },
];