<script setup lang="ts">
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { svgs } from "@/utils/svg";
import { show } from "@/composables/useToast";

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

// ESC：捕获阶段拦截，阻止下层面板同时关闭
useEventListener(
  document,
  "keydown",
  (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.visible) {
      e.stopImmediatePropagation();
      emit("close");
    }
  },
  { capture: true },
);

const name = ref("");
const url = ref("");
const selectedSvg = ref<string>("");
const iconMode = ref<"svg" | "upload">("svg");
const svgKeys = Object.keys(svgs);

// 上传图标：data URL
const uploadedIcon = ref("");
const iconPreview = ref(""); // 当前预览图（内置 SVG URL 或上传的 data URL）
const fileInput = ref<HTMLInputElement>();

// favicon 获取状态
const fetchingIcon = ref(false);
const iconFetchStatus = ref<"idle" | "success" | "fail">("idle");

// 更新图标预览
function updatePreview() {
  if (iconMode.value === "svg" && selectedSvg.value) {
    iconPreview.value = svgs[selectedSvg.value]!;
  } else if (iconMode.value === "upload" && uploadedIcon.value) {
    iconPreview.value = uploadedIcon.value;
  } else {
    iconPreview.value = svgs[svgKeys[0]!]!;
  }
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    name.value = props.initialName ?? "";
    url.value = props.initialUrl ?? "";
    iconFetchStatus.value = "idle";

    const init = props.initialIcon ?? "";
    const builtinKey = Object.entries(svgs).find(
      ([, svgUrl]) => svgUrl === init,
    )?.[0];
    if (builtinKey) {
      iconMode.value = "svg";
      selectedSvg.value = builtinKey;
      uploadedIcon.value = "";
    } else if (init) {
      // 已有的自定义图标（data URL 或外部链接），显示在 upload 模式
      iconMode.value = "upload";
      uploadedIcon.value = init;
      selectedSvg.value = "";
    } else {
      iconMode.value = "svg";
      selectedSvg.value = svgKeys[0] ?? "";
      uploadedIcon.value = "";
    }
    updatePreview();
  },
);

const panelRef = ref<HTMLElement>();

// 从 URL 提取域名
function extractDomain(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  // 去掉协议和路径，只留域名
  const match = trimmed.match(/^(?:https?:\/\/)?([^\/\s]+)/);
  return match?.[1] ?? null;
}

// 上传文件限制
const MAX_ICON_SIZE = 10 * 1024;

// 上传文件：读取为 data URL 存储
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.size > MAX_ICON_SIZE) {
    show(
      `图标文件过大（${(file.size / 1024).toFixed(1)}KB），限制 10KB 以内`,
      "error",
    );
    (e.target as HTMLInputElement).value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    uploadedIcon.value = reader.result as string;
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function openFilePicker() {
  fileInput.value?.click();
}

// 尝试通过 favicon.im 获取图标
function tryFetchIcon() {
  const domain = extractDomain(url.value);
  if (!domain) return;

  fetchingIcon.value = true;
  iconFetchStatus.value = "idle";

  const faviconUrl = `https://favicon.im/${domain}?larger=true`;
  const img = new Image();
  img.onload = () => {
    if (img.naturalWidth > 1) {
      uploadedIcon.value = faviconUrl;
      iconMode.value = "upload";
      updatePreview();
      iconFetchStatus.value = "success";
    } else {
      iconFetchStatus.value = "fail";
    }
    fetchingIcon.value = false;
  };
  img.onerror = () => {
    iconFetchStatus.value = "fail";
    fetchingIcon.value = false;
  };
  img.src = faviconUrl;
}

// URL 失焦时自动获取
function onUrlBlur() {
  if (url.value.trim() && iconFetchStatus.value === "idle") {
    tryFetchIcon();
  }
}

function submit() {
  const trimmedName = name.value.trim();
  const trimmedUrl = url.value.trim();
  if (!trimmedName || !trimmedUrl) return;

  let icon: string;
  if (iconMode.value === "svg" && selectedSvg.value) {
    icon = svgs[selectedSvg.value]!;
  } else if (iconMode.value === "upload" && uploadedIcon.value) {
    icon = uploadedIcon.value;
  } else {
    icon = svgs[svgKeys[0]!]!;
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
              @blur="onUrlBlur"
            />
          </label>

          <!-- 图标 -->
          <div class="field">
            <div class="icon-mode-bar">
              <span class="field-label">图标</span>
              <div class="icon-actions">
                <button
                  class="fetch-btn"
                  :disabled="!url.trim() || fetchingIcon"
                  @click="tryFetchIcon"
                >
                  <svg
                    v-if="fetchingIcon"
                    class="spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <svg
                    v-else
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {{ fetchingIcon ? "获取中" : "获取图标" }}
                </button>
                <div class="mode-toggle">
                  <button
                    :class="['toggle-btn', { active: iconMode === 'svg' }]"
                    @click="iconMode = 'svg'"
                  >
                    内置图标
                  </button>
                  <button
                    :class="['toggle-btn', { active: iconMode === 'upload' }]"
                    @click="iconMode = 'upload'"
                  >
                    上传图标
                  </button>
                </div>
              </div>
            </div>

            <!-- 状态提示 -->
            <div
              v-if="iconFetchStatus === 'success'"
              class="fetch-hint success"
            >
              已自动获取网站图标
            </div>
            <div v-else-if="iconFetchStatus === 'fail'" class="fetch-hint fail">
              未获取到图标，请手动选择内置图标或填写链接
            </div>

            <!-- 上传图标 -->
            <div v-if="iconMode === 'upload'" class="upload-area">
              <img
                v-if="uploadedIcon"
                :src="uploadedIcon"
                class="icon-preview-img"
              />
              <div v-else class="icon-preview-placeholder">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity="0.4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <button class="upload-btn" @click="openFilePicker">
                选择图片
              </button>
              <span v-if="uploadedIcon" class="upload-hint">已上传</span>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                hidden
                @change="onFileChange"
              />
            </div>

            <!-- 内置 SVG 选择器 -->
            <div v-if="iconMode === 'svg'" class="svg-grid scrollbar">
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

.icon-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

// 获取图标按钮
.fetch-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 0.5px solid m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-sm;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: $text-secondary;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover:not(:disabled) {
    background: rgba(128, 128, 128, 0.08);
    color: m3.$m3-primary;
    border-color: m3.$m3-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 状态提示
.fetch-hint {
  font-size: 11px;
  padding: 4px 0;

  &.success {
    color: #2ecc71;
  }
  &.fail {
    color: #e74c3c;
  }
}

// 上传图标区域
.upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 0.5px dashed m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-sm;
}

.icon-preview-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
  background: rgba(128, 128, 128, 0.06);
}

.icon-preview-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  padding: 6px 12px;
  border: 0.5px solid m3.$m3-outline;
  border-radius: m3.$m3-shape-sm;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: $text-primary;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
  }
}

.upload-hint {
  font-size: 11px;
  color: #2ecc71;
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
