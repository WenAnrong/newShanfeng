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
@use "../../assets/glass" as *;

.dock-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background-color: $surface-bg;
  border-radius: 18px;
  --dock-item-size: $dock-icon-size;

  @include compact {
    gap: 10px;
    padding: 8px 12px;
    --dock-item-size: 36px;
  }
  @include wide {
    gap: 24px;
    padding: 16px 32px;
    --dock-item-size: 60px;
  }
}

.dock-item {
  width: var(--dock-item-size);
  height: var(--dock-item-size);
  background-color: $surface-item-bg;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--dock-item-size) * 0.3);
}
</style>
