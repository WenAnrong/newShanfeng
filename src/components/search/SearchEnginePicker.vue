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
// close: 告诉父组件"我要关了"
// select(id): 告诉父组件"用户选了 id 这个引擎"
const emit = defineEmits<{
  close: [];
  select: [id: string];
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
  store.currentId = id;
  emit("select", id);
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

.engine-popover {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.engine-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background $duration-fast ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(255, 255, 255, 0.25);
    font-weight: 500;
  }

  .engine-icon {
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }
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
