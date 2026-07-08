import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";

interface Shortcuts {
  id: number;
  name: string;
  path: string;
  icon: string;
}

export const useShortcutStore = defineStore("shortcut", () => {
  const shortcuts: Shortcuts[] = [
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
      icon: svgs.ai as string,
    },
  ];

  // 移除快捷方式
  function deleteShortcut(id: number) {
    const index = shortcuts.findIndex((item) => item.id === id);
    if (index !== -1) {
      shortcuts.splice(index, 1);
      // 重新编号，从 1 开始
      shortcuts.forEach((item, idx) => {
        item.id = idx + 1;
      });
    }
  }

  return { shortcuts, deleteShortcut };
});
