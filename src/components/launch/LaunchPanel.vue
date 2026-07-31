<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { useLaunchStore } from "@/stores/launchStore";
import EditDialog from "@/components/common/EditDialog.vue";
import type { EditData } from "@/components/common/EditDialog.vue";

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const panelRef = ref<HTMLElement>();
onClickOutside(panelRef, () => emit("close"), {
  ignore: [".dialog-overlay"],
});

const launchStore = useLaunchStore();

function openSite(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  window.location.href = url;
  emit("close");
}

// 编辑弹窗
const editVisible = ref(false);
const editInitial = ref<{ name?: string; url?: string; icon?: string }>({});

function openAddDialog() {
  editInitial.value = { name: "", url: "", icon: "" };
  editVisible.value = true;
}

function onSave(data: EditData) {
  launchStore.addItem(data);
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
              >
                <div class="card-icon-wrap">
                  <img :src="item.icon" class="card-icon" />
                </div>
                <span class="card-name">{{ item.name }}</span>
              </button>
            </div>

            <button class="launch-add-btn" @click="openAddDialog">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      title="添加网站"
      :initialName="editInitial.name"
      :initialUrl="editInitial.url"
      :initialIcon="editInitial.icon"
      @close="editVisible = false"
      @save="onSave"
    />
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
</style>
