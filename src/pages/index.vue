<script lang="ts" setup>
import Clock from "@/components/clock/ClockPanel.vue";
import Search from "@/components/search/SearchBox.vue";
import Dock from "@/components/dock/DockPanel.vue";
import "@/assets/bg.css";

import { ref } from "vue";
</script>

<template>
  <div class="container">
    <!-- 背景层：绝对定位铺满 -->
    <div class="gb">
      <div class="bg-particles">
        <div class="bg-particle bg-particle--1 bg-particle--sm"></div>
        <div class="bg-particle bg-particle--2"></div>
        <div class="bg-particle bg-particle--3 bg-particle--lg"></div>
        <div class="bg-particle bg-particle--4 bg-particle--sm"></div>
        <div class="bg-particle bg-particle--5"></div>
        <div class="bg-particle bg-particle--6 bg-particle--lg"></div>
        <div class="bg-particle bg-particle--7"></div>
        <div class="bg-particle bg-particle--8 bg-particle--sm"></div>
        <div class="bg-particle bg-particle--9"></div>
        <div class="bg-particle bg-particle--10 bg-particle--lg"></div>
      </div>
    </div>

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
  padding: var(--container-padding-top) 0 50px 0;
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

/* 背景层铺满 */
.gb {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* 内容组件浮于背景之上 */
.container > :not(.gb) {
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
