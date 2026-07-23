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

    // 数据库版本升级或首次创建时触发
    request.onupgradeneeded = () => {
      const db = request.result;
      // 如果对象存储不存在，则创建它
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    // 打开数据库成功时触发
    request.onsuccess = () => resolve(request.result);
    // 打开数据库失败时触发
    request.onerror = () => reject(request.error);
  });
}

/**
 * 将壁纸图片（Blob 对象）保存到 IndexedDB
 * @param key - 存储键名，只能是 'light' 或 'dark'
 * @param blob - 图片的 Blob 数据（通常来自 File 或 fetch 响应）
 * @returns Promise，保存完成后 resolve，失败则 reject
 */
export async function saveWallpaper(
  key: "light" | "dark",
  blob: Blob,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 创建读写事务
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // 将 Blob 存入对象存储，键为传入的 key
    store.put(blob, key);

    // 事务完成时触发
    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    // 事务出错时触发
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * 从 IndexedDB 加载指定键的壁纸 Blob
 * @param key - 存储键名，只能是 'light' 或 'dark'
 * @returns Promise，解析为 Blob 对象；如果键不存在则返回 undefined
 */
export async function loadWallpaper(
  key: "light" | "dark",
): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 创建只读事务
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

/**
 * 删除 IndexedDB 中的壁纸
 * @param key - 要删除的壁纸键名，只能是 'light' 或 'dark'
 * @returns Promise，删除成功后 resolve，失败则 reject
 */
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
