<script lang="ts" setup>
import Clock from "@/components/clock/ClockPanel.vue";
import Search from "@/components/search/SearchBox.vue";
import Dock from "@/components/dock/DockPanel.vue";
import Launch from "@/components/launch/LaunchPanel.vue";
import Setting from "@/components/settings/SettingsPanel.vue";
import { ref } from "vue";
import Toast from "@/components/common/Toast.vue";

// 是否打开启动台
const isShowLaunch = ref(false);
// 切换开关启动台
function toggleLaunch() {
  isShowLaunch.value = !isShowLaunch.value;
}

// 是否打开设置界面
const isShowSetting = ref(false);
function toggleSetting() {
  isShowSetting.value = !isShowSetting.value;
}

// 壁纸 URL
const bgImage = ref("/src/assets/bg/bg1.webp");

function handleSwitchBg(mode: string) {
  bgImage.value =
    mode === "dark" ? "/src/assets/bg/bg2.webp" : "/src/assets/bg/bg1.webp";
}
</script>

<template>
  <div class="container">
    <!-- 背景层：绝对定位铺满 -->
    <div class="bg" :style="{ backgroundImage: `url(${bgImage})` }"></div>

    <!-- 内容层 -->
    <div class="main-content">
      <Clock />
      <Search />
    </div>
    <Dock
      class="dock"
      @openLaunch="toggleLaunch"
      @switchBg="handleSwitchBg"
      @openSetting="toggleSetting"
    />
    <Launch :visible="isShowLaunch" @close="isShowLaunch = false" />
    <Setting :visible="isShowSetting" @close="isShowSetting = false" />
    <Toast />
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
  padding: $container-padding-top 0 30px 0;
  @include compact {
    padding: max(8vh, 60px) 0 20px 0;
  }

  @include wide {
    padding: min(20vh, 280px) 0 40px 0;
  }

  @include portrait {
    padding: max(8vh, 60px) 0 20px 0;
  }
}

.bg {
  position: absolute;
  inset: 0;
  z-index: 0;

  background-size: cover;
  background-position: center;
  transition: background-image 0.5s ease;
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

.container > .dock {
  z-index: 300;
}
</style>
