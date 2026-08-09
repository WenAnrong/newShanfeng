import { ref, type Ref } from "vue";

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  path: string;
}

export interface UseBookmarkSearchReturn {
  results: Ref<BookmarkItem[]>;
  isSupported: boolean;
  init: () => void;
  search: (query: string) => void;
  clear: () => void;
}

/** 运行在扩展页面时才有 chrome.bookmarks（dev 环境为 localhost，无此 API） */
function hasBookmarks(): boolean {
  return typeof chrome !== "undefined" && !!chrome.bookmarks;
}

/** 展平书签树为 { id, title, url, path } 列表，过滤无 url 的文件夹节点，但保留其名称进 path */
function flattenTree(
  nodes: ChromeBookmarkNode[],
  parentPath: string,
  out: BookmarkItem[],
): void {
  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.title}` : node.title;
    if (node.url) {
      out.push({ id: node.id, title: node.title, url: node.url, path });
    }
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, path, out);
    }
  }
}

/** 匹配评分：标题命中 > URL 命中 > 路径命中 */
function scoreOf(item: BookmarkItem, q: string): number {
  let score = 0;
  if (item.title.toLowerCase().includes(q)) score += 3;
  if (item.url.toLowerCase().includes(q)) score += 2;
  if (item.path.toLowerCase().includes(q)) score += 1;
  return score;
}

const MAX_RESULTS = 5;
/** 书签变更事件的轻量防抖，避免一次操作触发多次整树重拉 */
const RELOAD_DEBOUNCE = 300;

export function useBookmarkSearch(): UseBookmarkSearchReturn {
  const results = ref<BookmarkItem[]>([]);
  const bookmarks = ref<BookmarkItem[]>([]);

  const isSupported = hasBookmarks();
  let initialized = false;
  let reloadTimer: ReturnType<typeof setTimeout> | null = null;

  async function reload(): Promise<void> {
    if (!isSupported) return;
    try {
      const tree = await chrome.bookmarks.getTree();
      const flat: BookmarkItem[] = [];
      flattenTree(tree, "", flat);
      bookmarks.value = flat;
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
      bookmarks.value = [];
    }
  }

  function scheduleReload(): void {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => void reload(), RELOAD_DEBOUNCE);
  }

  /**
   * 初始化：整树加载一次 + 监听书签增删改移事件增量同步（整树重拉，简单可靠）。
   * 幂等，可重复调用。
   */
  function init(): void {
    if (!isSupported || initialized) return;
    initialized = true;
    void reload();
    chrome.bookmarks.onCreated.addListener(() => scheduleReload());
    chrome.bookmarks.onRemoved.addListener(() => scheduleReload());
    chrome.bookmarks.onChanged.addListener(() => scheduleReload());
    chrome.bookmarks.onMoved.addListener(() => scheduleReload());
  }

  /** 按关键词过滤并排序，取前 MAX_RESULTS 条；关键词 < 2 字符时清空 */
  function search(query: string): void {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      results.value = [];
      return;
    }
    results.value = bookmarks.value
      .map((b) => ({ b, score: scoreOf(b, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((x) => x.b);
  }

  function clear(): void {
    results.value = [];
  }

  return { results, isSupported, init, search, clear };
}
