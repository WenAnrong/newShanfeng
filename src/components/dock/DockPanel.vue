<script setup lang="ts"></script>

<template>
  <div class="dock-panel">
    <div class="dock-item">Item 1</div>
    <div class="dock-item">Item 2</div>
    <div class="dock-item">Item 3</div>
  </div>
</template>

<style scoped lang="scss">
.dock-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 10px;

  .dock-item {
    padding: 10px 20px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    cursor: pointer;
  }
}
</style>
