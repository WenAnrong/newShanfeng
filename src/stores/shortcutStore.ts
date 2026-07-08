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

  // 移动快捷方式
  function moveShortcutById(fromId: number, toId: number) {
    const fromIndex = shortcuts.findIndex((s) => s.id === fromId);
    const toIndex = shortcuts.findIndex((s) => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;

    // 移动元素
    const [item] = shortcuts.splice(fromIndex, 1);
    shortcuts.splice(toIndex, 0, item as Shortcuts);

    // 重新编号 id
    shortcuts.forEach((item, idx) => {
      item.id = idx + 1;
    });
  }

  return { shortcuts, deleteShortcut, moveShortcutById };
});
