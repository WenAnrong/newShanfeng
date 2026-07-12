<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useThemeStore } from "@/stores/themeStore";

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const themeStore = useThemeStore();

const panelRef = ref<HTMLElement>();
onClickOutside(panelRef, () => emit("close"));

// 当前选中的 tab
type Tab = "appearance" | "about" | "synchronize" | "search";
const activeTab = ref<Tab>("appearance");

function setThemeMode(m: "light" | "dark" | "auto") {
  themeStore.setThemeMode(m);
}
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
          <div class="setting-body">
            <!--  外观 -->
            <div v-if="activeTab === 'appearance'" class="tab-content">
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
                    :class="[
                      'mode-btn',
                      { active: themeStore.themeMode === opt.id },
                    ]"
                    @click="setThemeMode(opt.id)"
                  >
                    <img :src="opt.img" class="mode-icon" />
                    <span>{{ opt.label }}</span>
                  </button>
                </div>
                <label class="section-label">壁纸管理</label>
              </section>
            </div>

            <!-- 同步设置区域 -->
            <div v-if="activeTab === 'synchronize'" class="tab-content">
              <section class="setting-section">
                <label class="section-label">同步设置</label>
                <div class="synchronize-options">
                  <button class="sync-btn">手动同步</button>
                  <button class="sync-btn">自动同步</button>
                </div>
              </section>
            </div>

            <!-- 搜索引擎 -->
            <div v-if="activeTab === 'search'" class="tab-content">
              暂未实现
            </div>

            <!-- 关于 -->
            <div v-if="activeTab === 'about'" class="tab-content">
              <div class="about-info">
                <h3>山风新页</h3>
                <p class="about-desc">浏览器新标签页扩展</p>
                <div class="about-meta">
                  <span>版本 v0.1.0</span>
                  <span>毛玻璃主题</span>
                </div>
              </div>
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

// ————— 面板卡片 —————
.setting-panel {
  display: flex;
  flex-direction: column;
  width: min(600px, 60vw);
  height: 600px;
  border-radius: 18px;
  overflow: hidden;
  @include glass-panel-setting;
  color: $text-primary;

  @include compact {
    width: 65vw;
    max-height: 70vh;
    border-radius: 14px;
  }
}

// ————— 头部 —————
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

// ————— Tab 导航 —————
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

// ————— 内容区 —————
.setting-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: $glass-border;
    border-radius: 2px;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// ————— 设置项区块 —————
.setting-section {
  .section-label {
    display: block;
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 10px;
    margin-top: 12px;
  }
}

// ————— 主题模式按钮组 —————
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
}

// ————— 占位提示 —————
.tab-placeholder {
  color: $text-secondary;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
}

// ————— 关于 —————
.about-info {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }

  .about-desc {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }

  .about-meta {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
  }
}

// ————— Transition —————
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
