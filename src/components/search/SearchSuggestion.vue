<script setup lang="ts">
import { useSearchSuggestions } from "@/composables/useSearchSuggestions";
import { onClickOutside } from "@vueuse/core";
import { ref, computed, watch } from "vue";

// 父组件传入参数
// visible: 是否显示
// triggerEl: 触发按钮的 DOM 元素，用来计算弹窗位置
// query: 输入的文字
const props = defineProps<{
  visible: boolean;
  triggerEl: HTMLElement | null;
  query: string;
}>();

// 子组件向父组件发送的事件
// close: 告诉父组件"我要关了"
// select: 选中联想词时通知父组件
const emit = defineEmits<{
  close: [];
  select: [text: string];
}>();

const popoverRef = ref<HTMLElement>();

// 点击外部关闭
onClickOutside(popoverRef, () => {
  if (props.visible) emit("close");
});

// 计算弹窗位置
const popoverStyle = computed(() => {
  if (!props.triggerEl) return {};
  const rect = props.triggerEl.getBoundingClientRect();
  return {
    top: `${rect.bottom + 6}px`,
  };
});

// 获取搜索建议
const { suggestions, isLoading, fetchSuggestions, clearSuggestions } =
  useSearchSuggestions();

// 当输入文字变化时获取联想词
watch(
  () => props.query,
  (val: string) => {
    if (val && val.trim().length >= 2) {
      fetchSuggestions(val);
    } else {
      clearSuggestions();
    }
  },
);

// 选中联想词苟返回给父组件信息
function selectSuggestion(text: string) {
  emit("select", text);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="visible"
        ref="popoverRef"
        class="suggestion-popover"
        :style="popoverStyle"
      >
        <div
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggestion-item"
          @click="selectSuggestion(s)"
        >
          <span>{{ s }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;

.suggestion-popover {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  padding: 6px;
  @include glass-panel;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background $duration-fast ease;
}

// 淡入淡出动画
.pop-enter-active,
.pop-leave-active {
  transition:
    opacity $duration-slow ease,
    transform $duration-slow ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
