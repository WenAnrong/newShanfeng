<script setup lang="ts">
import { useSearchSuggestions } from "@/composables/useSearchSuggestions";
import { onClickOutside } from "@vueuse/core";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

// 父组件传入参数
// visible: 是否显示
// triggerEl: 触发按钮的 DOM 元素，用来计算弹窗位置
// query: 输入的文字
// shouldFetch: 是否发送请求获取联想词（选中联想词时不发）
const props = defineProps<{
  visible: boolean;
  triggerEl: HTMLElement | null;
  query: string;
  shouldFetch: boolean;
}>();

// 子组件向父组件发送的事件
// close: 告诉父组件关闭子组件
// select: 键盘方向键导航时通知父组件（仅预览，不搜索）
// search: 点击候选词或按 Enter 时通知父组件（直接搜索）
const emit = defineEmits<{
  close: [];
  select: [text: string];
  search: [text: string];
}>();

const popoverRef = ref<HTMLElement>();
const activeIndex = ref(-1); // 当前高亮索引，-1 表示无选中

// 点击外部关闭
onClickOutside(popoverRef, () => {
  if (props.visible) emit("close");
  activeIndex.value = -1;
});

// 计算弹窗位置
const popoverStyle = computed(() => {
  if (!props.triggerEl) return {};
  const rect = props.triggerEl.getBoundingClientRect();
  return {
    top: `${rect.bottom + 14}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
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
    activeIndex.value = -1; // 重置高亮
  },
);

// 点击候选词 → 直接搜索
function clickSuggestion(text: string) {
  emit("search", text);
  activeIndex.value = -1;
}

// 高亮项变化时自动滚入视野
watch(activeIndex, (idx) => {
  if (idx < 0 || !popoverRef.value) return;
  const items = popoverRef.value.querySelectorAll(".suggestion-item");
  items[idx]?.scrollIntoView({ block: "nearest" });
});

// 键盘导航
function onInputKeydown(e: KeyboardEvent) {
  if (!props.visible || suggestions.value.length === 0) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      activeIndex.value =
        activeIndex.value < suggestions.value.length - 1
          ? activeIndex.value + 1
          : 0;
      emit("select", suggestions.value[activeIndex.value] as string);
      break;

    case "ArrowUp":
      e.preventDefault();
      activeIndex.value =
        activeIndex.value > 0
          ? activeIndex.value - 1
          : suggestions.value.length - 1;
      emit("select", suggestions.value[activeIndex.value] as string);
      break;

    case "Enter":
      if (activeIndex.value >= 0) {
        e.preventDefault();
        emit("search", suggestions.value[activeIndex.value] as string);
        activeIndex.value = -1;
      }
      break;

    case "Escape":
      emit("close");
      activeIndex.value = -1;
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
      <div
        v-if="visible"
        ref="popoverRef"
        class="suggestion-popover scrollbar"
        :style="popoverStyle"
      >
        <div
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggestion-item"
          :class="{ active: i === activeIndex }"
          @click="clickSuggestion(s)"
        >
          <span>{{ s }}</span>
        </div>
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

  @include compact {
    max-height: 45svh;
  }

  @include wide {
    max-height: 50vh;
  }

  @include portrait {
    max-height: 40vh;
  }
}

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

// 淡入淡出动画
.pop {
  @include fade;
}
</style>
