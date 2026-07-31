<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useEngineStore } from "@/stores/searchStore";

// 父组件传入参数
// visible: 是否显示
// triggerEl: 触发按钮的 DOM 元素，用来计算弹窗位置
const props = defineProps<{
  visible: boolean;
  triggerEl: HTMLElement | null;
}>();

// 子组件向父组件发送的事件
// close: 告诉父组件要把子组件关闭
const emit = defineEmits<{
  close: [];
}>();

const store = useEngineStore();
const popoverRef = ref<HTMLElement>();

// 点击外部关闭
onClickOutside(popoverRef, () => {
  if (props.visible) emit("close");
});

// 计算弹窗位置：紧贴触发按钮下方
const popoverStyle = computed(() => {
  if (!props.triggerEl) return {};
  const rect = props.triggerEl.getBoundingClientRect();
  return {
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
  };
});

function select(id: string) {
  store.setCurrentEngine(id);
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="visible"
        ref="popoverRef"
        class="engine-popover"
        :style="popoverStyle"
      >
        <div
          v-for="engine in store.engines"
          :key="engine.id"
          class="engine-item"
          :class="{ active: engine.id === store.currentId }"
          @click="select(engine.id)"
        >
          <img :src="engine.icon" class="engine-icon" />
          <span>{{ engine.name }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

.engine-popover {
  position: fixed;
  z-index: 100;
  min-width: 160px;
  padding: 6px;
  border-radius: var(--standard-radio-radius);
  display: flex;
  flex-direction: column;
  gap: 2px;
  @include glass-surface(3);
}

.engine-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: m3.$m3-shape-sm;
  cursor: pointer;
  font-size: 14px;
  color: $text-primary;
  transition: background m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    background: rgba(128, 128, 128, 0.12);
  }

  &.active {
    background: m3.$m3-primary-container;
    color: m3.$m3-on-primary-container;
    font-weight: 500;
  }

  .engine-icon {
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }
}

// 淡入淡出动画
.pop {
  @include fade;
}
</style>
