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
  const engines: SearchEngine[] = [
    {
      id: "google",
      name: "Google",
      icon: google,
      url: "https://www.google.com/search?q={keyword}",
    },
    {
      id: "bing",
      name: "Bing",
      icon: bing,
      url: "https://www.bing.com/search?q={keyword}",
    },
    {
      id: "baidu",
      name: "百度",
      icon: baidu,
      url: "https://www.baidu.com/s?wd={keyword}",
    },
  ];

  const currentId = ref("google");
  const current = computed(() => engines.find((e) => e.id === currentId.value));

  return { currentId, current, engines };
});
