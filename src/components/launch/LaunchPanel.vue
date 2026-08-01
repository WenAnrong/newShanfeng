<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useLaunchStore } from "@/stores/launchStore";
import type { LaunchItem } from "@/stores/launchStore";
import EditDialog from "@/components/common/EditDialog.vue";
import type { EditData } from "@/components/common/EditDialog.vue";
import { useShortcutStore } from "@/stores/shortcutStore";
import { show } from "@/composables/useToast";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const shortcutStore = useShortcutStore();

const panelRef = ref<HTMLElement>();
onClickOutside(panelRef, () => emit("close"), {
  ignore: [".dialog-overlay", ".launch-context-menu"],
});

onKeyStroke("Escape", () => {
  if (!props.visible) return;
  const dialog = document.querySelector(
    ".dialog-overlay",
  ) as HTMLElement | null;
  if (dialog && dialog.style.display !== "none") return;
  emit("close");
});

const launchStore = useLaunchStore();

// 补齐协议前缀
function ensureProtocol(url: string) {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

// 左键点击打开
function openSite(url: string) {
  window.location.href = ensureProtocol(url);
  emit("close");
}

// =========右键菜单（模仿 dock 栏）==========
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  anchor: "top" | "bottom";
  item: LaunchItem | null;
}>({ visible: false, x: 0, y: 0, anchor: "bottom", item: null });

const contextMenuRef = ref<HTMLElement | null>(null);

// 预估菜单尺寸，用于防溢出
const MENU_W = 172;
const MENU_H = 148;

// 右键打开菜单：默认向上弹出（bottom 锚点，同 dock），空间不足时自动翻转
function openContextMenu(e: MouseEvent, item: LaunchItem) {
  const spaceBelow = window.innerHeight - e.clientY;
  const anchor = spaceBelow < MENU_H ? "top" : "bottom";
  contextMenu.value = {
    visible: true,
    x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8)),
    y: e.clientY,
    anchor,
    item,
  };

  // 渲染后按实际尺寸二次校正，确保不溢出视口
  nextTick(() => {
    const el = contextMenuRef.value;
    if (!el || !contextMenu.value.visible) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    const cur = contextMenu.value;
    let { x, y, anchor } = cur;
    if (rect.right > window.innerWidth - pad)
      x = window.innerWidth - rect.width - pad;
    if (x < pad) x = pad;
    if (anchor === "bottom" && rect.top < pad) anchor = "top";
    if (anchor === "top" && rect.bottom > window.innerHeight - pad)
      anchor = "bottom";
    contextMenu.value = { ...cur, x, y, anchor };
  });
}

// 菜单位置样式（bottom 锚点时从鼠标处向上弹出）
const contextMenuStyle = computed(() => {
  const { x, y, anchor } = contextMenu.value;
  return anchor === "bottom"
    ? { left: x + "px", bottom: window.innerHeight - y + "px" }
    : { left: x + "px", top: y + "px" };
});

// 关闭右键菜单
function closeContextMenu() {
  contextMenu.value.visible = false;
}
onClickOutside(contextMenuRef, closeContextMenu);

// 在新标签页打开
function openInNewTab() {
  const item = contextMenu.value.item;
  if (item) window.open(ensureProtocol(item.url), "_blank");
  closeContextMenu();
  emit("close");
}

// 删除
function deleteItem() {
  const item = contextMenu.value.item;
  if (item) launchStore.removeItem(item.id);
  closeContextMenu();
}

// =========编辑弹窗==========
const editVisible = ref(false);
const editTitle = ref("添加网站");
const editInitial = ref<{ name?: string; url?: string; icon?: string }>({});
const editingId = ref<number | null>(null);

function openAddDialog() {
  editTitle.value = "添加网站";
  editingId.value = null;
  editInitial.value = { name: "", url: "", icon: "" };
  editVisible.value = true;
}

function addToDock() {
  const item = contextMenu.value.item;
  if (!item) return;
  // 去重：按补全协议后的 url 判断是否已在 dock 里
  const url = ensureProtocol(item.url);
  const exists = shortcutStore.shortcuts.some(
    (s) => ensureProtocol(s.path) === url,
  );
  if (exists) {
    show("该网站已在 Dock 栏中", "info");
    closeContextMenu();
    return;
  }

  shortcutStore.addShortcut(item.name, item.url, item.icon);
  show("已添加到 Dock 栏", "success");
  closeContextMenu();
}

function openEditDialog() {
  const item = contextMenu.value.item;
  if (!item) return;
  editTitle.value = "编辑网站";
  editingId.value = item.id;
  editInitial.value = { name: item.name, url: item.url, icon: item.icon };
  editVisible.value = true;
  closeContextMenu();
}

function onSave(data: EditData) {
  if (editingId.value !== null) {
    launchStore.updateItem(editingId.value, data);
  } else {
    launchStore.addItem(data);
  }
  editVisible.value = false;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="launch">
      <div v-if="visible" class="launch-overlay">
        <div ref="panelRef" class="launch-sheet">
          <!-- 拖拽指示条 -->
          <div class="sheet-handle"></div>

          <!-- 卡片网格 -->
          <div class="sheet-body scrollbar">
            <div class="card-grid">
              <button
                v-for="item in launchStore.items"
                :key="item.id"
                class="launch-card"
                @click="openSite(item.url)"
                @contextmenu.prevent="openContextMenu($event, item)"
              >
                <div class="card-icon-wrap">
                  <img :src="item.icon" class="card-icon" />
                </div>
                <span class="card-name">{{ item.name }}</span>
              </button>
            </div>

            <button class="launch-add-btn" @click="openAddDialog">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加网站
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <EditDialog
      :visible="editVisible"
      :title="editTitle"
      :initialName="editInitial.name"
      :initialUrl="editInitial.url"
      :initialIcon="editInitial.icon"
      @close="editVisible = false"
      @save="onSave"
    />

    <!-- 右键菜单（模仿 dock 栏） -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        ref="contextMenuRef"
        class="launch-context-menu"
        :style="contextMenuStyle"
      >
        <div class="context-menu-item" @click="openInNewTab">
          <span>在新标签页中打开</span>
        </div>
        <div class="context-menu-item" @click="addToDock">
          <span>添加到dock栏</span>
        </div>
        <div class="context-menu-item" @click="openEditDialog">
          <span>编辑</span>
        </div>
        <div class="context-menu-item danger" @click="deleteItem">
          <span>删除</span>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

// 蒙层
.launch-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
}

// 底部抽屉面板
.launch-sheet {
  width: min(680px, 90vw);
  max-height: 65vh;
  display: flex;
  flex-direction: column;
  border-radius: m3.$m3-shape-xl m3.$m3-shape-xl 0 0;
  @include tonal-surface(4);
  color: $text-primary;
}

// 拖拽指示条
.sheet-handle {
  width: 32px;
  height: 4px;
  background: m3.$m3-outline-variant;
  border-radius: 2px;
  margin: 12px auto 0;
  flex-shrink: 0;
}

// 内容滚动区
.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 28px;
}

// 卡片网格
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.launch-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px 12px;
  border: 0.5px solid m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-md;
  background: transparent;
  cursor: pointer;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
    border-color: m3.$m3-outline;
    transform: translateY(-2px);
  }

  &:active {
    background: m3.$m3-primary-container;
    border-color: transparent;
  }

  .card-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: m3.$m3-shape-sm;
    background: m3.$m3-surface-variant;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon {
    width: 22px;
    height: 22px;
    opacity: 0.8;
  }

  .card-name {
    font-size: 12px;
    color: $text-primary;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

// 添加按钮
.launch-add-btn {
  margin-top: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 0.5px dashed m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-md;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: $text-secondary;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
    color: m3.$m3-primary;
    border-color: m3.$m3-primary;
    border-style: solid;
  }
}

// Transition
.launch {
  &-enter-active {
    transition: opacity m3.$m3-duration-long m3.$m3-easing-standard;
    .launch-sheet {
      transition: transform m3.$m3-duration-long m3.$m3-easing-decelerated;
    }
  }

  &-leave-active {
    transition: opacity m3.$m3-duration-medium m3.$m3-easing-standard;
    .launch-sheet {
      transition: transform m3.$m3-duration-medium m3.$m3-easing-accelerated;
    }
  }

  &-enter-from {
    opacity: 0;
    .launch-sheet {
      transform: translateY(100%);
    }
  }

  &-leave-to {
    opacity: 0;
    .launch-sheet {
      transform: translateY(100%);
    }
  }
}

// =========右键菜单（模仿 dock 栏）==========
.launch-context-menu {
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
}
</style>
