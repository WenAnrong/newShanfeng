import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";
import { ref } from "vue";

const STORAGE_KEY = "shoutcut-list";

interface Shortcuts {
  id: number;
  uid: number;
  name: string;
  path: string;
  icon: string;
}

const defaults: Shortcuts[] = [
  {
    id: 1,
    uid: 1,
    name: "Bing",
    path: "www.bing.com",
    icon: svgs.ai as string,
  },
  {
    id: 2,
    uid: 2,
    name: "aa",
    path: "www.bing.com",
    icon: svgs.bookmark as string,
  },
  {
    id: 3,
    uid: 3,
    name: "bb",
    path: "www.bing.com",
    icon: svgs.home as string,
  },
  {
    id: 4,
    uid: 4,
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
  return defaults.map((d) => ({ ...d }));
}

function persist(shortcuts: Shortcuts[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export const useShortcutStore = defineStore("shortcut", () => {
  let nextUid = 100;

  const shortcuts = ref<Shortcuts[]>(load());
  // 确保 uid 不冲突
  const maxUid = shortcuts.value.reduce((m, s) => Math.max(m, s.uid), 0);
  if (maxUid >= nextUid) nextUid = maxUid + 1;

  // 跨页面实时同步：popup 等页面写入 localStorage 后，已打开的 newtab 自动重载
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      const data = e.newValue ? JSON.parse(e.newValue) : [];
      shortcuts.value = data;
      const m = data.reduce(
        (cur: number, s: Shortcuts) => Math.max(cur, s.uid),
        0,
      );
      if (m >= nextUid) nextUid = m + 1;
    } catch {
      /* ignore */
    }
  });

  function save() {
    persist(shortcuts.value);
  }

  function addShortcut(name: string, path: string, icon: string) {
    const newId = shortcuts.value.length + 1;
    shortcuts.value.push({ id: newId, uid: nextUid++, name, path, icon });
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
      shortcuts.value.forEach((item, idx) => {
        item.id = idx + 1;
      });
      save();
    }
  }

  function moveShortcutById(fromId: number, toId: number) {
    const fromIndex = shortcuts.value.findIndex((s) => s.id === fromId);
    const toIndex = shortcuts.value.findIndex((s) => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;

    const [item] = shortcuts.value.splice(fromIndex, 1);
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    shortcuts.value.splice(insertAt, 0, item as Shortcuts);

    shortcuts.value.forEach((item, idx) => {
      item.id = idx + 1;
    });
    save();
  }

  return {
    shortcuts,
    addShortcut,
    updateShortcut,
    deleteShortcut,
    moveShortcutById,
    save,
  };
});
