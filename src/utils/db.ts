/**
 * IndexedDB 工具 — 壁纸存储
 * 数据库名: shanfeng-wallpaper
 * 对象存储: wallpapers (key: 'light' | 'dark')
 */

const DB_NAME = "shanfeng-wallpaper";
const DB_VERSION = 1;
const STORE_NAME = "wallpapers";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 将图片文件/Blob 存入 IndexedDB */
export async function saveWallpaper(
  key: "light" | "dark",
  blob: Blob,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** 从 IndexedDB 读取壁纸 Blob */
export async function loadWallpaper(
  key: "light" | "dark",
): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      db.close();
      resolve(request.result ?? undefined);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** 删除 IndexedDB 中的壁纸 */
export async function deleteWallpaper(key: "light" | "dark"): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
