import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

import google from "@/assets/engines-icon/google.ico";
import bing from "@/assets/engines-icon/bing.ico";
import baidu from "@/assets/engines-icon/baidu.ico";

export interface SearchEngine {
  id: string;
  name: string;
  icon: string;
  url: string; // 搜索 URL，{keyword} 占位
  isBuiltIn?: boolean; // 内置引擎不可删除
}

const STORAGE_KEY = "search-list";
const CURRENT_KEY = "search-engine";

// 内置引擎（图标由 Vite 导入，保证 URL 始终正确）
const BUILTIN_ENGINES: SearchEngine[] = [
  {
    id: "bing",
    name: "Bing",
    icon: bing,
    url: "https://www.bing.com/search?q={keyword}",
    isBuiltIn: true,
  },
  {
    id: "google",
    name: "Google",
    icon: google,
    url: "https://www.google.com/search?q={keyword}",
    isBuiltIn: true,
  },
  {
    id: "baidu",
    name: "百度",
    icon: baidu,
    url: "https://www.baidu.com/s?wd={keyword}",
    isBuiltIn: true,
  },
];

/** 默认自定义搜索引擎图标（SVG data URI） */
const DEFAULT_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23666'/%3E%3Cpath d='M16 6a10 10 0 0 1 8 4M16 6a10 10 0 0 0-8 4M8 20a10 10 0 0 0 8 4M8 20a10 10 0 0 1 16 0M4 12h24M4 20h24' stroke='%23ccc' stroke-width='1.5' fill='none'/%3E%3Ccircle cx='16' cy='16' r='14' fill='none' stroke='%23999' stroke-width='1'/%3E%3C/svg%3E";

// 从 localStorage 读取引擎列表，合并内置引擎（保证图标 URL 最新）
function loadEngines(): SearchEngine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: SearchEngine[] = JSON.parse(raw);
      // 用内置引擎的当前图标 URL 覆盖旧数据
      return saved.map((e) => {
        const builtin = BUILTIN_ENGINES.find((b) => b.id === e.id);
        return builtin ? { ...e, icon: builtin.icon, isBuiltIn: true } : e;
      });
    }
  } catch {
    // 解析失败则回退到默认
  }
  return [...BUILTIN_ENGINES];
}

// 持久化到 localStorage
function saveEngines(list: SearchEngine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export const useEngineStore = defineStore("engine", () => {
  // ------ 搜索引擎列表 ------
  const engines = ref<SearchEngine[]>(loadEngines());

  // 引擎列表变化时自动持久化
  watch(engines, (val) => saveEngines(val), { deep: true });

  // ------ 当前选中的引擎 ID ------
  const currentId = ref<string>(localStorage.getItem(CURRENT_KEY) || "bing");

  // 切换当前搜索引擎
  function setCurrentEngine(id: string) {
    if (engines.value.some((e) => e.id === id)) {
      currentId.value = id;
      localStorage.setItem(CURRENT_KEY, id);
    }
  }

  const current = computed(() =>
    engines.value.find((e) => e.id === currentId.value),
  );

  // ------ 增删改 ------

  /** 生成唯一 ID */
  function generateId(): string {
    return (
      "custom-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  /** 添加自定义搜索引擎 */
  function addEngine(engine: { name: string; url: string; icon?: string }) {
    const id = generateId();
    engines.value.push({
      ...engine,
      id,
      icon: engine.icon || DEFAULT_ICON,
      isBuiltIn: false,
    });
    return id;
  }

  /** 删除自定义搜索引擎（内置引擎不可删除） */
  function removeEngine(id: string) {
    const target = engines.value.find((e) => e.id === id);
    if (!target || target.isBuiltIn) return false;

    engines.value = engines.value.filter((e) => e.id !== id);

    // 如果删除的是当前选中的引擎，切换到第一个
    if (currentId.value === id) {
      currentId.value = engines.value[0]?.id ?? "bing";
      localStorage.setItem(CURRENT_KEY, currentId.value);
    }
    return true;
  }

  /** 更新自定义搜索引擎 */
  function updateEngine(
    id: string,
    patch: Partial<Omit<SearchEngine, "id" | "isBuiltIn">>,
  ) {
    const target = engines.value.find((e) => e.id === id);
    if (!target || target.isBuiltIn) return false;

    if (patch.name !== undefined) target.name = patch.name;
    if (patch.url !== undefined) target.url = patch.url;
    if (patch.icon !== undefined) target.icon = patch.icon;
    // 触发 watch 持久化
    engines.value = [...engines.value];
    return true;
  }

  return {
    engines,
    currentId,
    current,
    setCurrentEngine,
    addEngine,
    removeEngine,
    updateEngine,
    DEFAULT_ICON,
  };
});
