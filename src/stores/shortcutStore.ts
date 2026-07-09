import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";

interface Shortcuts {
  id: number;
  uid: number; // 永不改变
  name: string;
  path: string;
  icon: string;
}

export const useShortcutStore = defineStore("shortcut", () => {
  const shortcuts: Shortcuts[] = [
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

  // 添加快捷方式
  function addShortcut(name: string, path: string, icon: string) {
    const newId =
      shortcuts.length > 0 ? Math.max(...shortcuts.map((s) => s.id)) + 1 : 1;
    const newUid =
      shortcuts.length > 0 ? Math.max(...shortcuts.map((s) => s.uid)) + 1 : 1;
    shortcuts.push({
      id: newId,
      uid: newUid,
      name,
      path,
      icon,
    });
  }

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

  // 移动快捷方式（将 fromId 移到 toId 之前）
  function moveShortcutById(fromId: number, toId: number) {
    const fromIndex = shortcuts.findIndex((s) => s.id === fromId);
    const toIndex = shortcuts.findIndex((s) => s.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    if (fromIndex === toIndex) return;

    // 移动元素
    const [item] = shortcuts.splice(fromIndex, 1);
    // 若 toIndex 在 fromIndex 之后，数组已缩短一位，需减 1
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    shortcuts.splice(insertAt, 0, item as Shortcuts);

    // 重新编号 id
    shortcuts.forEach((item, idx) => {
      item.id = idx + 1;
    });
  }

  return { shortcuts, deleteShortcut, moveShortcutById, addShortcut };
});
