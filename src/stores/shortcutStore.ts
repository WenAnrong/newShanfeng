import { defineStore } from "pinia";

interface Shortcuts {
  name: string;
  path: string;
  icon: string;
}

export const useShortcutStore = defineStore("shortcut", () => {
  const shortcuts: Shortcuts[] = [];

  return { shortcuts };
});
