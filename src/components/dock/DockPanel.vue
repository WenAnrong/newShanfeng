<script setup lang="ts">
import launch from "@/assets/svgs/launch.svg";
import setting from "@/assets/svgs/setting.svg";
import bookmark from "@/assets/svgs/bookmark.svg";
import { ref } from "vue";

// openLaunch: 打开启动台
const emit = defineEmits<{
  openLaunch: [];
}>();

// 跳动动画控制
const isBouncing = ref();

// 点击启动台传回信息
function openLa() {
  isBouncing.value = true;
  setTimeout(() => {
    emit("openLaunch");
  }, 300);
  setTimeout(() => {
    isBouncing.value = false;
  }, 500);
}
</script>

<template>
  <div class="dock-panel">
    <div class="dock-item" :class="{ bouncing: isBouncing }">
      <img @click="openLa" :src="launch" class="img" />
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

  @include glass-panel-1;

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

  .img {
    width: 100%;
  }
}

.bouncing {
  @include bounce-up-down;
}
</style>
