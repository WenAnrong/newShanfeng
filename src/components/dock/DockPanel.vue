<script setup lang="ts">
import { svgs } from "@/utils/svg";
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useShortcutStore } from "@/stores/shortcutStore";
import { useThemeStore } from "@/stores/themeStore";
import EditDialog from "@/components/common/EditDialog.vue";
import type { EditData } from "@/components/common/EditDialog.vue";

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

// =========右键菜单==========
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  index: -1,
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

  // 根据 id 在 shortcutStore 中找到对应的快捷方式对象及其下标（用于排序边界判断）
  const index = shortcutStore.shortcuts.findIndex((s) => s.id === id);
  if (index === -1) return;
  const shortcut = shortcutStore.shortcuts[index];
  if (!shortcut) return;

  // 设置菜单位置（鼠标点击处）和要操作的快捷方式
  contextMenu.value = {
    visible: true, // 显示菜单
    x: e.clientX, // 鼠标在视口中的 X 坐标
    y: window.innerHeight - e.clientY, // 鼠标在视口中的 Y 坐标（从底部计算）
    index, // 被右键的快捷方式在数组中的下标
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

// 右键菜单-左移（前移一位）
function moveLeft() {
  const { shortcut, index } = contextMenu.value;
  if (shortcut && index > 0) {
    shortcutStore.moveItem(shortcut.id, -1);
  }
  closeContextMenu();
}

// 右键菜单-右移（后移一位）
function moveRight() {
  const { shortcut, index } = contextMenu.value;
  if (shortcut && index < shortcutStore.shortcuts.length - 1) {
    shortcutStore.moveItem(shortcut.id, 1);
  }
  closeContextMenu();
}

// 右键菜单点击外部关闭
const contextMenuRef = ref<HTMLElement | null>(null);
onClickOutside(contextMenuRef, () => {
  closeContextMenu();
});

// ===== 编辑弹窗 =====
const editVisible = ref(false);
const editTitle = ref("添加快捷方式");
const editInitial = ref<{ name?: string; url?: string; icon?: string }>({});
const editingShortcutId = ref<number | null>(null);

function openEditDialog(shortcut?: {
  id: number;
  name: string;
  path: string;
  icon: string;
}) {
  if (shortcut) {
    editingShortcutId.value = shortcut.id;
    editTitle.value = "编辑快捷方式";
    editInitial.value = {
      name: shortcut.name,
      url: shortcut.path,
      icon: shortcut.icon,
    };
  }
  editVisible.value = true;
  closeContextMenu();
}

function onEditSave(data: EditData) {
  if (editingShortcutId.value !== null) {
    shortcutStore.updateShortcut(editingShortcutId.value, {
      name: data.name,
      path: data.url,
      icon: data.icon,
    });
  } else {
    shortcutStore.addShortcut(data.name, data.url, data.icon);
  }
  editVisible.value = false;
}
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
        :key="shortcut.id"
        @click="clickTo(shortcut.path)"
        :data-id="shortcut.id"
        @contextmenu.prevent="handleContextMenu"
      >
        <img draggable="false" :src="shortcut.icon" class="img" />
        <span class="dock-label">{{ shortcut.name }}</span>
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
      <div class="menu-separator"></div>
      <div
        class="context-menu-item"
        :class="{ disabled: contextMenu.index <= 0 }"
        @click="moveLeft"
      >
        <span>左移</span>
      </div>
      <div
        class="context-menu-item"
        :class="{ disabled: contextMenu.index >= shortcutStore.shortcuts.length - 1 }"
        @click="moveRight"
      >
        <span>右移</span>
      </div>
      <div class="menu-separator"></div>
      <div
        class="context-menu-item"
        @click="openEditDialog(contextMenu.shortcut!)"
      >
        <span>编辑</span>
      </div>
      <div class="context-menu-item danger" @click="deleteShortcut">
        <span>删除</span>
      </div>
    </div>
  </div>

  <EditDialog
    :visible="editVisible"
    :title="editTitle"
    :initialName="editInitial.name"
    :initialUrl="editInitial.url"
    :initialIcon="editInitial.icon"
    @close="editVisible = false"
    @save="onEditSave"
  />
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/glass" as *;
@use "@/assets/animations" as *;
@use "@/assets/m3-tokens" as m3;

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
    background m3.$m3-duration-long m3.$m3-easing-standard,
    border-color m3.$m3-duration-long m3.$m3-easing-standard,
    box-shadow m3.$m3-duration-long m3.$m3-easing-standard;

  @include glass-surface(2);

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

  animation: dockSlideUp 1.7s $ease-spring both;
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
    m3.$m3-duration-long m3.$m3-easing-emphasized,
    background-color m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    transform: translateY(-5px) scale(1.2);
    background: rgba(128, 128, 128, 0.12);
  }

  .img {
    width: 100%;
    transition: filter m3.$m3-duration-medium m3.$m3-easing-standard;
  }

  .dock-label {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%) scale(0.85);
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: m3.$m3-shape-sm;
    color: $text-secondary;
    font-size: 13px;
    pointer-events: none;
    @include glass-surface(1);
    opacity: 0;
    transition:
      opacity m3.$m3-duration-medium m3.$m3-easing-standard,
      transform m3.$m3-duration-medium m3.$m3-easing-standard;
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
  border-radius: m3.$m3-shape-md;
  @include glass-surface(3);
  backdrop-filter: blur(20px);
  overflow: hidden;
  animation: contextMenuIn m3.$m3-duration-medium m3.$m3-easing-decelerated;

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
  transition: background m3.$m3-duration-medium m3.$m3-easing-standard;
  white-space: nowrap;

  &:hover {
    background: rgba(128, 128, 128, 0.12);
  }

  &.danger {
    color: #ff3b30;
    &:hover {
      background: rgba(255, 59, 48, 0.12);
    }
  }

  // 排序边界禁用态：灰显 + 阻断点击（逻辑层也有边界判断双保险）
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// 菜单分组分隔线
.menu-separator {
  height: 1px;
  margin: 4px 12px;
  background: m3.$m3-outline-variant;
}

@keyframes dockSlideUp {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
