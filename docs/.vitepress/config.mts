import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "山风新页",
  description: "一款基于 Material You 动态取色与毛玻璃设计的新标签页浏览器扩展",
  titleTemplate: ":title - 山风新页",
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", href: "/icons/icon.png" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "山风新页,新标签页,浏览器扩展,Chrome,Firefox,Material You,M3,毛玻璃,壁纸",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "山风新页" }],
    ["meta", { property: "og:title", content: "山风新页" }],
    [
      "meta",
      {
        property: "og:description",
        content: "精美壁纸、动态取色 M3 毛玻璃、快捷搜索的新标签页扩展",
      },
    ],
    ["meta", { property: "og:locale", content: "zh_CN" }],
  ],

  themeConfig: {
    logo: "/icons/icon.png",
    siteTitle: "山风新页",

    nav: [
      { text: "指南", link: "/guide/install", activeMatch: "^/guide/" },
      { text: "开发", link: "/dev/architecture", activeMatch: "^/dev/" },
      {
        text: "更新日志",
        link: "/changelog",
      },
      {
        text: "GitHub",
        link: "https://github.com/WenAnrong/newShanfeng",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "用户指南",
          items: [
            { text: "安装", link: "/guide/install" },
            { text: "使用指南", link: "/guide/usage" },
            { text: "常见问题", link: "/guide/faq" },
          ],
        },
      ],
      "/dev/": [
        {
          text: "开发者文档",
          items: [
            { text: "架构设计", link: "/dev/architecture" },
            { text: "决策记录", link: "/dev/decisions" },
            { text: "构建与发布", link: "/dev/build" },
          ],
        },
      ],
    },

    search: { provider: "local" },
    outline: { level: [2, 3], label: "本页目录" },
    docFooter: { prev: "上一页", next: "下一页" },
    lastUpdated: {
      text: "最后更新",
      formatOptions: { dateStyle: "full", timeStyle: "medium" },
    },
    darkModeSwitchLabel: "外观",
    sidebarMenuLabel: "菜单",
    returnToTopLabel: "返回顶部",
    footer: {
      message: "山风新页 - MIT License",
      copyright: "京ICP备XXXXXXXX号 | 京公网安备XXXXXXXX号",
    },
  },
});
