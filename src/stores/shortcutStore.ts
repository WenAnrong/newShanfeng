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
  function deleteShortcut(id: number) {}

  return { shortcuts };
});
