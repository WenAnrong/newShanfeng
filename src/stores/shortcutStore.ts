import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";
import { ref } from "vue";

const STORAGE_KEY = "shoutcut-list";

interface Shortcuts {
  id: number;
  name: string;
  path: string;
  icon: string;
}

const defaults: Shortcuts[] = [
  {
    id: 1,
    name: "Bing",
    path: "www.bing.com",
    icon: svgs.ai as string,
  },
  {
    id: 2,
    name: "aa",
    path: "www.bing.com",
    icon: svgs.bookmark as string,
  },
  {
    id: 3,
    name: "bb",
    path: "www.bing.com",
    icon: svgs.home as string,
  },
  {
    id: 4,
    name: "cc",
    path: "www.bing.com",
    icon: svgs.image as string,
  },
];

function load(): Shortcuts[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  // 首次初始化：把默认项写入 localStorage。
  const initial = defaults.map((d) => ({ ...d }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    /* ignore */
  }
  return initial;
}

function persist(shortcuts: Shortcuts[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

/**
 * 生成全局唯一 id：时间戳 + 一位随机数
 * 与 launchStore / popup 的生成规则一致，跨页面写入不撞号；
 * 只生成不重编号，数组顺序即 Dock 显示顺序。
 */
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 10);
}

export const useShortcutStore = defineStore("shortcut", () => {
  const shortcuts = ref<Shortcuts[]>(load());

  // 跨页面实时同步：popup 等页面写入 localStorage 后，已打开的 newtab 自动重载
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      shortcuts.value = e.newValue ? JSON.parse(e.newValue) : [];
    } catch {
      /* ignore */
    }
  });

  function save() {
    persist(shortcuts.value);
  }

  function addShortcut(name: string, path: string, icon: string) {
    shortcuts.value.push({ id: generateId(), name, path, icon });
    save();
  }

  function updateShortcut(
    id: number,
    patch: { name?: string; path?: string; icon?: string },
  ) {
    const item = shortcuts.value.find((s) => s.id === id);
    if (!item) return;
    if (patch.name !== undefined) item.name = patch.name;
    if (patch.path !== undefined) item.path = patch.path;
    if (patch.icon !== undefined) item.icon = patch.icon;
    save();
  }

  function deleteShortcut(id: number) {
    const index = shortcuts.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      shortcuts.value.splice(index, 1);
      save();
    }
  }

  return {
    shortcuts,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    save,
  };
});
