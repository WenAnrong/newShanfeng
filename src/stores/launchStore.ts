import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = "launch-list";

export interface LaunchItem {
  id: number;
  name: string;
  url: string;
  icon: string;
}

function load(): LaunchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function persist(items: LaunchItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useLaunchStore = defineStore("launch", () => {
  const items = ref<LaunchItem[]>(load());

  function save() {
    persist(items.value);
  }

  function addItem(item: Omit<LaunchItem, "id">) {
    const id =
      items.value.length > 0
        ? Math.max(...items.value.map((i) => i.id)) + 1
        : 1;
    items.value.push({ ...item, id });
    save();
  }

  function removeItem(id: number) {
    const idx = items.value.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items.value.splice(idx, 1);
      save();
    }
  }

  return { items, addItem, removeItem, save };
});
