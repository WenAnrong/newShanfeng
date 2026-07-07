<script lang="ts" setup>
import Clock from "@/components/clock/ClockPanel.vue";
import Search from "@/components/search/SearchBox.vue";
import Dock from "@/components/dock/DockPanel.vue";
</script>

<template>
  <div class="container">
    <!-- 背景层：绝对定位铺满 -->
    <div class="bg"></div>

    <!-- 内容层 -->
    <div class="main-content">
      <Clock />
      <Search />
    </div>
    <Dock />
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;

.container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  padding: $container-padding-top 0 50px 0;
  @include compact {
    padding: max(8vh, 60px) 0 40px 0;
  }

  @include wide {
    padding: min(20vh, 280px) 0 60px 0;
  }

  @include portrait {
    padding: max(8vh, 60px) 0 40px 0;
  }
}

.bg {
  position: absolute;
  inset: 0;
  z-index: 0;

  background-image: url("/src/assets/bg/bg1.webp");
  background-size: cover;
  background-position: center;
}

/* 内容组件浮于背景之上 */
.container > :not(.bg) {
  position: relative;
  z-index: 1;
}

.main-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}
</style>
