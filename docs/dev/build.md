# 构建与发布

## 构建命令

```bash
npm run build
```

实际执行链路（`package.json` scripts）：

1. `type-check`（vue-tsc 类型检查）
2. `build-only`（vite build → `dist/`）
3. `postbuild` 自动触发 `node build-extension.js`，把产物同步到两个扩展目录

然后再浏览器中加载 `extensions/Chromium` 或 `extensions/Firefox` 即可。
每次构建就会更新插件，直接查看效果。

## 双浏览器扩展体系

仓库维护 **Chromium** 与 **Firefox** 两个独立扩展目录：

```
extensions/
├── Chromium/
│   ├── manifest.json        ← 手动维护，构建不覆盖
│   ├── index.html           ← 构建产物（vite build 输出）
│   ├── assets/              ← 构建产物（JS / CSS / 图片）
│   ├── favicon.ico          ← 构建产物
│   ├── popup/               ← 手动维护（原生 JS 面板）
│   ├── icons/               ← 手动维护
│   ├── service-worker.js    ← 手动维护
│   └── _locales/            ← 手动维护（扩展名称多语言）
└── Firefox/                 ← 结构相同，manifest 按 Firefox 规范
```

### build-extension.js 的同步规则

| 文件                                    | 处理方式                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| `index.html` / `assets` / `favicon.ico` | **构建产物**：每次构建先删除再复制（防止旧 hash 文件残留）     |
| `popup` / `icons` / `_locales`          | **共享文件**：从 Chromium 同步到 Firefox，只维护 Chromium 一份 |
| `manifest.json` / `service-worker.js`   | **按浏览器各自维护**，构建不覆盖、不同步                       |

## Chromium 与 Firefox 的 manifest 差异

| 项                                   | Chromium                            | Firefox                                                      |
| ------------------------------------ | ----------------------------------- | ------------------------------------------------------------ |
| `background`                         | `service_worker` + `type: "module"` | `scripts` 数组（event page）                                 |
| `permissions`                        | `["activeTab"]`                     | `["storage", "activeTab"]`                                   |
| `browser_specific_settings.gecko.id` | 无                                  | 必须（`shanfeng-newtab@shanfeng`）                           |
| `strict_min_version`                 | 无                                  | `142.0`（MV3 特性下限）                                      |
| 数据收集声明                         | 无                                  | `data_collection_permissions.required: ["none"]`（商店要求） |

其余字段（`chrome_url_overrides.newtab`、`action.default_popup`、`host_permissions` 等）两边一致。

> ⚠️ 修改权限或新增字段时，务必同步检查两个 manifest——它们不会自动对齐。

## 手动维护清单

以下文件不进构建流程，改动后需手动同步（`popup` / `icons` / `_locales` 只需改 Chromium，构建时自动同步到 Firefox）：

- `extensions/Chromium/manifest.json`（及 Firefox 版）
- `extensions/Chromium/service-worker.js`（及 Firefox 版）
- `extensions/Chromium/popup/`（popup.html / popup.js / popup.css）
- `extensions/Chromium/icons/`
- `extensions/Chromium/_locales/zh_CN/messages.json`

## 文档站（本仓库）

文档站基于 VitePress，源码在 `docs/` 目录：

```bash
npm run docs:dev       # 本地开发预览
npm run docs:build     # 构建静态站点
npm run docs:preview   # 预览构建产物
```
