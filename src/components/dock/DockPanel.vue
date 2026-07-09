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
let draggedId: number | null = null; // 当前拖拽的是哪个 shortcut
let originalRect: DOMRect | null = null; // 拖拽开始时元素的位置
const DRAG_THRESHOLD = window.innerHeight * 0.2; // Y轴距离超过此值显示"删除"
const isShowSpace = ref(false); // 是否显示文字

// 自定义浮动幽灵图（替代原生 drag ghost）
let dragFloater: HTMLElement | null = null;
let dragFloaterText: HTMLElement | null = null;

// 创建自定义浮动幽灵图
function createDragFloater(imgSrc: string) {
  const floater = document.createElement("div");
  floater.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    pointer-events: none;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transform: translate(-50%, -50%);
  `;

  const icon = document.createElement("img");
  icon.src = imgSrc;
  icon.style.cssText = "width:48px;height:48px;border-radius:20%;";
  floater.appendChild(icon);

  const text = document.createElement("span");
  text.textContent = "删除";
  text.style.cssText = `
    display: none;
    color: #ff3b30;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  `;
  floater.appendChild(text);
  dragFloaterText = text;

  document.body.appendChild(floater);
  return floater;
}

// 拖拽开始
document.addEventListener(
  "dragstart",
  (e) => {
    const el = (e.target as HTMLElement).closest(".drg") as HTMLElement;
    if (el) {
      el.classList.add("is-dragging");
      const id = parseInt(el.dataset.id ?? "");
      if (isNaN(id)) return;
      // 记录当前拖拽的 shortcut id 和原始位置
      draggedId = id;
      originalRect = el.getBoundingClientRect();

      // 不显示space元素
      isShowSpace.value = true;

      // 用 1×1 透明像素隐藏原生幽灵图
      const blank = new Image();
      blank.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer?.setDragImage(blank, 0, 0);

      // 创建自定义浮动幽灵图
      const img = el.querySelector("img");
      if (img) {
        dragFloater = createDragFloater(img.src);
        dragFloater.style.left = e.clientX + "px";
        dragFloater.style.top = e.clientY + "px";
      }
    }
  },
  false,
);

// 拖拽中途
document.addEventListener(
  "drag",
  (e) => {
    if (e.clientX === 0 && e.clientY === 0) return;

    // 更新浮动幽灵图位置
    if (dragFloater) {
      dragFloater.style.left = e.clientX + "px";
      dragFloater.style.top = e.clientY + "px";
    }

    // 判断距离，控制"删除"显隐
    if (draggedId !== null && originalRect && dragFloaterText) {
      const centerY = originalRect.top + originalRect.height / 2;
      const distY = Math.abs(e.clientY - centerY);
      if (distY > DRAG_THRESHOLD) {
        dragFloaterText.style.display = "block";
      } else {
        dragFloaterText.style.display = "none";
      }
    }
  },
  false,
);

// 拖拽结束
document.addEventListener(
  "dragend",
  (e) => {
    const el = (e.target as HTMLElement).closest(".drg") as HTMLElement;
    if (el) {
      el.classList.remove("is-dragging");

      // 移除浮动幽灵图
      if (dragFloater) {
        dragFloater.remove();
        dragFloater = null;
        dragFloaterText = null;
      }

      // 删除判定
      if (draggedId !== null && originalRect) {
        const centerY = originalRect.top + originalRect.height / 2;
        const distY = Math.abs(e.clientY - centerY);

        if (distY > DRAG_THRESHOLD) {
          shortcutStore.deleteShortcut(draggedId);
        }
      }

      // 重置状态
      isShowSpace.value = false;
      draggedId = null;
      originalRect = null;
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
      <span
        :style="{ display: isShowSpace ? 'none' : 'block' }"
        class="dock-label"
        >{{ shortcut.name }}</span
      >
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
    transition: filter 0.2s ease; // 变暗/恢复时有平滑过渡
  }

  &.is-dragging {
    background: rgba(128, 128, 128, 0.15);
    border: 2px dashed rgba(128, 128, 128, 0.35);
    .img {
      opacity: 0;
    }
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
