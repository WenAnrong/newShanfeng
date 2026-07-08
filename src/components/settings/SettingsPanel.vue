<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";

// visible: 父组件告诉子组件是否显示
defineProps<{ visible: boolean }>();

// close: 子组件发消息告诉父组件要关闭
const emit = defineEmits<{ close: [] }>();

const panelRef = ref<HTMLElement>();

// 点击外部关闭
onClickOutside(panelRef, () => emit("close"));
</script>

<template>
  <Teleport to="body">
    <Transition name="launch">
      <div v-if="visible" class="launch-overlay">
        <div ref="panelRef" class="launch-panel">
          <p>设置 面板</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;

.launch-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  @include glass-panel-3;
}

.launch-panel {
  padding: 20px;
  min-width: 400px;
  min-height: 300px;
  color: $text-primary;
  border-radius: 5%;
  background-color: aqua;
  // TODO: 响应式
}

.launch {
  @include fade;

  &-enter-from {
    opacity: 0;
    transform: scale(1.1);
  }

  &-leave-to {
    opacity: 0;
    transform: scale(1.05);
  }
}
</style>
