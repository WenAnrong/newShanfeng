<script setup lang="ts">
import { ref } from "vue";
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

function applyBackup(backup: Backup) {
  if (!backup || backup.app !== BACKUP_APP || !backup.data) {
    throw new Error("不是有效的山风新页备份文件");
  }
  for (const [key, value] of Object.entries(backup.data)) {
    if (typeof value === "string") localStorage.setItem(key, value);
  }
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

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result as string) as Backup;
      applyBackup(backup);
      show("导入成功，即将刷新页面", "success");
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      show("导入失败：" + (err as Error).message, "error");
    }
  };
  reader.readAsText(file);
  (e.target as HTMLInputElement).value = "";
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
    margin-top: 12px;
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
</style>
