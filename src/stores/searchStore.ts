import { defineStore } from "pinia";
import { ref, computed } from "vue";

import google from "@/assets/engines-icon/google.ico";
import bing from "@/assets/engines-icon/bing.ico";
import baidu from "@/assets/engines-icon/baidu.ico";

interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  url: string; // 搜索 URL，{keyword} 占位
}

export const useEngineStore = defineStore("engine", () => {
  // 默认搜索引擎列表
  const engines: SearchEngine[] = [
    {
      id: "bing",
      name: "Bing",
      icon: bing,
      url: "https://www.bing.com/search?q={keyword}",
    },
    {
      id: "google",
      name: "Google",
      icon: google,
      url: "https://www.google.com/search?q={keyword}",
    },
    {
      id: "baidu",
      name: "百度",
      icon: baidu,
      url: "https://www.baidu.com/s?wd={keyword}",
    },
  ];

  // 当前搜索引擎 ID，从 localStorage 中获取，如果没有则默认使用 "bing"
  const currentId = ref<string>(
    localStorage.getItem("search-engine") || "bing",
  );

  // 切换搜索引擎
  function setCurrentEngine(id: string) {
    if (engines.some((e) => e.id === id)) {
      currentId.value = id;
      // 将选中的搜索引擎 ID 保存到 localStorage
      localStorage.setItem("search-engine", id);
    }
  }

  // 当前搜索引擎对象
  const current = computed(() => engines.find((e) => e.id === currentId.value));

  return { setCurrentEngine, currentId, current, engines };
});
