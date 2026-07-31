# 山风新页 设计文档

> 浏览器新标签页扩展。该文档会随着开发不断调整。
> 文档最后修改时间：2026/07/31

---

## 0. 当前设计缺少的部分

- 设计一个在当前页打开或者在新建标签页打开的选项（搜索部分）
- 启动台自定义添加/删除网站
- 备份与同步（WebDAV）
- Dock 快捷方式持久化存储

---

## 1. 项目概述

### 1.1 产品定义

山风新页是一个 Chrome/Firefox 浏览器新标签页扩展，在用户打开新标签时替换默认空白页。核心价值：**精美壁纸背景 + 快捷搜索 + 可定制 Dock 快捷方式 + 收藏夹管理 + webdav同步 + 开源** 。

### 1.2 目标用户

浏览器重度用户，追求新标签页的美观与效率，关注数据隐私。

---

## 2. 技术栈

| 技术             | 版本   | 选型理由                           |
| ---------------- | ------ | ---------------------------------- |
| Vue 3            | ^3.5   | 响应式设计，开发快速，方便         |
| TypeScript       | ^6.0   | 类型安全                           |
| Pinia            | ^3.0   | 用于存储各种共享信息               |
| sass-embedded    | ^1.100 | 便于编写css代码                    |
| @vueuse/core     | ^14.3  | 各种开箱即用工具                   |
| lunar-javascript | ^1.7   | 纯 JS 农历库，无运行时依赖，体积小 |

---

## 3. 整体架构

### 3.1 分层架构

```
┌──────────────────────────────────────────────┐
│  Pages (pages/)          路由页面编排层        │
│  └─ index.vue            主页面              │
├──────────────────────────────────────────────┤
│  Components (components/)  UI 组件层          │
│  ├─ clock/                时钟 + 农历         │
│  ├─ search/               搜索框              │
│  ├─ dock/                 快捷方式栏          │
│  ├─ settings/             设置面板            │
│  ├─ launch/               底部抽屉启动台        │
│  └─ common/               Toast等            │
├──────────────────────────────────────────────┤
│  Composables (composables/) 可复用逻辑         │
│  ├─ useSearchSuggestions.ts  搜索建议         │
│  └─ useToast.ts              提示消息         │
├──────────────────────────────────────────────┤
│  Stores (stores/)         业务状态管理        │
│  ├─ shortcutStore.ts      dock栏的快捷方式    │
│  ├─ searchStore.ts        搜索引擎管理        │
│  ├─ wallpaperStore.ts     壁纸管理            │
│  ├─ themeStore.ts         主题管理            │
│  └─ launchStore.ts        启动台管理          │
├──────────────────────────────────────────────┤
│  Utils (utils/)           工具层              │
│  ├─ colorExtractor.ts     M3 动态取色引擎     │
│  ├─ db.ts                 壁纸IndexedDB存储   │
│  └─ svg.ts                svg检测/获取        │
├──────────────────────────────────────────────┤
│  Assets (assets/)         设计令牌 + 样式      │
│  ├─ _m3-tokens.scss       M3 设计令牌层       │
│  ├─ _glass.scss           M3 融合毛玻璃样式    │
│  ├─ _animations.scss      M3 Motion 缓动       │
│  ├─ _variables.scss       响应式断点 + 布局    │
│  └─ main.css              全局重置 + 默认色板   │
└──────────────────────────────────────────────┘
```

---

## 4. 详细设计

### 4.1 响应式大小

#### 4.1.1 设计定位

> 山风新页定位为 **桌面端浏览器新标签页**，不考虑手机端。需覆盖竖屏（portrait monitor）和高分辨率（4K）显示器场景。

#### 4.1.2 断点方案（3 档）

桌面专用，以 **水平视口宽度** 为判断依据：

| 档位         | 宽度范围        | 适用场景                                          |
| ------------ | --------------- | ------------------------------------------------- |
| **compact**  | < 1440px        | 竖屏显示器（1080×1920）、13" 笔记本、窗口化较窄时 |
| **standard** | 1440px ~ 2560px | 主流桌面显示器（1080p/2K）、笔记本外接            |
| **wide**     | > 2560px        | 4K 及以上（3840×2160）、超宽屏                    |

standard 为默认基线（无需 media query），compact 用 `max-width` 约束，wide 用 `min-width` 开启增强布局。

```scss
// Sass 变量
$bp-compact: 1440px; // 竖屏/小笔记本上限
$bp-wide: 2560px; // 4K 开启下限

// 实际使用
// compact: 竖屏、小窗口
@media (max-width: #{$bp-compact - 1px}) {
}

// standard: 默认（无需 media query）
// ... 1440px ~ 2560px 都适用

// wide: 4K / 超宽屏
@media (min-width: $bp-wide) {
}
```

#### 4.1.3 实施规范

**Sass 变量管理**：在 `src/assets/_variables.scss` 中统一定义：

```scss
// 断点
$bp-compact: 1440px;
$bp-wide: 2560px;
```

**代码隔离**：各组件的响应式样式写在各自 `.vue` 文件的 `<style scoped lang="scss">` 内部，不耦合到全局。

**Sass mixin 辅助**：

```scss
@mixin compact {
  @media (max-width: #{$bp-compact - 1px}) {
    @content;
  }
}
@mixin wide {
  @media (min-width: $bp-wide) {
    @content;
  }
}
@mixin portrait {
  @media (orientation: portrait) {
    @content;
  }
}
```

### 4.2 搜索联想词建议

实现函数为 `src/composables/useSearchSuggestions.ts` 。

具体实现逻辑：

```text
用户输入 (SearchBox.vue)
  → onInput(): input.length >= 2 时显示建议
  → <SearchSuggestion :query="input" />

SearchSuggestion.vue 监听 query 变化
  → fetchSuggestions(query)  [100ms 防抖]
  → useSearchSuggestions.ts:
       GET https://suggestion.baidu.com/su?wd=关键词&cb=window.baidu.sug
       → GBK 解码 → 解析 JSONP 回调 → 提取 data.s (string[])
       → suggestions.value = 联想词列表
  → v-for 渲染下拉列表
```

#### 4.2.1 使用方式

**`useSearchSuggestions` composable 用法：**

```ts
import { useSearchSuggestions } from "@/composables/useSearchSuggestions";

const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
  useSearchSuggestions();

// 输入变化时调用（内部已做 100ms 防抖）
fetchSuggestions("关键词");

// 获取联想词列表
console.log(suggestions.value); // string[]

// 清空
clearSuggestions();
```

### 4.3 层叠关系

Teleport 组件（SettingsPanel、LaunchPanel、Toast、Popover）渲染在 `<body>` 下，与 `.container` 分属不同层叠上下文。因此 `.container` 内 z-index 只对容器内组件有效。

**实际覆盖规则：**

| 谁盖谁                           | 原因                                    |
| -------------------------------- | --------------------------------------- |
| Toast 盖一切                     | z-index: 999，body 层级最高             |
| 右键菜单盖 Setting / Launch 遮罩 | z-index: 300 > 200                      |
| Setting 遮罩盖主界面             | 在 body 层叠上下文，container = auto(0) |
| Setting / Launch 不冲突          | 互斥显示，永远不同时存在                |
| Dock > 主内容                    | 容器内 z-index: 1 > 1                   |

container 内部仅保留 3 层：`bg(0) → 遮罩(0) → 主内容(1)`，均不对外生效。

### 4.4 主题与颜色系统（Material You + Glassmorphism）

主题系统采用 **Material You (M3) 动态取色 + Glassmorphism 融合方案**，UI 颜色从壁纸自动提取。

#### 4.4.1 设计理念

- **壁纸之上用毛玻璃**（SearchBox、Dock）—— 保留壁纸可见性
- **覆盖层用 Tonal Surface**（SettingsPanel、LaunchPanel）—— 不透明卡片 + elevation 阴影，摆脱毛玻璃疲劳
- **颜色跟随壁纸走**—— 换壁纸，整个 UI 色调自动跟随

#### 4.4.2 动态取色流程

```text
壁纸变化（切换主题 / 更换壁纸）
  │
  ▼
index.vue watch(bgImage, effectiveTheme)
  │
  ▼
src/utils/colorExtractor.ts
  ├─ loadImage(url)          创建 Image，加载壁纸到 Canvas
  ├─ samplePixels(img)       50×50 像素采样
  ├─ extractDominantColor()  色相分桶（12桶×30°）→ 饱和度加权 → 主色
  ├─ generatePalette(rgb, isDark)  HSL tone 映射 → M3 色板
  └─ injectPalette()         setProperty 写入 :root CSS 变量
```

#### 4.4.3 M3 色板输出

动态注入到 `:root` 的 CSS 自定义属性（共 10 个核心 token）：

| 令牌                                  | 用途                     |
| ------------------------------------- | ------------------------ |
| `--md-sys-color-primary`              | 主色（按钮、选中态）     |
| `--md-sys-color-on-primary`           | 主色上的文字             |
| `--md-sys-color-primary-container`    | 主色浅底（选中背景）     |
| `--md-sys-color-on-primary-container` | 主色浅底上的文字         |
| `--md-sys-color-surface`              | 表面色（面板背景）       |
| `--md-sys-color-on-surface`           | 表面文字                 |
| `--md-sys-color-surface-variant`      | 次要表面（表单、分割区） |
| `--md-sys-color-on-surface-variant`   | 次要表面文字             |
| `--md-sys-color-outline`              | 边框色                   |
| `--md-sys-color-outline-variant`      | 浅边框色                 |
| `--md-glass-bg`                       | 毛玻璃背景（带动态色调） |
| `--md-glass-border`                   | 毛玻璃边框               |

亮/暗模式由 `data-theme` 属性选择器控制，取色引擎根据 `isDark` 切换色板 tone 范围（暗色取 tone 6-30，亮色取 tone 80-98）。

#### 4.4.4 设计令牌层

`src/assets/_m3-tokens.scss` 提供 4 类令牌，所有 SCSS 文件通过 `@use` 引用：

| 类别          | 令牌                                                                                               | 说明                             |
| ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------- |
| 颜色          | `$m3-primary`, `$m3-surface`, `$m3-outline` 等                                                     | 映射 CSS var                     |
| Elevation     | `$m3-elevation-0` ~ `$m3-elevation-5`                                                              | 阴影层级                         |
| Shape         | `$m3-shape-sm(8px)` / `md(12px)` / `lg(16px)` / `xl(28px)`                                         | 圆角                             |
| Motion        | `$m3-duration-medium(200ms)` / `long(300ms)`, `$m3-easing-standard` / `emphasized` / `decelerated` | 缓动 + 时长                      |
| State Layer   | `@mixin state-layer-hover($color)` / `state-layer-active`                                          | hover/active 迭加 8%/12% 透明度  |
| Glass Surface | `@mixin glass-surface($elevation)`                                                                 | 毛玻璃面板，接受 elevation 级别  |
| Tonal Surface | `@mixin tonal-surface($elevation)`                                                                 | 不透明面板，M3 surface 色 + 阴影 |

#### 4.4.5 组件分层策略

| 组件                                  | 表面类型                        | 说明                                     |
| ------------------------------------- | ------------------------------- | ---------------------------------------- |
| SearchBox                             | `glass-surface(2)`              | 壁纸之上，毛玻璃浮起                     |
| DockPanel                             | `glass-surface(2)`              | 同 SearchBox                             |
| SettingsPanel                         | `tonal-surface(4)` + scrim 遮罩 | 不透明卡片，M3 dialog 风格               |
| LaunchPanel                           | `tonal-surface(4)` + scrim 遮罩 | 底部抽屉（bottom sheet），从下方向上滑入 |
| SearchEnginePicker / SearchSuggestion | `glass-surface(3)`              | 弹窗，高 elevation 毛玻璃                |
| 右键菜单                              | `glass-surface(3)`              | 同上                                     |
| Toast                                 | 直接 glass-bg + blur            | 轻量毛玻璃                               |

#### 4.4.6 主题共享

（同 4.4.2 节内容，保持不变）

### 4.5 Toast 提醒

> 轻量级消息提示，用于操作反馈（复制成功、设置保存、收藏等）。

#### 4.5.1 架构

```text
useToast.ts              ← 状态管理
  维护全局响应式消息队列
  导出 show() 函数
        │
        ▼
Toast.vue               ← 视图渲染
  用 Teleport 挂到 body
  读取 useToast 的消息队列
  TransitionGroup 动画
        │
        ▼
     index.vue     ← 挂载点
  只放一次 <Toast />
```

#### 4.5.2 接口示例

```ts
// useToast.ts — 导出
function show(text: string, type?: "info" | "success" | "error"): void;
// 调用示例
show("已复制到剪贴板");
show("保存成功", "success", 3000);
show("操作失败", "error");
```

#### 4.5.3 ts、vue文件的功能

```text
show("已复制")
    ↓
toasts.value.push({ id:0, text:"已复制" })    ← useToast.ts 做的事
    ↓
toasts 是 ref，Vue 检测到变化
    ↓
v-for 重新渲染，一个 <div>已复制</div> 出现在页面  ← Toast.vue 做的事
    ↓
2.5 秒后定时器触发
    ↓
filter 把 id=0 从数组删掉
    ↓
Vue 检测到变化，那个 <div> 从页面消失
```

### 4.6 dock栏设计

> dock栏是一个可拖拽的快捷方式栏，支持添加、删除、移动快捷方式。

#### 4.6.1 拖拽删除

当用户拖拽 dock 栏的快捷方式时，如果拖拽距离超过阈值（视口高度的18%），则认为是删除操作，下方显示红色的删除字样。同时调用 `shortcutStore.deleteShortcut()` 删除该快捷方式。

#### 4.6.2 拖拽移动位置

用户可以拖拽 dock 栏的快捷方式来调整它们的位置。当拖拽结束时，如果拖拽距离小于阈值且有有效的插入位置，则调用 `shortcutStore.moveShortcutById()` 来移动快捷方式到新的位置。

#### 4.6.3 启动台与 Dock

启动台（底部抽屉，见 4.10）与 Dock 栏互相独立。启动台网站点击打开，不拖拽到 Dock。如需将启动台网站加入 Dock，可通过后续的自定义添加功能实现。

#### 4.6.4 右键菜单

用户右键点击 dock 栏的快捷方式时，会弹出一个右键菜单，提供删除和在新标签页打开选项。点击删除会调用 `shortcutStore.deleteShortcut()` 删除该快捷方式，点击在新标签页打开会调用 `window.open(shortcut.url, "_blank")` 来在新标签页中打开该快捷方式的链接。

### 4.7 壁纸存储

> 壁纸图片持久化存储，用户可分别为亮色/暗色主题设置不同壁纸，关闭页面后不丢失。

#### 4.7.1 架构

```
src/utils/db.ts                   ← IndexedDB 工具层
  封装 IndexedDB 读写操作，不依赖 Vue
  ├─ saveWallpaper(key, blob)     存入壁纸 Blob
  ├─ loadWallpaper(key)           读取壁纸 Blob
  └─ deleteWallpaper(key)         删除壁纸
        │
        ▼
src/stores/wallpaperStore.ts      ← Pinia 状态管理
  管理壁纸的 objectURL，供组件消费
  ├─ lightWallpaper / darkWallpaper  当前壁纸 objectURL（ref<string>）
  ├─ init()                          启动时从 IndexedDB 加载
  └─ setWallpaper(mode, file)        上传新壁纸 → DB + 更新 URL
```

#### 4.7.2 接口说明

**`src/utils/db.ts`** — IndexedDB 封装

| 函数                       | 说明                              |
| -------------------------- | --------------------------------- |
| `saveWallpaper(key, blob)` | 将壁纸 Blob 存入数据库            |
| `loadWallpaper(key)`       | 读取壁纸 Blob，无则返回 undefined |
| `deleteWallpaper(key)`     | 删除指定壁纸                      |

- 数据库名：`shanfeng-wallpaper`
- 对象存储：`wallpapers`（key-value 结构）
- key：`"light"` | `"dark"`

**`src/stores/wallpaperStore.ts`** — Pinia Store

| 属性/方法                  | 说明                                  |
| -------------------------- | ------------------------------------- |
| `lightWallpaper`           | 亮色壁纸 objectURL（ref），默认 bg1   |
| `darkWallpaper`            | 暗色壁纸 objectURL（ref），默认 bg2   |
| `ready`                    | 是否已完成初始化                      |
| `init()`                   | 异步初始化，从 IndexedDB 加载已有壁纸 |
| `setWallpaper(mode, file)` | 设置壁纸：存 DB + 更新 objectURL      |

### 4.8 搜索区渐变遮罩

> 解决毛玻璃在浅色/复杂壁纸下可见性不足的问题。双重保障：着色调玻璃（玻璃带上壁纸主题色，饱和度 0.65×，不透明度 0.38/0.48）+ 径向渐变遮罩。

```text
index.vue 模板层级：
  <div class="container">
    <div class="bg">              ← z-index: 0  壁纸
    <div class="search-area-mask"> ← z-index: 0  径向渐变（圆心：50% 32%）
    <div class="main-content">    ← z-index: 1  时钟 + 搜索
    <Dock />                      ← z-index: 300
```

**渐变参数：**

- 覆盖范围：页面上方 65% 区域
- 渐变圆心：`ellipse 70% 55% at 50% 32%`（时钟+搜索框中心）
- 亮度：亮色模式 `rgba(0,0,0,0.09)` → `transparent`；暗色模式 `rgba(0,0,0,0.18)` → `transparent`

### 4.9 动态取色降级策略

取色引擎可能因跨域、网络等问题失败。降级方案：

1. `colorExtractor.extractAndApply()` 返回 `undefined` → 调用 `applyDefaultPalette(isDark)`
2. `main.css` 中的 `:root` / `[data-theme="dark"]` 定义默认蓝紫色板（`hsl(262, ...)`），作为 CSS 层面的最终兜底

三层保障：动态取色 → JS 默认色板 → CSS 兜底色板。

### 4.10 启动台（底部抽屉）

> 点击 Dock 栏「启动台」图标打开。Material Design bottom sheet 风格，从底部滑入的卡片网格面板，快速访问不常驻 Dock 的网站。

#### 4.10.1 架构

```
src/stores/launchStore.ts    ← 数据管理
  ├─ items: LaunchItem[]     id / name / url / icon
  ├─ removeItem(id)          删除
  └─ addItem(item)           添加
        │
        ▼
src/components/launch/LaunchPanel.vue  ← 视图
  蒙层 scrim + 底部面板（border-radius 上方圆角）
  ├─ 拖拽指示条
  ├─ 3 列卡片网格（grid-template-columns: repeat(3, 1fr)）
  └─ 点击卡片打开网站 + 关闭面板
```

#### 4.10.2 面板参数

- 宽度：`min(680px, 90vw)`
- 最大高度：`65vh`，内容超出可滚动
- 表面：`tonal-surface(4)`，上方圆角 `28px`，下方无圆角与屏幕底部对齐
- 蒙层：`rgba(0,0,0,0.32)` scrim

#### 4.10.3 动画

- 进入：scrim 淡入 + 面板 `translateY(100%) → 0`，`decelerated` 缓动 300ms
- 退出：scrim 淡出 + 面板 `0 → translateY(100%)`，`accelerated` 缓动 200ms

#### 4.10.4 内置内容

12 个预设常用网站（GitHub、Gmail、YouTube、Reddit、Notion、Figma、Google 翻译、Spotify、Google 日历、百度网盘、豆瓣、微信读书），通过 launchStore 管理，后续支持自定义添加/删除。

## 5. 浏览器存储说明

**localStorage：**
| 键名 | 说明 |
|---------- | ---------------------------- |
| theme-mode | 主题模式（light/dark/auto） |
| search-engine | 搜索引擎id |

**indexedDB：**
| 数据库名 | 对象存储名 | 键名 | 说明 |
|---------- | ---------- | ---- | ---------------------------- |
| shanfeng-wallpaper | wallpapers | light | 亮色主题壁纸 Blob |
| shanfeng-wallpaper | wallpapers | dark | 暗色主题壁纸 Blob |

## 6. 插件体系设计

`extensions/` 目录下分别为 Chromium 和 Firefox 的插件目录。当执行 `npm run build` 后，`dist/` 下的内容会自动复制到两个插件目录中。用户可以直接在浏览器中加载插件。

## 7. 问题

### 7.1 启动时闪白问题

在index.html中添加了一个启动屏 `<div id="splash-screen"></div>`，并在CSS中设置了背景色为 `#323232`。在 `src/main.ts` 中，应用启动后会通过 JavaScript 将启动屏淡出并移除，从而显示应用的主内容。以解决启动时的闪白问题。
