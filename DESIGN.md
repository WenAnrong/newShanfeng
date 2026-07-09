# 山风新页 设计文档

> 浏览器新标签页扩展。该文档会随着开发不断调整。
> 文档最后修改时间：2026/07/08

---

## 0. 当前设计缺少的部分

- 搜索词建议的父组件处理和测试未完成，未做响应式
- 开始启动部分设计骨架屏，解决闪白问题
- 插件体系未开始设计，当前仅完成vue展示部分

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
│  ├─ launch/               仿mac的启动台        │
│  └─ common/               Toast等            │
├──────────────────────────────────────────────┤
│  Composables (composables/) 可复用逻辑         │
│  ├─ useBingWallpaper.ts      必应壁纸获取      │
│  ├─ useSearchSuggestions.ts  搜索建议         │
│  └─ useToast.ts              提示消息         │
├──────────────────────────────────────────────┤
│  Stores (stores/)         业务状态管理        │
│  ├─ shortcutStore.ts      dock栏的快捷方式    │
│  ├─ searchStore.ts        搜索引擎管理        │
│  ├─ wallpaperStore.ts     壁纸管理            │
│  └─ launchStore.ts        启动台管理          │
├──────────────────────────────────────────────┤
│  Utils (utils/)           工具层              │
│  └─ svg.ts                svg检测/获取        │
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

具体逻辑如下：

```text
Bing 请求
    ├── 成功 → 显示 Bing 联想词
    │
    └── 失败 → 重试 (最多 2 次)
                  ├── 成功 → 显示 Bing 联想词
                  └── 还是失败 → 改用百度
                                   ├── 成功 → 显示百度联想词
                                   └── 失败 → 显示空
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

// 关闭下拉时清空
clearSuggestions();
```

### 4.3 z-index 设计

通过配置不同的 z-index 达到想要的覆盖效果

| z-index | 所属组件                           | 作用                         |
| ------- | ---------------------------------- | ---------------------------- |
| 0       | `.bg`（背景层）                    | 壁纸背景，绝对定位铺满       |
| 1       | `.container > :not(.bg)`（主内容） | 时钟、搜索框                 |
| 300     | `.container > .dock`（Dock 栏）    | 快捷方式栏，浮在 Launch 之上 |
| 100     | 弹窗 / Popover                     | 搜索引擎选择器、搜索建议下拉 |
| 200     | `.launch-overlay`（Launch 面板）   | 启动台全屏覆盖层             |

### 4.4 暗亮色配置

在 `main.css` 里提供暗色了亮色两种颜色

```css
/* ---- 亮色主题（默认） ---- */
:root,
[data-theme="light"] {
  /* 亮色 */
}

/* ---- 暗色主题 ---- */
[data-theme="dark"] {
  /* 暗色 */
}
```

但是不直接使用这些颜色，而是在 `_glass.scss` 里调用，然后其他组件再调用这里面的内容

为什么不直接全放在 `_glass.scss` ？
答：主题切换必须在运行时通过属性选择器 [data-theme="dark"] 改变值，这是 SCSS 变量做不到的，必须用 CSS 自定义属性。`main.css` 存值（运行时主题色），`_glass.scss` 存名字映射（编译时别名），组件只管用名字。

```text
main.css              ← 运行时动态层
  定义 :root / [data-theme="dark"] 下的 CSS 变量值
  └─ --text-primary: #1a1a2e
  └─ --glass-bg: rgba(255,255,255,.12)
      │
      ▼
_glass.scss           ← SCSS 编译时桥接层
  把 CSS 变量映射成 SCSS 变量，供组件 @use
  └─ $text-primary: var(--text-primary)
  └─ $glass-bg: var(--glass-bg)
      │
      ▼
组件 .vue             ← 消费层
  @use 后直接用 $text-primary，不用写 var(--x)
```

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

#### 4.6.3 启动台拖拽添加

用户可以从启动台拖拽应用到 dock 栏中。当拖拽结束时，如果拖拽距离小于阈值且有有效的插入位置，则调用 `shortcutStore.addShortcut()` 来添加新的快捷方式到 dock 栏中。
