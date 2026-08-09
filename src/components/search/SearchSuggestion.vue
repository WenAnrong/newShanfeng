<script setup lang="ts">
import { useSearchSuggestions } from "@/composables/useSearchSuggestions";
import type { BookmarkItem } from "@/composables/useBookmarkSearch";
import { onClickOutside } from "@vueuse/core";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

// 父组件传入参数
// visible: 是否显示
// triggerEl: 触发按钮的 DOM 元素，用来计算弹窗位置
// query: 输入的文字
// shouldFetch: 是否发送请求获取联想词（选中联想词时不发）
// bookmarks: 收藏夹匹配结果（来自 useBookmarkSearch）
const props = defineProps<{
  visible: boolean;
  triggerEl: HTMLElement | null;
  query: string;
  shouldFetch: boolean;
  bookmarks: BookmarkItem[];
}>();

// 子组件向父组件发送的事件
// close: 告诉父组件关闭子组件
// select: 键盘方向键导航时通知父组件（仅预览，不搜索）
// search: 点击候选词或按 Enter 时通知父组件（直接搜索）
// openBookmark: 点击/回车打开收藏夹项（直接打开 URL）
const emit = defineEmits<{
  close: [];
  select: [text: string];
  search: [text: string];
  openBookmark: [url: string];
}>();

const popoverRef = ref<HTMLElement>();

// 当前激活的分区：suggestion = 搜索建议，bookmark = 收藏夹
const activeTab = ref<"suggestion" | "bookmark">("suggestion");
// 两个分区各自独立的键盘高亮索引，互不干扰
const suggestionIndex = ref(-1);
const bookmarkIndex = ref(-1);

// 当前分区的高亮索引
function currentIndex(): number {
  return activeTab.value === "suggestion"
    ? suggestionIndex.value
    : bookmarkIndex.value;
}

function setIndex(i: number): void {
  if (activeTab.value === "suggestion") suggestionIndex.value = i;
  else bookmarkIndex.value = i;
}

// 当前分区的列表长度
function currentListLength(): number {
  return activeTab.value === "suggestion"
    ? suggestions.value.length
    : props.bookmarks.length;
}

// 重置键盘状态（关闭弹窗、切回默认分区时）
function resetState(): void {
  activeTab.value = "suggestion";
  suggestionIndex.value = -1;
  bookmarkIndex.value = -1;
}

// 点击外部关闭
onClickOutside(popoverRef, () => {
  if (props.visible) emit("close");
  resetState();
});

// 计算弹窗位置 + 可用高度
// 可用高度 = 视口高度 − 搜索框底部 − 顶部间距(14px) − dock 栏预留高度
// dock 预留 = dock 面板高度 + 容器底部 padding（compact 约 100px，wide 可达 160px），取 150 覆盖大部分场景
const DOCK_RESERVE = 150;
// 弹窗最小可见高度（空间极小时仍保留可滚动区域）
const MIN_POPOVER_H = 120;
const popoverStyle = computed(() => {
  if (!props.triggerEl) return {};
  const rect = props.triggerEl.getBoundingClientRect();
  const top = rect.bottom + 14;
  // 动态限制高度，避免联想词列表盖住底部 dock 栏（写死 vh 在矮窗口/搜索框靠下时必超界）
  const maxHeight = Math.max(
    MIN_POPOVER_H,
    window.innerHeight - top - DOCK_RESERVE,
  );
  return {
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
  };
});

// 获取搜索建议
const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
  useSearchSuggestions();

// 当输入文字变化时获取联想词
watch(
  () => props.query,
  (val: string) => {
    if (!props.shouldFetch) return; // 不是手动输入，跳过请求
    if (val && val.trim().length >= 2) {
      fetchSuggestions(val);
    } else {
      clearSuggestions();
    }
    resetState(); // 新输入默认回到搜索建议分区
  },
);

// 收藏夹结果清空时（如输入变短），若正停在收藏夹分区则回退
watch(
  () => props.bookmarks,
  (list) => {
    if (activeTab.value === "bookmark" && list.length === 0) {
      activeTab.value = "suggestion";
      bookmarkIndex.value = -1;
    }
  },
);

// 点击候选词 → 直接搜索
function clickSuggestion(text: string) {
  emit("search", text);
  suggestionIndex.value = -1;
}

// 点击收藏夹项 → 打开 URL
function clickBookmark(b: BookmarkItem) {
  emit("openBookmark", b.url);
  bookmarkIndex.value = -1;
}

// 切换分区（收藏夹无匹配时不可切换）
function switchTab(tab: "suggestion" | "bookmark") {
  if (tab === "bookmark" && props.bookmarks.length === 0) return;
  activeTab.value = tab;
  setIndex(0); // 切换后高亮第一项，Enter 即触发
}

// 引导提示：收藏夹有匹配且尚未切到收藏夹分区时，提示可按 Tab 键切换
// 已按下 Tab（或点击 Tab）切过去、或收藏夹无匹配时自动消失
const showTabHint = computed(
  () => props.bookmarks.length > 0 && activeTab.value === "suggestion",
);

// 收藏夹路径取最后两级展示（如 "开发 / 前端"），避免过长
function lastTwoPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts.slice(-2).join(" / ");
}

// 高亮项变化时自动滚入视野
watch(
  [activeTab, suggestionIndex, bookmarkIndex],
  () => {
    const idx = currentIndex();
    if (idx < 0 || !popoverRef.value) return;
    const selector =
      activeTab.value === "suggestion" ? ".suggestion-item" : ".bookmark-item";
    const items = popoverRef.value.querySelectorAll(selector);
    items[idx]?.scrollIntoView({ block: "nearest" });
  },
);

// 键盘导航
function onInputKeydown(e: KeyboardEvent) {
  if (!props.visible) return;

  // Tab 键：在「搜索建议 / 收藏夹」两个分区之间切换
  // 收藏夹无匹配时不响应（保持默认焦点行为）
  if (e.key === "Tab") {
    if (e.isComposing) return; // 中文输入法选词中不响应
    if (props.bookmarks.length === 0) return;
    e.preventDefault();
    activeTab.value =
      activeTab.value === "suggestion" ? "bookmark" : "suggestion";
    setIndex(0);
    return;
  }

  const listLength = currentListLength();
  if (listLength === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setIndex(currentIndex() < listLength - 1 ? currentIndex() + 1 : 0);
      if (activeTab.value === "suggestion") {
        emit("select", suggestions.value[currentIndex()] as string);
      }
      break;

    case "ArrowUp":
      e.preventDefault();
      setIndex(currentIndex() > 0 ? currentIndex() - 1 : listLength - 1);
      if (activeTab.value === "suggestion") {
        emit("select", suggestions.value[currentIndex()] as string);
      }
      break;

    case "Enter":
      if (currentIndex() >= 0) {
        e.preventDefault();
        if (activeTab.value === "suggestion") {
          emit("search", suggestions.value[currentIndex()] as string);
        } else {
          const bm = props.bookmarks[currentIndex()];
          if (bm) emit("openBookmark", bm.url);
        }
        setIndex(-1);
      }
      break;

    case "Escape":
      emit("close");
      resetState();
      break;
  }
}

// 在 triggerEl（搜索框）上绑定/解绑键盘事件
onMounted(() => {
  props.triggerEl?.addEventListener("keydown", onInputKeydown);
});
onUnmounted(() => {
  props.triggerEl?.removeEventListener("keydown", onInputKeydown);
});
watch(
  () => props.triggerEl,
  (el, oldEl) => {
    oldEl?.removeEventListener("keydown", onInputKeydown);
    el?.addEventListener("keydown", onInputKeydown);
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div v-if="visible" ref="popoverRef" class="suggestion-popover scrollbar" :style="popoverStyle">
        <!-- 分区切换栏 -->
        <div class="tab-bar">
          <button class="tab-btn" :class="{ active: activeTab === 'suggestion' }" @click="switchTab('suggestion')">
            搜索建议
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'bookmark', disabled: bookmarks.length === 0 }"
            :disabled="bookmarks.length === 0" @click="switchTab('bookmark')">
            收藏夹
            <span v-if="bookmarks.length > 0" class="tab-badge">
              {{ bookmarks.length }}
            </span>
          </button>
          <!-- 引导提示：紧跟在收藏夹标签后，仅可切换且未切换时显示 -->
          <span v-if="showTabHint" class="tab-hint">按 Tab 键切换</span>
        </div>

        <!-- 搜索建议分区 -->
        <template v-if="activeTab === 'suggestion'">
          <div v-for="(s, i) in suggestions" :key="i" class="suggestion-item" :class="{ active: i === suggestionIndex }"
            @click="clickSuggestion(s)">
            <span>{{ s }}</span>
          </div>
        </template>

        <!-- 收藏夹分区 -->
        <template v-else>
          <div v-for="(b, i) in bookmarks" :key="b.id" class="bookmark-item" :class="{ active: i === bookmarkIndex }"
            @click="clickBookmark(b)">
            <span class="bm-avatar">{{ b.title.charAt(0).toUpperCase() }}</span>
            <span class="bm-info">
              <span class="bm-title">{{ b.title }}</span>
              <span class="bm-path">{{ lastTwoPath(b.path) }}</span>
            </span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

.suggestion-popover {
  position: fixed;
  z-index: 100;
  padding: 6px;
  overflow-y: auto;
  border-radius: var(--standard-radio-radius);
  @include glass-surface(3);

  // max-height 由 JS 动态计算并内联覆盖（避免盖住底部 dock 栏）；
  // 以下 vh 值仅作为 JS 未设置时的兜底
  max-height: 45svh;

  @include wide {
    max-height: 50vh;
  }

  @include portrait {
    max-height: 40vh;
  }
}

// ===== 分区切换栏 =====
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px 8px;
  border-bottom: 0.5px solid m3.$m3-outline-variant;
  margin-bottom: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: $text-secondary;
  padding: 6px 12px;
  border-radius: m3.$m3-shape-sm;
  transition:
    background m3.$m3-duration-medium m3.$m3-easing-standard,
    color m3.$m3-duration-medium m3.$m3-easing-standard;

  &.active {
    background: m3.$m3-primary-container;
    color: m3.$m3-on-primary-container;
  }

  &.disabled {
    color: $text-secondary;
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.tab-badge {
  background: m3.$m3-primary-container;
  color: m3.$m3-on-primary-container;
  border-radius: 999px;
  padding: 0 7px;
  font-size: 12px;
  line-height: 1.6;
}

// 引导提示（收藏夹标签右侧内联）
.tab-hint {
  margin-left: 6px;
  font-size: 12px;
  color: $text-secondary;
  opacity: 0.85;
  white-space: nowrap;
  border: 1px solid $text-secondary;
  border-radius: 12px;
  padding: 0 6px;
  background: m3.$m3-surface-variant;
}

// ===== 搜索建议项 =====
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: m3.$m3-shape-sm;
  cursor: pointer;
  font-size: 14px;
  color: $text-primary;
  transition: background m3.$m3-duration-medium m3.$m3-easing-standard;

  &.active {
    background: m3.$m3-primary-container;
    color: m3.$m3-on-primary-container;
  }
}

// ===== 收藏夹项 =====
.bookmark-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: m3.$m3-shape-sm;
  cursor: pointer;
  transition: background m3.$m3-duration-medium m3.$m3-easing-standard;

  &.active {
    background: m3.$m3-primary-container;
  }
}

// 首字母圆标（跨浏览器统一的轻量方案，不依赖 favicon API）
.bm-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  background: m3.$m3-surface-variant;
  color: m3.$m3-on-surface-variant;
}

.bm-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.bm-title {
  font-size: 14px;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-path {
  font-size: 12px;
  color: $text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 淡入淡出动画
.pop {
  @include fade;
}
</style>
