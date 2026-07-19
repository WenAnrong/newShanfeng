<script setup lang="ts">
import { ref } from "vue";
import { useWallpaperStore } from "@/stores/wallpaperStore";
import { useThemeStore } from "@/stores/themeStore";

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
            img: '/src/assets/setting-icon/lightanddark.webp',
          },
          {
            id: 'light',
            label: '亮色',
            img: '/src/assets/setting-icon/light.webp',
          },
          {
            id: 'dark',
            label: '暗色',
            img: '/src/assets/setting-icon/dark.webp',
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
    border: 0.5px solid $glass-border;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all 0.15s ease;

    &:hover {
      background: $glass-hover-bg;
    }

    &.active {
      background: $glass-active-bg;
      color: $text-primary;
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
