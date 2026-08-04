# 决策记录（ADR）

本页记录开发过程中做出的关键技术与架构决策，以及踩过的坑。**为什么这么做** 这类信息在代码里读不出来，是贡献者最需要的上下文。

## 1. 存储选型：localStorage + IndexedDB，不用 chrome.storage

**决策**：

- 配置数据（主题、搜索引擎、Dock、启动台）→ **localStorage**，原生 JS 即可读写，无需任何权限
- 壁纸图片（Blob 大文件）→ **IndexedDB**（库 `shanfeng-wallpaper`）
- 不使用 `chrome.storage`：它需要 `storage` 权限，且异步 API 更繁琐，对"同源页面共享数据"的场景没有优势

**影响**：

- Chromium manifest 权限最小化到只剩 `activeTab`
- popup 与 newtab 通过 `storage` 事件实现跨页面实时同步
- ⚠️ 数据按 origin 隔离：localhost 与公网域名、扩展页面与普通网站之间 localStorage **不互通**

## 2. MV3 权限最小化

**现状**（Chromium manifest）：

```json
"permissions": ["activeTab"],
"host_permissions": ["https://suggestion.baidu.com/*"]
```

- `activeTab`：点击工具栏图标时临时授予读取当前页信息的能力，用于 popup 收藏网页；无 `<all_urls>` 侵入性权限
- `host_permissions` 只有百度搜索建议域：搜索联想词的跨域请求必需

在这个项目之前有一个项目，权限申请了 `<all_urls>` 和 storage ，每次更新审核都很慢。新项目就改成只申请 `activeTab` + 百度联想词相关域名。

**影响**：

- popup 收藏网页功能可用
- 搜索联想词功能可用
- 无任何全站访问权限，安全性更高
- 无法实现 WebDAV 云端同步（已废弃），只能做纯本地手动备份（导出/导入 JSON）

## 3. 跨页面同步：storage 事件

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

## 4. 动态取色三层降级

三层兜底保证界面永远可用：

1. `colorExtractor.extractAndApply()` 失败 → JS 调用 `applyDefaultPalette(isDark)` 注入默认蓝紫色板
2. CSS 层面 `:root` / `[data-theme="dark"]` 再定义一份默认色板，作为最终兜底

取色引擎本身：Canvas 50×50 采样 → 色相分桶（12 桶 × 30°）→ 饱和度加权主色 → HSL tone 映射生成 M3 色板 → 写入 CSS 变量。

## 5. 启动闪白处理

扩展页面在壁纸/字体加载前可能出现白屏闪烁。解决：`index.html` 内置启动屏 `<div id="splash-screen">`（背景 `#323232`），`main.ts` 中应用挂载后 100ms 淡出、800ms 移除。

## 6. 废弃路线（不要再走）

- **WebDAV 云端同步**：已废弃，只保留纯本地手动备份（导出/导入 JSON）。manifest 中相关 `host_permissions` 已全部移除
- **Dock 拖拽排序/删除**：实现起来麻烦，而且firefox兼容性差，已改为右键菜单「左移/右移」相邻交换方案。
