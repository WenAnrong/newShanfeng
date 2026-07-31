<script setup lang="ts">
import { ref, watch } from "vue";
import { svgs } from "@/utils/svg";

export interface EditData {
  name: string;
  url: string;
  icon: string;
}

const props = defineProps<{
  visible: boolean;
  title: string;
  initialName?: string;
  initialUrl?: string;
  initialIcon?: string;
  urlPlaceholder?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: EditData];
}>();

// 表单状态
const name = ref("");
const url = ref("");
const iconUrl = ref(""); // 自定义图标链接
const selectedSvg = ref<string>(""); // 选中的内置 SVG key

// 图标模式：url（自定义链接）或 svg（内置选择）
const iconMode = ref<"svg" | "url">("svg");

// 可用 SVG 图标列表
const svgKeys = Object.keys(svgs);

// 弹窗可见时，用 initial 值初始化表单
watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    name.value = props.initialName ?? "";
    url.value = props.initialUrl ?? "";

    // 判断 initialIcon 是自定义 URL 还是内置 SVG
    const init = props.initialIcon ?? "";
    // 检查是否是内置 SVG（通过 URL 匹配反向查找 key）
    const builtinKey = Object.entries(svgs).find(
      ([, svgUrl]) => svgUrl === init,
    )?.[0];
    if (builtinKey) {
      iconMode.value = "svg";
      selectedSvg.value = builtinKey;
      iconUrl.value = "";
    } else if (init && (init.startsWith("http") || init.startsWith("data:"))) {
      iconMode.value = "url";
      iconUrl.value = init;
      selectedSvg.value = "";
    } else {
      // 默认选第一个 SVG
      iconMode.value = "svg";
      selectedSvg.value = svgKeys[0] ?? "";
      iconUrl.value = "";
    }
  },
);

const panelRef = ref<HTMLElement>();

function submit() {
  const trimmedName = name.value.trim();
  const trimmedUrl = url.value.trim();
  if (!trimmedName || !trimmedUrl) return;

  let icon: string;
  if (iconMode.value === "svg" && selectedSvg.value) {
    icon = svgs[selectedSvg.value]!;
  } else if (iconMode.value === "url" && iconUrl.value.trim()) {
    icon = iconUrl.value.trim();
  } else {
    icon = svgs[svgKeys[0]!]!; // fallback
  }

  emit("save", { name: trimmedName, url: trimmedUrl, icon });
}
</script>

<template>
  <Teleport to="body">
    <div v-show="visible" class="dialog-overlay">
      <div ref="panelRef" class="dialog-panel">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ title }}</h2>
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

        <div class="dialog-body">
          <!-- 名称 -->
          <label class="field">
            <span class="field-label">名称</span>
            <input
              v-model="name"
              type="text"
              class="field-input"
              placeholder="例如：GitHub"
            />
          </label>

          <!-- URL -->
          <label class="field">
            <span class="field-label">链接</span>
            <input
              v-model="url"
              type="text"
              class="field-input"
              :placeholder="urlPlaceholder ?? 'https://example.com'"
            />
          </label>

          <!-- 图标 -->
          <div class="field">
            <div class="icon-mode-bar">
              <span class="field-label">图标</span>
              <div class="mode-toggle">
                <button
                  :class="['toggle-btn', { active: iconMode === 'svg' }]"
                  @click="iconMode = 'svg'"
                >
                  内置图标
                </button>
                <button
                  :class="['toggle-btn', { active: iconMode === 'url' }]"
                  @click="iconMode = 'url'"
                >
                  自定义链接
                </button>
              </div>
            </div>

            <!-- 自定义 URL 输入 -->
            <input
              v-if="iconMode === 'url'"
              v-model="iconUrl"
              type="text"
              class="field-input"
              placeholder="https://example.com/favicon.ico"
            />

            <!-- 内置 SVG 选择器 -->
            <div v-else class="svg-grid scrollbar">
              <button
                v-for="key in svgKeys"
                :key="key"
                :class="['svg-item', { active: selectedSvg === key }]"
                @click="selectedSvg = key"
              >
                <img :src="svgs[key]" class="svg-icon" />
              </button>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="dialog-footer">
          <button class="btn btn-cancel" @click="emit('close')">取消</button>
          <button
            class="btn btn-save"
            :disabled="!name.trim() || !url.trim()"
            @click="submit"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

// 蒙层
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
}

// 面板
.dialog-panel {
  width: min(420px, 90vw);
  display: flex;
  flex-direction: column;
  border-radius: m3.$m3-shape-xl;
  @include tonal-surface(5);
  color: $text-primary;
}

// 头部
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;

  .dialog-title {
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

// 内容
.dialog-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

// 字段
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .field-label {
    font-size: 13px;
    font-weight: 500;
    color: $text-secondary;
  }

  .field-input {
    width: 100%;
    padding: 9px 12px;
    border: 0.5px solid m3.$m3-outline-variant;
    border-radius: m3.$m3-shape-sm;
    background: rgba(128, 128, 128, 0.06);
    outline: none;
    font-size: 14px;
    color: $text-primary;
    transition: border-color m3.$m3-duration-medium m3.$m3-easing-standard;

    &::placeholder {
      color: rgba(128, 128, 128, 0.5);
    }

    &:focus {
      border-color: m3.$m3-primary;
    }
  }
}

// 图标模式切换
.icon-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mode-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: m3.$m3-shape-sm;
  background: m3.$m3-surface-variant;

  .toggle-btn {
    padding: 4px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 11px;
    color: $text-secondary;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    &.active {
      background: m3.$m3-surface;
      color: $text-primary;
      font-weight: 500;
      box-shadow: m3.$m3-elevation-1;
    }
  }
}

// SVG 图标选择器
.svg-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
  padding: 2px;

  .svg-item {
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid m3.$m3-outline-variant;
    border-radius: m3.$m3-shape-sm;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }

    &.active {
      background: m3.$m3-primary-container;
      border-color: m3.$m3-primary;
    }

    .svg-icon {
      width: 22px;
      height: 22px;
      opacity: 0.75;
    }
  }
}

// 底部
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 24px 20px;

  .btn {
    padding: 8px 20px;
    border: none;
    border-radius: m3.$m3-shape-sm;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

    &:active {
      transform: scale(0.97);
    }
  }

  .btn-cancel {
    background: transparent;
    color: $text-secondary;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }
  }

  .btn-save {
    background: m3.$m3-primary;
    color: m3.$m3-on-primary;

    &:hover {
      opacity: 0.88;
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }
}
</style>
