/// <reference types="vite/client" />

// chrome.bookmarks 最小类型声明（按需扩展，完整类型可用 @types/chrome）

type ChromeListener<T extends (...args: never[]) => unknown> = {
  addListener: (cb: T) => void;
  removeListener: (cb: T) => void;
};

declare global {
  interface ChromeBookmarkNode {
    id: string;
    title: string;
    url?: string;
    children?: ChromeBookmarkNode[];
  }

  namespace chrome {
    namespace bookmarks {
      function getTree(): Promise<ChromeBookmarkNode[]>;
      const onCreated: ChromeListener<
        (id: string, node: ChromeBookmarkNode) => void
      >;
      const onRemoved: ChromeListener<
        (
          id: string,
          removeInfo: {
            parentId: string;
            index: number;
            node: ChromeBookmarkNode;
          },
        ) => void
      >;
      const onChanged: ChromeListener<
        (id: string, changeInfo: { title: string; url?: string }) => void
      >;
      const onMoved: ChromeListener<
        (
          id: string,
          moveInfo: {
            parentId: string;
            index: number;
            oldParentId: string;
            oldIndex: number;
          },
        ) => void
      >;
    }
  }
}

export {};
