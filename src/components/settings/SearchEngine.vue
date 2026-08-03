<script setup lang="ts">
import { ref } from "vue";
import { useEngineStore } from "@/stores/searchStore";
import type { SearchEngine } from "@/stores/searchStore";
import EditDialog from "@/components/common/EditDialog.vue";
import type { EditData } from "@/components/common/EditDialog.vue";

const engineStore = useEngineStore();

const openMode = ref<string>(
  localStorage.getItem("search-open-mode") || "current",
);

function setOpenMode(mode: string) {
  openMode.value = mode;
  localStorage.setItem("search-open-mode", mode);
}

function selectEngine(id: string) {
  engineStore.setCurrentEngine(id);
}

function deleteEngine(id: string) {
  engineStore.removeEngine(id);
}

// EditDialog 状态
const dialogVisible = ref(false);
const dialogTitle = ref("添加搜索引擎");
const dialogInitial = ref<{ name?: string; url?: string; icon?: string }>({});
const editingId = ref<string | null>(null);

function openAddDialog() {
  editingId.value = null;
  dialogTitle.value = "添加搜索引擎";
  dialogInitial.value = { name: "", url: "", icon: "" };
  dialogVisible.value = true;
}

function openEditDialog(engine: SearchEngine) {
  editingId.value = engine.id;
  dialogTitle.value = "编辑搜索引擎";
  dialogInitial.value = {
    name: engine.name,
    url: engine.url,
    icon: engine.isBuiltIn ? engineStore.DEFAULT_ICON : engine.icon,
  };
  dialogVisible.value = true;
}

function onSave(data: EditData) {
  if (editingId.value) {
    engineStore.updateEngine(editingId.value, data);
  } else {
    engineStore.addEngine(data);
  }
  dialogVisible.value = false;
}
</script>

<template>
  <div class="search-engine-settings">
    <!-- 默认搜索引擎 -->
    <section class="setting-section">
      <label class="section-label">当前搜索引擎</label>
      <div class="engine-list">
        <button
          v-for="engine in engineStore.engines"
          :key="engine.id"
          :class="[
            'engine-card',
            { active: engine.id === engineStore.currentId },
          ]"
          @click="selectEngine(engine.id)"
        >
          <div class="engine-card-left">
            <img :src="engine.icon" class="engine-icon" alt="" />
            <span class="engine-name">{{ engine.name }}</span>
          </div>
          <div class="engine-card-right">
            <!-- 编辑/删除按钮：仅自定义引擎显示 -->
            <template v-if="!engine.isBuiltIn">
              <button
                class="engine-edit-btn"
                title="编辑"
                @click.stop="openEditDialog(engine)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
              </button>
              <button
                class="engine-delete-btn"
                title="删除"
                @click.stop="deleteEngine(engine.id)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </template>
            <div class="engine-check">
              <span
                v-if="engine.id === engineStore.currentId"
                class="check-dot"
              ></span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- 添加搜索引擎按钮 -->
    <section class="setting-section">
      <div class="form-header">
        <button class="add-engine-btn" @click="openAddDialog">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加搜索引擎
        </button>
      </div>
    </section>

    <!-- 搜索打开方式 -->
    <section class="setting-section">
      <label class="section-label">搜索打开方式</label>
      <div class="open-mode-group">
        <button
          :class="['mode-btn', { active: openMode === 'current' }]"
          @click="setOpenMode('current')"
        >
          <svg
            class="mode-icon-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          <span>当前标签页</span>
          <span class="mode-hint">在当前页跳转搜索结果</span>
        </button>
        <button
          :class="['mode-btn', { active: openMode === 'newTab' }]"
          @click="setOpenMode('newTab')"
        >
          <svg
            class="mode-icon-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
            />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>新标签页</span>
          <span class="mode-hint">在新标签页打开搜索结果</span>
        </button>
      </div>
    </section>
  </div>

  <!-- 通用编辑弹窗 -->
  <EditDialog
    :visible="dialogVisible"
    :title="dialogTitle"
    :initialName="dialogInitial.name"
    :initialUrl="dialogInitial.url"
    :initialIcon="dialogInitial.icon"
    urlPlaceholder="https://xxx.com/search?q={keyword}"
    @close="dialogVisible = false"
    @save="onSave"
  />
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

.search-engine-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-section {
  .section-label {
    display: block;
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 10px;
  }
}

// ===== 引擎卡片列表 =====
.engine-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.engine-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 0.5px solid m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-md;
  background: transparent;
  cursor: pointer;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
    border-color: m3.$m3-outline;

    .engine-delete-btn,
    .engine-edit-btn {
      opacity: 1;
      visibility: visible;
    }
  }

  &:active {
    transform: scale(0.985);
  }

  &.active {
    background: m3.$m3-primary-container;
    border-color: transparent;

    .engine-name {
      font-weight: 500;
      color: m3.$m3-on-primary-container;
    }
  }

  .engine-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .engine-card-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .engine-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .engine-name {
    font-size: 14px;
    color: $text-primary;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;
  }

  .engine-delete-btn,
  .engine-edit-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    opacity: 0;
    visibility: hidden;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;
  }

  .engine-edit-btn:hover {
    background: rgba(128, 128, 128, 0.15);
    color: $text-primary;
  }

  .engine-delete-btn:hover {
    background: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }

  .engine-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid m3.$m3-outline-variant;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    .check-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: m3.$m3-primary;
      animation: pop-in m3.$m3-duration-long m3.$m3-easing-emphasized;
    }
  }

  &.active .engine-check {
    border-color: m3.$m3-primary;
  }
}

// ===== 添加按钮 =====
.form-header {
  .add-engine-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
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
}

// ===== 打开方式 =====
.open-mode-group {
  display: flex;
  gap: 8px;

  .mode-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 10px;
    border: 0.5px solid m3.$m3-outline-variant;
    border-radius: m3.$m3-shape-md;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
      color: $text-primary;
    }

    &:active {
      transform: scale(0.97);
    }

    &.active {
      background: m3.$m3-primary-container;
      color: m3.$m3-on-primary-container;
      font-weight: 500;
      border-color: transparent;

      .mode-icon-svg {
        opacity: 1;
      }
    }

    .mode-icon-svg {
      opacity: 0.55;
      transition: opacity m3.$m3-duration-medium m3.$m3-easing-standard;
      flex-shrink: 0;
    }

    .mode-hint {
      font-size: 11px;
      font-weight: 400;
      opacity: 0.6;
    }
  }
}

// ===== 动画 =====
@keyframes pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes form-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
