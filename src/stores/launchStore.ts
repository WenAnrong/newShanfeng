import { defineStore } from "pinia";
import { svgs } from "@/utils/svg";

export interface LaunchItem {
  id: number;
  name: string;
  url: string;
  icon: string | undefined; // SVG URL
}

export const useLaunchStore = defineStore("launch", () => {
  const items: LaunchItem[] = [
    { id: 1, name: "GitHub", url: "https://github.com", icon: svgs.folder },
    { id: 2, name: "Gmail", url: "https://mail.google.com", icon: svgs.email },
    { id: 3, name: "YouTube", url: "https://youtube.com", icon: svgs.video },
    { id: 4, name: "Reddit", url: "https://reddit.com", icon: svgs.share },
    { id: 5, name: "Notion", url: "https://notion.so", icon: svgs.edit },
    { id: 6, name: "Figma", url: "https://figma.com", icon: svgs.image },
    {
      id: 7,
      name: "Google 翻译",
      url: "https://translate.google.com",
      icon: svgs.translate,
    },
    {
      id: 8,
      name: "Spotify",
      url: "https://open.spotify.com",
      icon: svgs.music,
    },
    {
      id: 9,
      name: "Google 日历",
      url: "https://calendar.google.com",
      icon: svgs.calendar,
    },
    {
      id: 10,
      name: "百度网盘",
      url: "https://pan.baidu.com",
      icon: svgs.download,
    },
    { id: 11, name: "豆瓣", url: "https://douban.com", icon: svgs.heart },
    {
      id: 12,
      name: "微信读书",
      url: "https://weread.qq.com",
      icon: svgs.bookmark,
    },
  ];

  function removeItem(id: number) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) items.splice(idx, 1);
  }

  function addItem(item: Omit<LaunchItem, "id">) {
    const id = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    items.push({ ...item, id });
  }

  return { items, removeItem, addItem };
});
