<script setup lang="ts">
import { svgs } from "@/utils/svg";
import { ref, computed, watchEffect, warn } from "vue";
import { usePreferredDark } from "@vueuse/core";

// openLaunch: 打开启动台
// openSetting: 打开设置
// switchBg: 切换暗亮色壁纸
const emit = defineEmits<{
  openLaunch: [];
  openSetting: [];
  switchBg: [value: string];
}>();

// 三态："light" | "dark" | "auto"
type ThemeMode = "light" | "dark" | "auto";
const themeMode = ref<ThemeMode>(
  (localStorage.getItem("theme-mode") as ThemeMode) || "auto",
);
const preferredDark = usePreferredDark();

// 当 mode 或系统偏好变化时，自动同步 data-theme
watchEffect(() => {
  let effective: string;
  if (themeMode.value === "auto") {
    effective = preferredDark.value ? "dark" : "light";
  } else {
    effective = themeMode.value;
  }
  emit("switchBg", effective);
  document.documentElement.dataset.theme = effective;
  localStorage.setItem("theme-mode", themeMode.value);
});

// 三个状态循环
const themeIcon = computed(() => {
  if (themeMode.value === "light") return svgs.light;
  if (themeMode.value === "dark") return svgs.dark;
  return svgs.auto;
});

// 按钮上面文字
const themeLabel = computed(() => {
  if (themeMode.value === "light") return "亮色";
  if (themeMode.value === "dark") return "暗色";
  return "自动";
});

// 点击按钮切换暗色、亮色和自动
function cycleTheme() {
  const order = ["light", "dark", "auto"] as const;
  const idx = order.indexOf(themeMode.value);
  themeMode.value = order[(idx + 1) % order.length] as ThemeMode;
}

// 点击启动台传回信息告诉父组件
function openLa() {
  emit("openLaunch");
}

function openSet() {
  emit("openSetting");
}
</script>

<template>
  <div class="dock-panel">
    <div class="dock-item">
      <img @click="openLa" :src="svgs.launch" class="img" />
      <span class="dock-label">启动台</span>
    </div>
    <div class="division"></div>
    <div class="dock-item">
      <img @click="openSet" :src="svgs.setting" class="img" />
      <span class="dock-label">设置</span>
    </div>
    <div class="dock-item">
      <img :src="themeIcon" class="img" @click="cycleTheme" />
      <span class="dock-label">{{ themeLabel }}</span>
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
  --dock-item-size: #{$dock-icon-size};
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  @include glass-panel-1;

  @include compact {
    gap: 10px;
    padding: 8px 12px;
    --dock-item-size: clamp(28px, 3.2vw, 36px);
  }
  @include wide {
    gap: 24px;
    padding: 16px 32px;
    --dock-item-size: clamp(65px, 2.5vw, 90px);
  }
}

.division {
  width: 2.5px;
  height: calc(var(--dock-item-size) * 0.7);
  background: $text-secondary;
  border-radius: 2.5px;
  flex-shrink: 0;
}

.dock-item {
  width: var(--dock-item-size);
  height: var(--dock-item-size);
  border-radius: 20%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: bottom;
  transition:
    $duration-normal ease,
    background-color 0.25s ease;

  &:hover {
    scale: 1.35;
    transform: translateY(-5px);
  }

  .img {
    width: 100%;
  }

  .dock-label {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%) scale(0.85);
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: 6px;
    color: $text-secondary;
    font-size: 10px;
    pointer-events: none;
    @include glass-panel-1;
    opacity: 0;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    @include compact {
      font-size: 8px;
    }
    @include wide {
      font-size: 13px;
    }
    @include portrait {
      font-size: 8px;
    }
  }

  &:hover .dock-label {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
</style>
