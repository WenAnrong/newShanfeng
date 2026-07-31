<script setup lang="ts">
import { ref } from "vue";
import { useWallpaperStore } from "@/stores/wallpaperStore";
import { useThemeStore } from "@/stores/themeStore";
import lightanddark from "@/assets/setting-icon/lightanddark.webp";
import light from "@/assets/setting-icon/light.webp";
import dark from "@/assets/setting-icon/dark.webp";

const wallpaperStore = useWallpaperStore();
const themeStore = useThemeStore();

// 隐藏的文件输入
const lightInput = ref<HTMLInputElement>();
const darkInput = ref<HTMLInputElement>();

function selectLightWallpaper() {
  lightInput.value?.click();
}
function selectDarkWallpaper() {
  darkInput.value?.click();
}

async function onLightFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await wallpaperStore.setWallpaper("light", file);
}

async function onDarkFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await wallpaperStore.setWallpaper("dark", file);
}

function setThemeMode(m: "light" | "dark" | "auto") {
  themeStore.setThemeMode(m);
}
</script>

<template>
  <section class="setting-section">
    <label class="section-label">主题模式</label>
    <div class="theme-mode-group">
      <button
        v-for="opt in [
          {
            id: 'auto',
            label: '自动',
            img: lightanddark,
          },
          {
            id: 'light',
            label: '亮色',
            img: light,
          },
          {
            id: 'dark',
            label: '暗色',
            img: dark,
          },
        ] as const"
        :key="opt.id"
        :class="['mode-btn', { active: themeStore.themeMode === opt.id }]"
        @click="setThemeMode(opt.id)"
      >
        <img :src="opt.img" class="mode-icon" />
        <span>{{ opt.label }}</span>
      </button>
    </div>
    <label class="section-label">壁纸管理</label>
    <div class="theme-mode-group wallpaper-group">
      <button class="mode-btn wallpaper-btn" @click="selectLightWallpaper">
        <img class="wallpaper-preview" :src="wallpaperStore.lightWallpaper" />
        <span>亮色壁纸</span>
      </button>
      <button class="mode-btn wallpaper-btn" @click="selectDarkWallpaper">
        <img class="wallpaper-preview" :src="wallpaperStore.darkWallpaper" />
        <span>暗色壁纸</span>
      </button>
    </div>
    <!-- 隐藏的文件选择器 -->
    <input
      ref="lightInput"
      type="file"
      accept="image/*"
      hidden
      @change="onLightFileChange"
    />
    <input
      ref="darkInput"
      type="file"
      accept="image/*"
      hidden
      @change="onDarkFileChange"
    />
  </section>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

.setting-section {
  .section-label {
    display: block;
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 10px;
    margin-top: 12px;
  }
}

.theme-mode-group {
  display: flex;
  gap: 8px;

  .mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 0;
    border: 0.5px solid m3.$m3-outline-variant;
    border-radius: m3.$m3-shape-sm;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }

    &.active {
      background: m3.$m3-primary-container;
      color: m3.$m3-on-primary-container;
      font-weight: 500;
      border-color: transparent;
    }
  }

  .mode-icon {
    width: 100%;
    border-radius: 6px;
    pointer-events: none;
  }

  &.wallpaper-group {
    gap: 12px;
  }

  .wallpaper-btn {
    cursor: pointer;
    padding: 8px;
  }

  .wallpaper-preview {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 6px;
    pointer-events: none;
  }
}
</style>
