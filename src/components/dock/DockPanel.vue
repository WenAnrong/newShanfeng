<script setup lang="ts"></script>

<template>
  <div class="dock-panel">
    <div class="dock-item">Item 1</div>
    <div class="dock-item">Item 2</div>
    <div class="dock-item">Item 3</div>
  </div>
</template>

<style scoped lang="scss">
@use "../../assets/variables" as *;

.dock-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 18px;

  @include compact {
    gap: 10px;
    padding: 8px 12px;
    --dock-icon-size: 36px;
  }
  @include wide {
    gap: 24px;
    padding: 16px 32px;
    --dock-icon-size: 60px;
  }
}

.dock-item {
  width: var(--dock-icon-size);
  height: var(--dock-icon-size);
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--dock-icon-size) * 0.3);
}
</style>
