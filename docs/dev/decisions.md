# 决策记录（ADR）

本页记录开发过程中做出的关键技术与架构决策，以及踩过的坑。**为什么这么做** 这类信息在代码里读不出来，是贡献者最需要的上下文。

## 1. 存储选型：localStorage + IndexedDB，不用 chrome.storage

**背景**：newtab 与 popup 都是 `chrome-extension://<id>/` 下的页面，**同源共享 localStorage**。

**决策**：

- 配置数据（主题、搜索引擎、Dock、启动台）→ **localStorage**，原生 JS 即可读写，无需任何权限
- 壁纸图片（Blob 大文件）→ **IndexedDB**（库 `shanfeng-wallpaper`）
- 不使用 `chrome.storage`：它需要 `storage` 权限，且异步 API 更繁琐，对"同源页面共享数据"的场景没有优势

**影响**：

- Chromium manifest 权限最小化到只剩 `activeTab`（详见 §3）
- popup 与 newtab 通过 `storage` 事件实现跨页面实时同步（详见 §5）
- ⚠️ 数据按 origin 隔离：localhost 与公网域名、扩展页面与普通网站之间 localStorage **不互通**

## 2. popup 零依赖：刻意保持原生 JS

**背景**：点击工具栏图标弹出的网页收藏面板（popup）。

**决策**：popup 用**原生 JS**（`popup/popup.html` + `popup.js` + `popup.css`），不引入 Vue / Pinia 运行时，不经过 Vite 打包，零依赖。

**理由**：

- popup 只做一件事：读当前页信息 → 写入 localStorage，原生 JS 足够
- 体积小、打开快（工具栏弹窗要即时响应）
- 与 newtab 通过 localStorage 松耦合，不需要共享代码

**代价**：newtab 与 popup 存在少量重复逻辑（如 URL 补全协议、id 生成）。若未来逻辑膨胀，可将纯函数抽取为共享模块，或为 Vite 配置多入口把 popup 升级为 Vue 应用。

## 3. MV3 权限最小化（及一个已知坑）

**现状**（Chromium manifest）：

```json
"permissions": ["activeTab"],
"host_permissions": ["https://suggestion.baidu.com/*"]
```

- `activeTab`：点击工具栏图标时临时授予读取当前页信息的能力，用于 popup 收藏网页；无 `<all_urls>` 侵入性权限
- `host_permissions` 只有百度搜索建议域：搜索联想词的跨域请求必需

**已知坑（遗留问题）**：`chrome.storage` API 需要 `storage` 权限，而 Chromium manifest 没有声明 → 旧版数据迁移脚本 `migrate.js` 因 `!chrome.storage` 直接 return，**迁移实际不执行**。当前版本所有用户数据均从 localStorage 全新开始，若需支持旧数据迁移，需在 manifest 补 `storage` 权限（或在迁移脚本中改用兼容方案）。

**双浏览器差异**：Firefox manifest 保留了 `storage` 权限（历史原因），两边的 manifest **各自独立维护**，构建脚本不覆盖。修改权限时务必同步检查两个文件。

## 4. MV3 默认 CSP 约束

MV3 扩展页面受默认 CSP 限制：`script-src 'self'`，**禁止内联脚本、`eval`、`new Function`**。

**本项目的应对**：

- 所有脚本通过外部文件引入（Vite 打包产物 + `migrate.js` 以 `<script src>` 引入，而非内联）
- 运行时无 `eval` / `new Function`，天然合规
- 不要往 HTML 里塞 `<script>...</script>` 内联代码，会被 CSP 拦截

## 5. 跨页面同步：storage 事件

**机制**：

```
popup 写入 localStorage
  → 浏览器向同源其他页面触发 storage 事件
  → launchStore / shortcutStore 监听：重载数据
  → Vue 响应式 → 启动台 / Dock 界面即时刷新
```

**实现要点**：

- 监听 `window.addEventListener("storage", e => ...)`，只处理本 store 的键，异常 JSON 静默忽略
- **消费组件必须通过 store 属性访问**（如 `launchStore.items`），不能解构——跨页面同步靠替换数组引用触发更新，解构会丢失响应式

## 6. 动态取色三层降级

壁纸取色可能因跨域、网络、图片加载等原因失败，三层兜底保证界面永远可用：

1. `colorExtractor.extractAndApply()` 失败 → JS 调用 `applyDefaultPalette(isDark)` 注入默认蓝紫色板
2. CSS 层面 `:root` / `[data-theme="dark"]` 再定义一份默认色板，作为最终兜底

取色引擎本身：Canvas 50×50 采样 → 色相分桶（12 桶 × 30°）→ 饱和度加权主色 → HSL tone 映射生成 M3 色板 → 写入 CSS 变量。

## 7. 启动闪白处理

扩展页面在壁纸/字体加载前可能出现白屏闪烁。解决：`index.html` 内置启动屏 `<div id="splash-screen">`（背景 `#323232`），`main.ts` 中应用挂载后 100ms 淡出、800ms 移除。

## 8. 废弃路线（不要再走）

- **`chrome_settings_overrides.homepage`**：仅商店安装生效，Load unpacked 看不到效果；2018 年后 Chrome 商店不再接受纯改主页的扩展。替换新标签页的正路是 `chrome_url_overrides.newtab`
- **WebDAV 云端同步**：已废弃，只保留纯本地手动备份（导出/导入 JSON）。manifest 中相关 `host_permissions` 已全部移除
- **Dock 拖拽排序/删除**：2026/08 重构移除。Dock 顺序 = 数组顺序，删除统一走右键菜单，减少拖拽相关的状态复杂度
- **Dock 排序改用右键菜单「左移/右移」**（2026-08-04）：拖拽排序在 Firefox 上兼容性差、状态复杂，已用相邻交换方案替代。`shortcutStore.moveItem(id, ±1)` 用 `splice` 相邻交换，数组顺序即显示顺序，无需任何拖拽状态机；菜单项在边界时禁用（`pointer-events:none` + 逻辑层双重校验），`localStorage` + `storage` 事件同步链路全复用
