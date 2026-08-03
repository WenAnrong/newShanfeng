<script setup lang="ts">
import { ref } from "vue";
import { useEventListener } from "@vueuse/core";
import { show } from "@/composables/useToast";

// ============ 备份格式 ============
interface Backup {
  app: string;
  version: number;
  exportedAt?: string;
  data: Record<string, unknown>;
}

const BACKUP_APP = "shanfeng-newtab";
const BACKUP_VERSION = 1;

// 需要备份的 localStorage 键（原始字符串存储，不关心内部格式）
const BACKUP_KEYS = [
  "search-engine",
  "search-list",
  "search-open-mode",
  "shoutcut-list",
  "launch-list",
];

// ============ 收集 / 应用备份 ============
function collectBackup(): Backup {
  const data: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

function validateBackup(backup: Backup) {
  if (!backup || backup.app !== BACKUP_APP || !backup.data) {
    throw new Error("不是有效的山风新页备份文件");
  }
}

// 覆盖式导入：备份中出现的键整体覆盖，备份中缺失的键保持现状
function applyBackup(backup: Backup) {
  validateBackup(backup);
  for (const [key, value] of Object.entries(backup.data)) {
    if (typeof value === "string") localStorage.setItem(key, value);
  }
}

// 需要合并的列表键；其余标量键（搜索引擎选择、打开方式等）合并时以备份为准直接覆盖
const MERGE_KEYS = ["search-list", "shoutcut-list", "launch-list"];

// 合并式导入：以本地列表为基础，把备份中不存在的项（按 URL 去重）追加进去
function mergeBackup(backup: Backup) {
  validateBackup(backup);
  for (const [key, raw] of Object.entries(backup.data)) {
    if (typeof raw !== "string") continue;
    if (MERGE_KEYS.includes(key)) {
      mergeListKey(key, raw);
    } else {
      localStorage.setItem(key, raw);
    }
  }
}

// URL 归一化（补全协议），用于跨列表去重
function normalizeUrl(u?: string) {
  if (!u) return "";
  const s = u.trim();
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}

function itemUrl(item: Record<string, unknown>) {
  return normalizeUrl((item.url as string) ?? (item.path as string) ?? "");
}

function mergeListKey(key: string, rawBackup: string) {
  let local: Record<string, unknown>[] = [];
  let backupList: Record<string, unknown>[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (Array.isArray(parsed)) local = parsed;
  } catch {
    /* ignore */
  }
  try {
    const parsed = JSON.parse(rawBackup);
    if (Array.isArray(parsed)) backupList = parsed;
  } catch {
    /* ignore */
  }

  const seen = new Set(local.map(itemUrl));
  const merged = [...local];

  for (const item of backupList) {
    if (!item || typeof item !== "object") continue;
    const url = itemUrl(item);
    if (url && seen.has(url)) continue; // 本地已存在相同 URL，跳过
    const copy = { ...item };
    // 数字 id 列表（launch-list / shoutcut-list）重新分配：时间戳 + 一位随机数，保证全局唯一（渲染 key）
    // search-list 的 id 是字符串标识（custom-xxx），保留原值，避免破坏 currentId 关联
    if (key !== "search-list") {
      copy.id = Date.now() + Math.floor(Math.random() * 10);
    }
    seen.add(url);
    merged.push(copy);
  }

  localStorage.setItem(key, JSON.stringify(merged));
}

// ============ 导出 / 导入 ============
function exportBackup() {
  const backup = collectBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `shanfeng-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  show("已导出备份文件", "success");
}

const importInput = ref<HTMLInputElement>();

// 导入方式选择弹窗
const showImportDialog = ref(false);
const pendingBackup = ref<Backup | null>(null);

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result as string) as Backup;
      validateBackup(backup);
      pendingBackup.value = backup;
      showImportDialog.value = true; // 弹窗让用户选择导入方式
    } catch (err) {
      show("导入失败：" + (err as Error).message, "error");
    }
  };
  reader.readAsText(file);
  (e.target as HTMLInputElement).value = "";
}

function confirmImport(mode: "overwrite" | "merge") {
  const backup = pendingBackup.value;
  if (!backup) return;
  try {
    if (mode === "overwrite") {
      applyBackup(backup);
      show("导入成功（覆盖），即将刷新页面", "success");
    } else {
      mergeBackup(backup);
      show("导入成功（合并），即将刷新页面", "success");
    }
  } catch (err) {
    show("导入失败：" + (err as Error).message, "error");
    return;
  }
  showImportDialog.value = false;
  pendingBackup.value = null;
  setTimeout(() => location.reload(), 900);
}

function cancelImport() {
  showImportDialog.value = false;
  pendingBackup.value = null;
}

// 弹窗打开时，ESC 只关闭弹窗（捕获阶段拦截，避免下层的设置面板被连带关闭）
useEventListener(
  document,
  "keydown",
  (e: KeyboardEvent) => {
    if (e.key === "Escape" && showImportDialog.value) {
      e.stopImmediatePropagation();
      cancelImport();
    }
  },
  { capture: true },
);

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<template>
  <section class="setting-section">
    <label class="section-label">手动备份</label>
    <div class="sync-card">
      <p class="card-desc">
        将主题、搜索引擎、Dock 快捷方式和启动台网站导出为 JSON
        文件，或从文件恢复。备份不包含壁纸图片。
      </p>
      <div class="btn-row">
        <button class="btn btn-primary" @click="exportBackup">导出数据</button>
        <button class="btn btn-outline" @click="importInput?.click()">
          导入数据
        </button>
      </div>
      <input
        ref="importInput"
        type="file"
        accept="application/json,.json"
        hidden
        @change="onImportFile"
      />
    </div>
  </section>

  <!-- 导入方式选择弹窗 -->
  <Teleport to="body">
    <Transition name="import-dialog">
      <div
        v-if="showImportDialog"
        class="import-overlay"
        @click.self="cancelImport"
      >
        <div class="import-panel">
          <h3 class="import-title">导入备份</h3>
          <p class="import-desc">
            备份时间：{{
              pendingBackup?.exportedAt
                ? formatTime(pendingBackup.exportedAt)
                : "未知"
            }}
            · 包含 {{ Object.keys(pendingBackup?.data ?? {}).length }} 项配置
          </p>
          <p class="import-desc">请选择导入方式：</p>
          <div class="import-actions">
            <button class="btn btn-primary" @click="confirmImport('overwrite')">
              覆盖导入
            </button>
            <button class="btn btn-outline" @click="confirmImport('merge')">
              合并导入
            </button>
          </div>
          <div class="import-tips">
            <p class="import-desc">覆盖：以备份为准替换现有数据</p>
            <p class="import-desc">
              合并：保留本地数据，仅追加备份中不存在的网站
            </p>
          </div>
          <button class="import-cancel" @click="cancelImport">取消</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/glass" as *;
@use "@/assets/m3-tokens" as m3;

.setting-section {
  .section-label {
    display: block;
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 10px;
    &:not(:first-child) {
      margin-top: 12px;
    }
  }
}

// 功能卡片
.sync-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 0.5px solid m3.$m3-outline-variant;
  border-radius: m3.$m3-shape-md;
  background: rgba(128, 128, 128, 0.04);

  .card-desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: $text-secondary;
  }
}

// 按钮
.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 18px;
  border-radius: m3.$m3-shape-sm;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all m3.$m3-duration-medium m3.$m3-easing-standard;

  &:active {
    transform: scale(0.97);
  }
}

.btn-primary {
  background: m3.$m3-primary;
  color: m3.$m3-on-primary;
  border: none;

  &:hover {
    opacity: 0.88;
  }
}

.btn-outline {
  background: transparent;
  color: $text-primary;
  border: 0.5px solid m3.$m3-outline;

  &:hover {
    background: rgba(128, 128, 128, 0.08);
  }
}

// ============ 导入方式选择弹窗 ============
.import-overlay {
  position: fixed;
  inset: 0;
  z-index: 260;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.32);
}

.import-panel {
  width: min(380px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px;
  border-radius: m3.$m3-shape-xl;
  @include tonal-surface(5);
  color: $text-primary;

  .import-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .import-desc {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: $text-secondary;
  }

  .import-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }

  .import-tips {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border-radius: m3.$m3-shape-sm;
    background: rgba(128, 128, 128, 0.05);
  }

  .import-cancel {
    align-self: center;
    margin-top: 6px;
    padding: 6px 16px;
    border: none;
    border-radius: m3.$m3-shape-sm;
    background: transparent;
    color: $text-secondary;
    font-size: 13px;
    cursor: pointer;
    transition: background m3.$m3-duration-medium m3.$m3-easing-standard;

    &:hover {
      background: rgba(128, 128, 128, 0.08);
    }
  }
}

.import-dialog {
  &-enter-active,
  &-leave-active {
    transition: opacity m3.$m3-duration-medium m3.$m3-easing-standard;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>
