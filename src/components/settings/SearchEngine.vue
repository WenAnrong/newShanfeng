<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useEngineStore } from "@/stores/searchStore";
import type { SearchEngine } from "@/stores/searchStore";

const engineStore = useEngineStore();

// 搜索打开方式：'current' | 'newTab'
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

// ------ 添加自定义引擎表单 ------
const showAddForm = ref(false);
const formRef = ref<HTMLElement>();
const editingId = ref<string | null>(null); // 编辑模式：非 null 表示正在编辑某个引擎

const form = ref({
  name: "",
  url: "",
  icon: "",
});

// 点击外部关闭表单
onClickOutside(formRef, () => closeForm(), { ignore: [".add-engine-btn"] });

function openAddForm() {
  editingId.value = null;
  form.value = { name: "", url: "", icon: "" };
  showAddForm.value = true;
}

function openEditForm(engine: SearchEngine) {
  editingId.value = engine.id;
  form.value = {
    name: engine.name,
    url: engine.url,
    icon: engine.isBuiltIn ? "" : engine.icon,
  };
  showAddForm.value = true;
}

function closeForm() {
  showAddForm.value = false;
  editingId.value = null;
}

function submitForm() {
  const name = form.value.name.trim();
  const url = form.value.url.trim();
  if (!name || !url) return;

  if (!url.includes("{keyword}")) {
    // URL 必须包含 {keyword} 占位符
    return;
  }

  if (editingId.value) {
    engineStore.updateEngine(editingId.value, {
      name,
      url,
      icon: form.value.icon.trim() || undefined,
    });
  } else {
    engineStore.addEngine({
      name,
      url,
      icon: form.value.icon.trim(),
    });
  }
  closeForm();
}

function deleteEngine(id: string) {
  engineStore.removeEngine(id);
  closeForm();
}
</script>

<template>
  <div class="search-engine-settings">
    <!-- 默认搜索引擎 -->
    <section class="setting-section">
      <label class="section-label">默认搜索引擎</label>
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
            <!-- 删除按钮：仅自定义引擎显示 -->
            <button
              v-if="!engine.isBuiltIn"
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

    <!-- 添加 / 编辑搜索引擎表单 -->
    <section class="setting-section">
      <div class="form-header">
        <button v-if="!showAddForm" class="add-engine-btn" @click="openAddForm">
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

      <!-- 内联表单 -->
      <div v-if="showAddForm" ref="formRef" class="engine-form">
        <div class="form-field">
          <label class="form-label">名称</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="例如：DuckDuckGo"
          />
        </div>
        <div class="form-field">
          <label class="form-label"
            >搜索 URL
            <span class="form-hint">（含 {keyword} 占位）</span></label
          >
          <input
            v-model="form.url"
            type="text"
            class="form-input"
            placeholder="https://duckduckgo.com/?q={keyword}"
          />
        </div>
        <div class="form-field">
          <label class="form-label">图标 URL（可选）</label>
          <div class="icon-preview-row">
            <img
              :src="form.icon || engineStore.DEFAULT_ICON"
              class="icon-preview"
              alt=""
            />
            <input
              v-model="form.icon"
              type="text"
              class="form-input"
              placeholder="https://example.com/favicon.ico"
            />
          </div>
        </div>
        <div class="form-actions">
          <button class="form-btn form-btn-cancel" @click="closeForm">
            取消
          </button>
          <button
            class="form-btn form-btn-submit"
            :disabled="!form.name.trim() || !form.url.trim()"
            @click="submitForm"
          >
            {{ editingId ? "保存" : "添加" }}
          </button>
        </div>
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

    <!-- 引擎预览提示 -->
    <div class="engine-tip">
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
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>
        当前搜索引擎：
        <strong>{{ engineStore.current?.name }}</strong>
        &mdash; 点击引擎卡片即可切换，搜索框将使用所选引擎
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;

.search-engine-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-section {
  .section-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: 10px;
    letter-spacing: 0.3px;
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
  border: 0.5px solid $glass-border;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    background: $glass-hover-bg;
    border-color: rgba(255, 255, 255, 0.15);

    .engine-delete-btn {
      opacity: 1;
      visibility: visible;
    }
  }

  &:active {
    transform: scale(0.985);
  }

  &.active {
    background: $glass-active-bg;
    border-color: transparent;
    box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.1);

    .engine-name {
      font-weight: 600;
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
    transition: font-weight 0.15s ease;
  }

  .engine-delete-btn {
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
    transition: all 0.15s ease;

    &:hover {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
    }
  }

  .engine-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid $glass-border;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;

    .check-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $text-primary;
      animation: pop-in 0.25s $ease-spring;
    }
  }

  &.active .engine-check {
    border-color: $text-primary;
  }
}

// ===== 添加按钮 =====
.form-header {
  .add-engine-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: 0.5px dashed $glass-border;
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all 0.18s ease;

    &:hover {
      background: $glass-hover-bg;
      color: $text-primary;
      border-style: solid;
    }
  }
}

// ===== 内联表单 =====
.engine-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 0.5px solid $glass-border;
  border-radius: 12px;
  background: $glass-bg;
  animation: form-slide-in 0.22s $ease-out;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .form-label {
    font-size: 12px;
    color: $text-secondary;
  }

  .form-hint {
    font-size: 11px;
    opacity: 0.6;
  }

  .form-input {
    width: 100%;
    padding: 8px 12px;
    border: 0.5px solid $glass-border;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.06);
    outline: none;
    font-size: 13px;
    color: $text-primary;
    transition: border-color 0.15s ease;

    &::placeholder {
      color: rgba(128, 128, 128, 0.6);
    }

    &:focus {
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}

.icon-preview-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .icon-preview {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .form-input {
    flex: 1;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;

  .form-btn {
    padding: 7px 18px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s ease;

    &:active {
      transform: scale(0.97);
    }
  }

  .form-btn-cancel {
    background: transparent;
    color: $text-secondary;

    &:hover {
      background: $glass-hover-bg;
    }
  }

  .form-btn-submit {
    background: rgba(255, 255, 255, 0.15);
    color: $text-primary;
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.22);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
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
    border: 0.5px solid $glass-border;
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    color: $text-secondary;
    transition: all 0.18s ease;

    &:hover {
      background: $glass-hover-bg;
      color: $text-primary;
    }

    &:active {
      transform: scale(0.97);
    }

    &.active {
      background: $glass-active-bg;
      color: $text-primary;
      font-weight: 500;
      border-color: transparent;
      box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.1);

      .mode-icon-svg {
        opacity: 1;
      }
    }

    .mode-icon-svg {
      opacity: 0.55;
      transition: opacity 0.18s ease;
      flex-shrink: 0;
    }

    .mode-hint {
      font-size: 11px;
      font-weight: 400;
      opacity: 0.6;
    }
  }
}

// ===== 底部提示 =====
.engine-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.08);
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
    opacity: 0.6;
  }

  strong {
    color: $text-primary;
    font-weight: 500;
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
