<script setup lang="ts">
import { toasts } from "@/composables/useToast";
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-item"
          :class="`toast-${t.type}`"
        >
          <span v-if="t.type !== 'info'" class="toast-dot"></span>
          <span class="toast-text">{{ t.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/glass" as *;
@use "@/assets/animations" as *;

.toast-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--standard-radio-radius);
  color: $text-primary;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: auto;
  @include glass-panel-1;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-success .toast-dot {
  background: #2ecc71;
}

.toast-error .toast-dot {
  background: #e74c3c;
}

/* TransitionGroup 动画 */
.toast-enter-active {
  transition: all 0.25s ease-out;
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
