<script setup lang="ts">
import { svgs } from "@/utils/svg";
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useShortcutStore } from "@/stores/shortcutStore";
import { useThemeStore } from "@/stores/themeStore";

const shortcutStore = useShortcutStore();
const themeStore = useThemeStore();

// openLaunch: 打开启动台
// openSetting: 打开设置
const emit = defineEmits<{
  openLaunch: [];
  openSetting: [];
}>();

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

// 缓存布局尺寸（在 dragstart 时记录，避免被 transform 干扰）
let layoutItemWidth = 0;
let layoutGap = 0;
let layoutShift = 0;

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

      // 缓存布局尺寸（所有 item 均无 transform 时读取，保证准确）
      const allItems = document.querySelectorAll<HTMLElement>(".drg");
      if (allItems.length >= 2) {
        const r0 = allItems[0]!.getBoundingClientRect();
        const r1 = allItems[1]!.getBoundingClientRect();
        layoutItemWidth = r0.width;
        layoutGap = r1.left - r0.right;
        layoutShift = layoutItemWidth + layoutGap;
      } else if (allItems.length === 1) {
        layoutItemWidth = allItems[0]!.getBoundingClientRect().width;
        layoutGap = 0;
        layoutShift = layoutItemWidth;
      }

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

// 上一次插入位置，用于避免 drag 高频重复设置相同值
let lastInsertIndex = -1;

// 根据鼠标 X 找到插入位置（items 中的第几个之前）
// 用 item 的右边界（含 gap 中点）作为切换点，保证一格一换
function calcInsertIndex(clientX: number): number {
  const items = document.querySelectorAll<HTMLElement>(".drg");
  if (!items.length) return 0;
  for (let i = 0; i < items.length; i++) {
    const rect = items[i]!.getBoundingClientRect();
    // 边界 = item 右边缘 + gap 的一半
    const boundary = rect.right + layoutGap / 2;
    if (clientX < boundary) return i;
  }
  return items.length;
}

// 更新所有 items 的 translateX 产生"让位"动画
function applyShifts(insertIndex: number) {
  const items = document.querySelectorAll<HTMLElement>(".drg");
  if (!items.length || draggedId === null) return;

  const shift = layoutShift;
  if (shift <= 0) return;

  const draggedIdx = shortcutStore.shortcuts.findIndex(
    (s) => s.id === draggedId,
  );

  items.forEach((el, i) => {
    if (i === draggedIdx) {
      el.style.transform = ""; // 被拖元素本身不移位
      return;
    }

    if (insertIndex < draggedIdx) {
      // 鼠标在拖拽元素左侧 → 中间的元素右移
      if (i >= insertIndex && i < draggedIdx) {
        el.style.transform = `translateX(${shift}px)`;
      } else {
        el.style.transform = "";
      }
    } else if (insertIndex > draggedIdx) {
      // 鼠标在拖拽元素右侧 → 中间的元素左移
      if (i > draggedIdx && i < insertIndex) {
        el.style.transform = `translateX(${-shift}px)`;
      } else {
        el.style.transform = "";
      }
    } else {
      el.style.transform = "";
    }
  });
}

// 清除所有位移
function resetShifts() {
  document
    .querySelectorAll<HTMLElement>(".drg")
    .forEach((el) => (el.style.transform = ""));
}

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

    // 判断距离
    if (draggedId !== null && originalRect) {
      const centerY = originalRect.top + originalRect.height / 2;
      const distY = Math.abs(e.clientY - centerY);

      // 控制"删除"显隐
      if (dragFloaterText) {
        dragFloaterText.style.display =
          distY > DRAG_THRESHOLD ? "block" : "none";
      }

      // ---- 让位动画：只有 Y 偏移小于 20px 时才触发移位 ----
      if (distY < 20) {
        const idx = calcInsertIndex(e.clientX);
        if (idx !== lastInsertIndex) {
          lastInsertIndex = idx;
          applyShifts(idx);
        }
      } else if (lastInsertIndex !== -1) {
        // 移出水平区 → 清除移位，恢复原位
        resetShifts();
        lastInsertIndex = -1;
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

      // 清除所有移位（放手归位）
      resetShifts();
      const finalInsertIndex = lastInsertIndex;
      lastInsertIndex = -1;
      layoutItemWidth = 0;
      layoutGap = 0;
      layoutShift = 0;

      // 删除 / 移动判定
      if (draggedId !== null && originalRect) {
        const centerY = originalRect.top + originalRect.height / 2;
        const distY = Math.abs(e.clientY - centerY);

        if (distY > DRAG_THRESHOLD) {
          shortcutStore.deleteShortcut(draggedId);
        } else if (distY < 20 && finalInsertIndex >= 0) {
          const idx = shortcutStore.shortcuts.findIndex(
            (s) => s.id === draggedId,
          );
          const len = shortcutStore.shortcuts.length;

          // 没有真正移动的情况：插入点就是原位或紧挨原位右侧
          const noMove =
            finalInsertIndex === idx ||
            finalInsertIndex === idx + 1 ||
            (idx === len - 1 && finalInsertIndex === len);

          if (!noMove) {
            if (finalInsertIndex >= len) {
              // 移到末尾
              const [item] = shortcutStore.shortcuts.splice(idx, 1);
              shortcutStore.shortcuts.push(item!);
            } else {
              // 移到 finalInsertIndex 处（该位置 item 之前）
              shortcutStore.moveShortcutById(
                draggedId,
                shortcutStore.shortcuts[finalInsertIndex]!.id,
              );
            }
            // 重新编号
            shortcutStore.shortcuts.forEach((item, i) => {
              item.id = i + 1;
            });
          }
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

// =========右键菜单==========
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  shortcut: null as {
    id: number;
    name: string;
    path: string;
    icon: string;
  } | null,
});

// 右键事件
function handleContextMenu(e: MouseEvent) {
  const el = (e.currentTarget as HTMLElement)?.closest(
    ".drg",
  ) as HTMLElement | null;
  if (!el) return;

  // 从 data-id 属性中读取 shortcut 的 id（数字）
  const id = parseInt(el.dataset.id ?? "");
  if (isNaN(id)) return;

  // 根据 id 在 shortcutStore 中找到对应的快捷方式对象
  const shortcut = shortcutStore.shortcuts.find((s) => s.id === id);
  if (!shortcut) return;

  // 设置菜单位置（鼠标点击处）和要操作的快捷方式
  contextMenu.value = {
    visible: true, // 显示菜单
    x: e.clientX, // 鼠标在视口中的 X 坐标
    y: window.innerHeight - e.clientY, // 鼠标在视口中的 Y 坐标（从底部计算）
    shortcut, // 被右键的快捷方式数据
  };
}

// 关闭右键菜单
function closeContextMenu() {
  contextMenu.value.visible = false;
}

// 右键菜单-在新标签页打开
function openInNewTab() {
  const shortcut = contextMenu.value.shortcut;
  if (shortcut) {
    if (
      !shortcut.path.startsWith("http://") &&
      !shortcut.path.startsWith("https://")
    ) {
      shortcut.path = "https://" + shortcut.path;
    }
    window.open(shortcut.path, "_blank");
  }
  closeContextMenu();
}

// 右键菜单-删除
function deleteShortcut() {
  const shortcut = contextMenu.value.shortcut;
  if (shortcut) {
    shortcutStore.deleteShortcut(shortcut.id);
  }
  closeContextMenu();
}

// 右键菜单点击外部关闭
const contextMenuRef = ref<HTMLElement | null>(null);
onClickOutside(contextMenuRef, () => {
  closeContextMenu();
});
</script>

<template>
  <div v-bind="$attrs" class="dock-wrapper">
    <div class="dock-panel">
      <div class="dock-item">
        <img draggable="false" @click="openLa" :src="svgs.launch" class="img" />
        <span class="dock-label">启动台</span>
      </div>

      <div
        class="dock-item drg"
        v-for="shortcut in shortcutStore.shortcuts"
        :key="shortcut.uid"
        @click="clickTo(shortcut.path)"
        draggable="true"
        :data-id="shortcut.id"
        @contextmenu.prevent="handleContextMenu"
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
        <img
          draggable="false"
          @click="openSet"
          :src="svgs.setting"
          class="img"
        />
        <span class="dock-label">设置</span>
      </div>
      <div class="dock-item">
        <img
          draggable="false"
          :src="themeStore.themeIcon"
          class="img"
          @click="themeStore.cycleTheme"
        />
        <span class="dock-label">{{ themeStore.themeLabel }}</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      ref="contextMenuRef"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', bottom: contextMenu.y + 'px' }"
    >
      <div class="context-menu-item" @click="openInNewTab">
        <span>在新标签页中打开</span>
      </div>
      <div class="context-menu-item danger" @click="deleteShortcut">
        <span>删除</span>
      </div>
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
    scale: none;
    transform: none;
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

// =========右键菜单==========
.context-menu {
  position: fixed;
  z-index: 300;
  padding: 6px 0;
  border-radius: 10px;
  @include glass-panel-1;
  backdrop-filter: blur(20px);
  overflow: hidden;
  animation: contextMenuIn 0.12s ease-out;

  @keyframes contextMenuIn {
    from {
      opacity: 0;
      transform: scale(0.92);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: 13px;
  color: $text-primary;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(128, 128, 128, 0.15);
  }

  &.danger {
    color: #ff3b30;
    &:hover {
      background: rgba(255, 59, 48, 0.12);
    }
  }
}
</style>
