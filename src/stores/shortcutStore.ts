import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";

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

  const shortcuts: Shortcuts[] = load();
  // 确保 uid 不冲突
  const maxUid = shortcuts.reduce((m, s) => Math.max(m, s.uid), 0);
  if (maxUid >= nextUid) nextUid = maxUid + 1;

  function save() {
    persist(shortcuts);
  }

  function addShortcut(name: string, path: string, icon: string) {
    const newId = shortcuts.length + 1;
    shortcuts.push({ id: newId, uid: nextUid++, name, path, icon });
    save();
  }

  function updateShortcut(
    id: number,
    patch: { name?: string; path?: string; icon?: string },
  ) {
    const item = shortcuts.find((s) => s.id === id);
    if (!item) return;
    if (patch.name !== undefined) item.name = patch.name;
    if (patch.path !== undefined) item.path = patch.path;
    if (patch.icon !== undefined) item.icon = patch.icon;
    save();
  }

  function deleteShortcut(id: number) {
    const index = shortcuts.findIndex((item) => item.id === id);
    if (index !== -1) {
      shortcuts.splice(index, 1);
      shortcuts.forEach((item, idx) => {
        item.id = idx + 1;
      });
      save();
    }
  }

  function moveShortcutById(fromId: number, toId: number) {
    const fromIndex = shortcuts.findIndex((s) => s.id === fromId);
    const toIndex = shortcuts.findIndex((s) => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;

    const [item] = shortcuts.splice(fromIndex, 1);
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    shortcuts.splice(insertAt, 0, item as Shortcuts);

    shortcuts.forEach((item, idx) => {
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
