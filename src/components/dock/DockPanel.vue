<script setup lang="ts">
import launch from "@/assets/svgs/launch.svg";
import setting from "@/assets/svgs/setting.svg";
import bookmark from "@/assets/svgs/bookmark.svg";
</script>

<template>
  <div class="dock-panel">
    <div class="dock-item">
      <img :src="launch" class="img" />
    </div>
    <div class="dock-item">
      <img :src="setting" class="img" />
    </div>
    <div class="dock-item">
      <img :src="bookmark" class="img" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/glass" as *;
@use "@/assets/animations" as *;

.dock-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-radius: var(--standard-radio-radius);
  --dock-item-size: $dock-icon-size;

  @include glass-panel;

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
  border-radius: 20%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  @include bounce-up-down;

  .img {
    width: 100%;
  }
}
</style>
