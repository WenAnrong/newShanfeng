<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import Appearance from "./Appearance.vue";
import About from "./About.vue";
import Synchronize from "./Sync.vue";
import SearchEngine from "./SearchEngine.vue";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const panelRef = ref<HTMLElement>();
onClickOutside(panelRef, () => emit("close"), {
  ignore: [".dialog-overlay", ".engine-popover", ".suggestion-popover"],
});

// ESC 关闭：如果 EditDialog 在上层打开，先让它关
onKeyStroke("Escape", () => {
  if (!props.visible) return;
  const dialog = document.querySelector(
    ".dialog-overlay",
  ) as HTMLElement | null;
  if (dialog && dialog.style.display !== "none") return;
  emit("close");
});

// 当前选中的 tab
type Tab = "appearance" | "about" | "synchronize" | "search";
const activeTab = ref<Tab>("appearance");
</script>

<template>
  <Teleport to="body">
    <Transition name="setting">
      <div v-if="visible" class="setting-overlay">
        <div ref="panelRef" class="setting-panel">
          <!-- 头部 -->
          <div class="setting-header">
            <h2 class="setting-title">设置</h2>
            <button class="close-btn" @click="emit('close')">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tab 导航 -->
          <nav class="setting-tabs">
            <button
              :class="['tab-btn', { active: activeTab === 'appearance' }]"
              @click="activeTab = 'appearance'"
            >
              外观
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'synchronize' }]"
              @click="activeTab = 'synchronize'"
            >
              备份
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'search' }]"
              @click="activeTab = 'search'"
            >
              搜索引擎
            </button>

            <button
              :class="['tab-btn', { active: activeTab === 'about' }]"
              @click="activeTab = 'about'"
            >
              关于
            </button>
          </nav>

          <!-- 内容区域 -->
          <div class="setting-body scrollbar">
            <!--  外观 -->
            <div v-if="activeTab === 'appearance'" class="tab-content">
              <Appearance />
            </div>

            <!-- 同步设置区域 -->
            <div v-if="activeTab === 'synchronize'" class="tab-content">
              <Synchronize />
            </div>

            <!-- 搜索引擎 -->
            <div v-if="activeTab === 'search'" class="tab-content">
              <SearchEngine />
            </div>

            <!-- 关于 -->
            <div v-if="activeTab === 'about'" class="tab-content">
              <About />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

// 蒙层 — M3 scrim（半透明遮罩）
.setting-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
}

// 面板 — Tonal Surface（不透明卡片，M3 elevation）
.setting-panel {
  display: flex;
  flex-direction: column;
  width: min(600px, 60vw);
  height: 75vh;
  border-radius: m3.$m3-shape-xl;
  @include tonal-surface(4);
  color: $text-primary;

  @include compact {
    width: 65vw;
    max-height: 70vh;
    border-radius: m3.$m3-shape-lg;
  }
}

// 头部
.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;

  .setting-title {
    @include m3.m3-text(title-medium);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: m3.$m3-shape-sm;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    transition: background m3.$m3-duration-medium m3.$m3-easing-standard;

    &:hover {
      background: rgba(128, 128, 128, 0.12);
    }
  }
}

// Tab 导航
.setting-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 24px 0;
  border-bottom: 0.5px solid m3.$m3-outline-variant;

  .tab-btn {
    padding: 8px 16px;
    border: none;
    border-radius: m3.$m3-shape-sm m3.$m3-shape-sm 0 0;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;
    position: relative;

    &:hover {
      color: $text-primary;
      background: rgba(128, 128, 128, 0.08);
    }

    &.active {
      color: m3.$m3-primary;
      font-weight: 500;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 2px;
        border-radius: 1px;
        background: m3.$m3-primary;
      }
    }
  }
}

// 内容区
.setting-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Transition
.setting {
  @include fade;

  &-enter-from {
    opacity: 0;
    transform: scale(1.08);
  }

  &-leave-to {
    opacity: 0;
    transform: scale(1.04);
  }
}
</style>
