# 架构设计

山风新页是一个 **MV3 浏览器扩展**：newtab 页面（Vue 应用）承担主要功能，popup 为原生 JS 小面板，构建产物输出为可直接加载的扩展目录。

## 技术栈

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| Vue 3 | ^3.5 | 响应式 UI 框架 |
| TypeScript | ~6.0 | 类型安全 |
| Pinia | ^3.0 | 共享状态管理 |
| Vite | ^8.0 | 构建工具 |
| sass-embedded | ^1.100 | SCSS 样式编译 |
| @vueuse/core | ^14.3 | 开箱即用的组合式工具 |
| lunar-javascript | ^1.7 | 农历计算（无运行时依赖） |

## 分层架构

```
┌──────────────────────────────────────────────────────┐
│  Pages (src/pages/)            路由页面编排层          │
│  └─ index.vue                  新标签页主页面          │
├──────────────────────────────────────────────────────┤
│  Components (src/components/)  UI 组件层              │
│  ├─ clock/                    时钟 + 农历             │
│  ├─ search/                   搜索框 / 引擎选择 / 联想  │
│  ├─ dock/                     Dock 快捷方式栏          │
│  ├─ launch/                   启动台底部抽屉            │
│  ├─ settings/                 设置面板（4 个分区）      │
│  └─ common/                   通用组件（EditDialog/Toast）│
├──────────────────────────────────────────────────────┤
│  Composables (src/composables/)  可复用组合式逻辑      │
│  ├─ useSearchSuggestions.ts   百度联想建议              │
│  └─ useToast.ts               全局消息提示              │
├──────────────────────────────────────────────────────┤
│  Stores (src/stores/)         业务状态管理（Pinia）    │
│  ├─ themeStore.ts             主题（light/dark/auto）  │
│  ├─ wallpaperStore.ts         壁纸管理（IndexedDB）    │
│  ├─ searchStore.ts            搜索引擎管理              │
│  ├─ shortcutStore.ts          Dock 快捷方式            │
│  └─ launchStore.ts            启动台网站                │
├──────────────────────────────────────────────────────┤
│  Utils (src/utils/)           纯工具层（不依赖 Vue）   │
│  ├─ colorExtractor.ts         M3 动态取色引擎          │
│  ├─ db.ts                     IndexedDB 封装           │
│  └─ svg.ts                    SVG 图标检测/获取         │
├──────────────────────────────────────────────────────┤
│  Assets (src/assets/)         设计令牌 + 静态资源       │
│  ├─ _m3-tokens.scss           M3 设计令牌（颜色/阴影/圆角/动效）│
│  ├─ _glass.scss               毛玻璃 / Tonal Surface 混入 │
│  ├─ _animations.scss          M3 Motion 缓动令牌        │
│  ├─ _variables.scss           响应式断点（3 档）        │
│  ├─ main.css                  全局重置 + 默认色板        │
│  └─ bg/ engines-icon/ setting-icon/ svgs/  静态资源     │
└──────────────────────────────────────────────────────┘
```

## 目录说明

### src/components 分组

| 目录 | 组件 | 职责 |
| --- | --- | --- |
| clock | ClockPanel | 时钟 + 农历展示 |
| search | SearchBox / SearchEnginePicker / SearchSuggestion | 搜索输入、引擎切换、联想下拉 |
| dock | DockPanel | 底部快捷方式栏（右键菜单：打开 / 左移右移排序 / 编辑 / 删除） |
| launch | LaunchPanel | 启动台底部抽屉（bottom sheet） |
| settings | SettingsPanel + Appearance / SearchEngine / Sync / About | 设置面板及四个分区 |
| common | EditDialog / Toast | 通用编辑弹窗、全局消息提示 |

### 数据流模式

- **Store 持有数据**：各 store 负责读写 localStorage（或 IndexedDB），组件只消费 store 状态
- **属性访问而非解构**：跨页面同步依赖 storage 事件替换数组引用，组件需通过 `store.items` 属性访问（解构会丢失响应式）
- **跨页面同步**：popup 与 newtab 同源共享 localStorage，写入后通过 `storage` 事件通知另一页面实时刷新（详见[决策记录](./decisions)）

## 数据存储总览

| 存储 | 内容 | 键 |
| --- | --- | --- |
| localStorage | 主题模式 | `theme-mode` |
| localStorage | 当前搜索引擎 / 列表 / 打开方式 | `search-engine` / `search-list` / `search-open-mode` |
| localStorage | Dock 快捷方式（注意拼写即如此） | `shoutcut-list` |
| localStorage | 启动台网站 | `launch-list` |
| IndexedDB | 亮/暗壁纸 Blob（库 `shanfeng-wallpaper`，表 `wallpapers`） | `light` / `dark` |

## 样式体系

- **颜色全部通过 M3 令牌引用**（`_m3-tokens.scss` 映射 CSS 变量 `--md-sys-color-*`），由 `colorExtractor.ts` 从壁纸取色后动态注入 `:root`
- **两类表面**：壁纸之上的交互元素用毛玻璃（`glass-surface` mixin），覆盖层面板用不透明 Tonal Surface（`tonal-surface` mixin）
- **响应式 3 档断点**：compact < 1440px / standard 1440–2560px（默认）/ wide > 2560px，通过 `_variables.scss` 的 mixin 使用
- **动画统一 M3 Motion 令牌**（时长 + 缓动），定义在 `_animations.scss`
