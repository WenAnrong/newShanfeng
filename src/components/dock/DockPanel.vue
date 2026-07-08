<script setup lang="ts">
import { svgs } from "@/utils/svg";
import { ref, computed, watchEffect } from "vue";
import { usePreferredDark } from "@vueuse/core";
import { useShortcutStore } from "@/stores/shortcutStore";

const shortcutStore = useShortcutStore();

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

// 点击打开网页
function clickTo(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  window.location.href = url;
}

// =========拖拽实现==========
const isShowDelete = ref(false); // 是否显示删除文字
let deleteTimer: ReturnType<typeof setTimeout> | null = null; // 保存定时器id
const labelColor = ref<string>(""); // 记录原本的标签颜色
let draggedId: number | null = null; // 当前拖拽的是哪个 shortcut
let originalRect: DOMRect | null = null; // 拖拽开始时元素的位置
let isDeleteMode = ref(false); // 600ms 到期后为 true

// 拖拽开始
document.addEventListener(
  "dragstart",
  (e) => {
    const el = (e.target as HTMLElement).closest(".drg") as HTMLElement;
    if (el) {
      // 获取id
      const id = parseInt(el.dataset.id ?? "");
      if (isNaN(id)) return;
      draggedId = id;

      originalRect = el.getBoundingClientRect();

      // 600ms 后做的事
      deleteTimer = setTimeout(() => {
        isDeleteMode.value = true;
        isShowDelete.value = true;
        const dlabel = el.querySelector(".dock-label") as HTMLElement;
        if (dlabel) {
          labelColor.value = dlabel.style.color;
          dlabel.style.color = "red";
        }
      }, 600);
    }
  },
  false,
);

// 拖拽中途
// document.addEventListener(
//   "drag",
//   (e) => {
//     const el = (e.target as HTMLElement).closest(".drg") as HTMLElement;
//     if (el) {
//       el.style.border = "1px solid blue";
//     }
//   },
//   false,
// );
// 拖拽结束
document.addEventListener(
  "dragend",
  (e) => {
    const el = (e.target as HTMLElement).closest(".drg") as HTMLElement;
    if (el) {
      // 去除定时器
      if (deleteTimer !== null) {
        clearTimeout(deleteTimer);
        deleteTimer = null;
      }

      // 删除判定：只有红色"删除？"出现后，且拖离了原位才删
      if (isDeleteMode && draggedId !== null && originalRect) {
        const centerX = originalRect.left + originalRect.width / 2;
        const centerY = originalRect.top + originalRect.height / 2;
        const dist = Math.sqrt(
          (e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2,
        );

        if (dist > 60) {
          // 拖远了，大于60px，删除
          shortcutStore.deleteShortcut(draggedId);
        }
      }

      isShowDelete.value = false;
      // 恢复文字颜色
      const dlabel = el.querySelector(".dock-label") as HTMLElement;
      if (dlabel) dlabel.style.color = labelColor.value;
    }
  },
  false,
);
</script>

<template>
  <div class="dock-panel">
    <div class="dock-item">
      <img draggable="false" @click="openLa" :src="svgs.launch" class="img" />
      <span class="dock-label">启动台</span>
    </div>

    <div
      class="dock-item drg"
      v-for="shortcut in shortcutStore.shortcuts"
      :key="shortcut.id"
      @click="clickTo(shortcut.path)"
      draggable="true"
      :data-id="shortcut.id"
    >
      <img draggable="false" :src="shortcut.icon" class="img" />
      <span class="dock-label">{{
        isShowDelete ? "删除？" : shortcut.name
      }}</span>
    </div>

    <div class="division"></div>

    <div class="dock-item">
      <img draggable="false" @click="openSet" :src="svgs.setting" class="img" />
      <span class="dock-label">设置</span>
    </div>
    <div class="dock-item">
      <img draggable="false" :src="themeIcon" class="img" @click="cycleTheme" />
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
