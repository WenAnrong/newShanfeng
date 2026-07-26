<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Appearance from "./Appearance.vue";
import About from "./About.vue";
import Synchronize from "./Sync.vue";
import SearchEngine from "./SearchEngine.vue";

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const panelRef = ref<HTMLElement>();
onClickOutside(panelRef, () => emit("close"));

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
              备份和同步
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

// 蒙层
.setting-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  @include glass-panel-3;
}

// 面板卡片
.setting-panel {
  display: flex;
  flex-direction: column;
  width: min(600px, 60vw);
  height: 75vh;
  border-radius: 18px;
  @include glass-panel-setting;
  color: $text-primary;

  @include compact {
    width: 65vw;
    max-height: 70vh;
    border-radius: 14px;
  }
}

// 头部
.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;

  .setting-title {
    font-size: 16px;
    font-weight: 500;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;
    transition: background 0.15s ease;

    &:hover {
      background: $glass-hover-bg;
    }
  }
}

// Tab 导航
.setting-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 24px 0;
  border-bottom: 0.5px solid $glass-border;

  .tab-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px 8px 0 0;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all 0.15s ease;
    position: relative;

    &:hover {
      color: $text-primary;
      background: $glass-hover-bg;
    }

    &.active {
      color: $text-primary;
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
        background: $text-primary;
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
