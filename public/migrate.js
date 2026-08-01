/**
 * 山风新页 — 旧版数据迁移脚本
 *
 * 旧版（oldShanfeng）把数据存在 chrome.storage.local，新版改为 localStorage：
 *   favorites  -> launch-list    （删除多余字段 categoryId，id 重新编号为 number，icon 归一化）
 *   shortcuts  -> shoutcut-list  （url 字段映射为 path，补齐 uid，id 重新编号为 number）
 * 迁移完成后清空 chrome.storage.local 中全部旧版插件存储。
 *
 * 仅需执行一次：第一次打开新版 newtab 时，检测到旧数据则转换；
 * 转换完成写入 localStorage 并清空旧存储后重载页面，让 store 读到新数据。
 * 之后 chrome.storage.local 为空，脚本直接跳过，无任何副作用。
 *
 * 注意：此文件由 vite 从 public/ 原样复制到 dist/，再由 build-extension.js
 * 复制到 extensions/Chromium/，因此必须保持纯浏览器脚本（无 import / module 语法）。
 */
(function () {
  "use strict";

  // 仅在 Chrome 扩展页面中运行（npm run dev 的普通浏览器环境没有 chrome.storage，直接跳过）
  if (!window.chrome || !chrome.storage || !chrome.storage.local) return;

  // 新版 localStorage 存储键（与 src/stores/launchStore.ts、shortcutStore.ts 保持一致）
  var LS_LAUNCH = "launch-list";
  var LS_SHORTCUT = "shoutcut-list";

  // 旧版可能写入 chrome.storage.local 的全部键，用于判断是否残留旧数据
  var OLD_KEYS = [
    "favorites",
    "categories",
    "shortcuts",
    "searchEngine",
    "searchEngines",
    "themeColor",
    "webdav_url",
    "webdav_username",
    "webdav_password",
    "last_sync_time",
  ];

  // 旧版残留在 localStorage 的键（vueuse 暗色模式），迁移时一并清理
  var LEGACY_LS_KEYS = ["vueuse-color-scheme"];

  /**
   * chrome.storage 可能把数组存成对象（如 {0: {...}, 1: {...}}），统一转为数组
   */
  function toArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === "object") {
      return Object.keys(data)
        .map(function (k) {
          return data[k];
        })
        .filter(function (v) {
          return v != null;
        });
    }
    return [];
  }

  /**
   * icon 归一化（新版组件用 <img :src="icon"> 渲染）：
   *   - 'default' / 空值 / 非字符串 -> ''（由组件兜底）
   *   - raw SVG 字符串 -> data URL，否则 <img> 无法显示
   *   - 其余（http(s)/data: URL）原样保留
   */
  function normalizeIcon(icon) {
    if (icon === "default") return "";
    if (typeof icon !== "string") return "";
    var s = icon.trim();
    if (!s) return "";
    if (s.charAt(0) === "<") {
      return "data:image/svg+xml," + encodeURIComponent(s);
    }
    return s;
  }

  /** 兜底转字符串，null/undefined -> '' */
  function clean(value) {
    return value == null ? "" : String(value);
  }

  /** 判断对象是否包含某键 */
  function hasKey(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function migrate() {
    chrome.storage.local.get(null, function (all) {
      if (chrome.runtime && chrome.runtime.lastError) return;
      all = all || {};

      // 无任何旧版数据 -> 无需迁移
      var hasOld = OLD_KEYS.some(function (k) {
        return hasKey(all, k);
      });
      if (!hasOld) return;

      var changed = false;

      // ===== favorites -> launch-list =====
      // 新版 LaunchItem: { id: number, name, url, icon }
      // 多余字段（categoryId、旧字符串 id）在映射时丢弃；id 从 1 重新编号
      if (
        hasKey(all, "favorites") &&
        localStorage.getItem(LS_LAUNCH) === null
      ) {
        var launchList = toArray(all.favorites).map(function (f, i) {
          return {
            id: i + 1,
            name: clean(f && f.name),
            url: clean(f && f.url),
            icon: normalizeIcon(f && f.icon),
          };
        });
        try {
          localStorage.setItem(LS_LAUNCH, JSON.stringify(launchList));
          changed = true;
        } catch (e) {
          /* localStorage 写入失败（配额等），放弃迁移，避免误清空旧数据 */
          return;
        }
      }

      // ===== shortcuts -> shoutcut-list =====
      // 新版 Shortcuts: { id: number, uid: number, name, path, icon }
      // 旧版 url 字段映射为新版 path；补齐 uid（唯一）；id 从 1 重新编号
      if (
        hasKey(all, "shortcuts") &&
        localStorage.getItem(LS_SHORTCUT) === null
      ) {
        var now = Date.now();
        var shortcutList = toArray(all.shortcuts).map(function (s, i) {
          return {
            id: i + 1,
            uid: now + i,
            name: clean(s && s.name),
            path: clean(s && s.url),
            icon: normalizeIcon(s && s.icon),
          };
        });
        try {
          localStorage.setItem(LS_SHORTCUT, JSON.stringify(shortcutList));
          changed = true;
        } catch (e) {
          return;
        }
      }

      // 清理旧版残留在 localStorage 的键（暗色模式由新版 theme-mode 接管）
      LEGACY_LS_KEYS.forEach(function (k) {
        localStorage.removeItem(k);
      });

      // ===== 清空 chrome.storage.local 全部旧版插件存储 =====
      chrome.storage.local.clear(function () {
        if (chrome.runtime && chrome.runtime.lastError) return;
        // 有新数据写入则重载，让 store 从 localStorage 初始化（仅首次迁移时触发一次）
        if (changed) location.reload();
      });
    });
  }

  migrate();
})();
