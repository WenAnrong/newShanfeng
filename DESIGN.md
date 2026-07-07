# 山风新页 设计文档

> 浏览器新标签页扩展。该文档会随着开发不断调整。
> 文档最后修改时间：2026/07/07

---

## 0. 当前设计缺少的部分

- 禁止文字被选中
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

| 技术             | 版本   | 选型理由                               |
| ---------------- | ------ | -------------------------------------- |
| Vue 3            | ^3.5   | 响应式设计，开发快速，方便             |
| TypeScript       | ^6.0   | 类型安全                               |
| Pinia            | ^3.0   | 用于存储各种共享信息                   |
| sass-embedded    | ^1.100 | 便于编写css代码                        |
| @vueuse/core     | ^14.3  | `useDark`、`useStorage` 等开箱即用工具 |
| lunar-javascript | ^1.7   | 纯 JS 农历库，无运行时依赖，体积小     |

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
│  ├─ favorites/            收藏夹面板          │
│  ├─ settings/             设置面板            │
│  ├─ launch/               仿mac的启动台        │
│  └─ common/               Toast等            │
├──────────────────────────────────────────────┤
│  Composables (composables/) 可复用逻辑         │
│  ├─ useBingWallpaper.ts      必应壁纸获取      │
│  ├─ useSearchSuggestions.ts  搜索建议         │
│  ├─ useDockMagnetic.ts       Dock 磁吸动效    │
│  └─ useToast.ts              提示消息         │
├──────────────────────────────────────────────┤
│  Stores (stores/)         业务状态管理        │
│  ├─ shortcutStore.ts      dock栏的快捷方式     │
│  ├─ searchStore.ts        搜索引擎管理        │
│  ├─ themeStore.ts         主题/暗色模式       │
│  ├─ wallpaperStore.ts     壁纸展示状态        │
│  └─ favoritesStore.ts     收藏管理            │
├──────────────────────────────────────────────┤
│  Utils (utils/)           工具层              │
│  └─ icon.ts              favicon 检测/获取     │
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
| **compact**  | < 1366px        | 竖屏显示器（1080×1920）、13" 笔记本、窗口化较窄时 |
| **standard** | 1366px ~ 2560px | 主流桌面显示器（1080p/2K）、笔记本外接            |
| **wide**     | > 2560px        | 4K 及以上（3840×2160）、超宽屏                    |

standard 为默认基线（无需 media query），compact 用 `max-width` 约束，wide 用 `min-width` 开启增强布局。

```scss
// Sass 变量
$bp-compact: 1366px; // 竖屏/小笔记本上限
$bp-wide: 2560px; // 4K 开启下限

// 实际使用
// compact: 竖屏、小窗口
@media (max-width: #{$bp-compact - 1px}) {
}

// standard: 默认（无需 media query）
// ... 1366px ~ 2560px 都适用

// wide: 4K / 超宽屏
@media (min-width: $bp-wide) {
}
```

#### 4.1.3 实施规范

**Sass 变量管理**：在 `src/assets/_variables.scss` 中统一定义：

```scss
// 断点
$bp-compact: 1366px;
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
