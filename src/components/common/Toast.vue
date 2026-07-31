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
@use "@/assets/m3-tokens" as m3;

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
  color: m3.$m3-on-surface;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: auto;
  background: m3.$m3-glass-bg;
  backdrop-filter: blur(m3.$m3-glass-blur);
  -webkit-backdrop-filter: blur(m3.$m3-glass-blur);
  border: 0.5px solid m3.$m3-glass-border;
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
  transition: all m3.$m3-duration-long m3.$m3-easing-decelerated;
}

.toast-leave-active {
  transition: all m3.$m3-duration-medium m3.$m3-easing-accelerated;
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
