# 山风新页

山风新页是一个 Chrome/Firefox 浏览器新标签页扩展，在用户打开新标签时替换默认空白页。

**精美壁纸 + Material You 动态取色毛玻璃 + 快捷搜索 + 可定制 Dock + 启动台 + 手动备份**，开源（MIT），纯本地存储，无任何云端依赖。

## 文档

完整文档见 [docs/](docs/)，包含[用户指南](docs/guide/install.md)与[开发者文档](docs/dev/architecture.md)（架构、决策记录、构建发布）。

```bash
npm run docs:dev       # 本地预览文档站
```

## 安装

edge: [edge商店](https://microsoftedge.microsoft.com/addons/detail/%E5%B1%B1%E9%A3%8E%E6%96%B0%E9%A1%B5/jamooijddnckllcpmjocfnhlapldojkb)

firefox: 暂未上线

chrome: 暂未上线

## 快速开始

```bash
npm install
npm run dev        # 开发预览 newtab 页面
npm run build      # 构建扩展产物
```

构建成功后，`dist` 下的内容自动复制到 `extensions/Chromium` 和 `extensions/Firefox`，直接在浏览器中加载对应目录即可（详见[安装指南](docs/guide/install.md)）。

## 目录结构

```
├── src/                    # Vue 应用源码
│   ├── pages/              # 页面（新标签页主页面）
│   ├── components/         # UI 组件（clock/search/dock/launch/settings/common）
│   ├── composables/        # 可复用逻辑（搜索联想、Toast）
│   ├── stores/             # Pinia 状态（主题/壁纸/搜索/Dock/启动台）
│   ├── utils/              # 工具（M3 取色、IndexedDB、SVG）
│   └── assets/             # 设计令牌 + 静态资源
├── extensions/             # 构建产物（Chromium / Firefox 双扩展目录）
├── docs/                   # VitePress 文档站源码
└── build-extension.js      # 双浏览器构建同步脚本
```

## 协议

[MIT](LICENSE)
