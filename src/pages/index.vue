<script lang="ts" setup>
import Clock from "@/components/clock/ClockPanel.vue";
import Search from "@/components/search/SearchBox.vue";
import Dock from "@/components/dock/DockPanel.vue";
import Launch from "@/components/launch/LaunchPanel.vue";
import Setting from "@/components/settings/SettingsPanel.vue";
import { ref, computed } from "vue";
import Toast from "@/components/common/Toast.vue";
import { useThemeStore } from "@/stores/themeStore";
import { useWallpaperStore } from "@/stores/wallpaperStore";

const themeStore = useThemeStore();
const wallpaperStore = useWallpaperStore();

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

// 从 IndexedDB 加载已保存的壁纸
wallpaperStore.init();

// 根据主题切换壁纸
const bgImage = computed(() =>
  themeStore.effectiveTheme === "dark"
    ? wallpaperStore.darkWallpaper
    : wallpaperStore.lightWallpaper,
);
</script>

<template>
  <div class="container">
    <!-- 背景层：init 完成后才显示 -->
    <div
      v-if="wallpaperStore.ready"
      class="bg"
      :style="{ backgroundImage: `url(${bgImage})` }"
    ></div>

    <!-- 内容层 -->
    <div class="main-content">
      <Clock />
      <Search />
    </div>
    <Dock
      class="dock"
      @openLaunch="toggleLaunch"
      @openSetting="toggleSetting"
    />
    <Launch :visible="isShowLaunch" @close="isShowLaunch = false" />
    <Setting :visible="isShowSetting" @close="isShowSetting = false" />
    <Toast />
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/glass" as *;

.container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  background-color: #0d1117;
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
