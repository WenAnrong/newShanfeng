// 山风新页 popup —— 获取当前网页信息，保存到启动台 / Dock 栏
// 存储键需与 newtab 页面的 store 保持一致
const STORAGE = {
  launch: { key: "launch-list", label: "启动台" },
  dock: { key: "shoutcut-list", label: "Dock 栏" },
};

const $ = (sel) => document.querySelector(sel);

const faviconEl = $("#favicon");
const nameInput = $("#nameInput");
const urlInput = $("#urlInput");
const saveLaunchBtn = $("#saveLaunch");
const saveDockBtn = $("#saveDock");
const statusEl = $("#status");

let faviconUrl = ""; // 当前生效的图标地址（保存时写入）

// ===== 工具 =====
function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

function extractDomain(raw) {
  const trimmed = (raw || "").trim();
  const m = trimmed.match(/^(?:https?:\/\/)?([^/\s]+)/);
  return m ? m[1] : null;
}

function showStatus(text, type = "info") {
  statusEl.textContent = text;
  statusEl.className = "status " + type;
}

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

// ===== favicon =====
function tryFallbackFavicon() {
  const domain = extractDomain(urlInput.value);
  if (!domain) {
    faviconEl.src = "";
    return;
  }
  faviconEl.src = `https://favicon.im/${domain}?larger=true`;
  faviconEl.onerror = () => {
    faviconEl.src = "";
  };
}

function setFavicon(src) {
  faviconUrl = src || "";
  if (!src) {
    tryFallbackFavicon();
    return;
  }
  faviconEl.src = src;
  faviconEl.onerror = () => {
    tryFallbackFavicon();
  };
}

// 链接修改后重新匹配图标
urlInput.addEventListener("change", tryFallbackFavicon);
urlInput.addEventListener("blur", tryFallbackFavicon);

// ===== 保存 =====
function buildRecord(target) {
  const name = nameInput.value.trim();
  const rawUrl = urlInput.value.trim();
  if (!name || !rawUrl) {
    showStatus("请填写名称和链接", "error");
    return null;
  }

  const url = ensureProtocol(rawUrl);
  if (!/^https?:\/\//i.test(url)) {
    showStatus("链接格式不正确，需为 http(s) 地址", "error");
    return null;
  }

  const list = readList(target.key);
  // 去重：按补全协议后的 url 判断
  const exists = list.some((item) => {
    const u = item.url ?? item.path ?? "";
    return ensureProtocol(u) === url;
  });
  if (exists) {
    showStatus(`该网站已在${target.label}中`, "warn");
    return null;
  }

  // id 用时间戳 + 一位随机数：与 newtab 的 launchStore / shortcutStore 生成规则一致，
  // 避免 max+1 与 store 内自增 id 撞号（渲染 key 冲突）
  const id = Date.now() + Math.floor(Math.random() * 10);
  const icon = faviconUrl || "";
  return target.key === STORAGE.dock.key
    ? { id, name, path: url, icon }
    : { id, name, url, icon };
}

function saveTo(target, btn) {
  const record = buildRecord(target);
  if (!record) return;

  try {
    const list = readList(target.key);
    list.push(record);
    localStorage.setItem(target.key, JSON.stringify(list));
  } catch (err) {
    showStatus("保存失败：" + err.message, "error");
    return;
  }

  showStatus(`已保存到${target.label}`, "success");
  btn.disabled = true;
  saveLaunchBtn.disabled = true;
  saveDockBtn.disabled = true;
  // 短暂展示成功状态后自动关闭
  setTimeout(() => window.close(), 900);
}

saveLaunchBtn.addEventListener("click", () => saveTo(STORAGE.launch, saveLaunchBtn));
saveDockBtn.addEventListener("click", () => saveTo(STORAGE.dock, saveDockBtn));

// ===== 初始化：读取当前标签页 =====
document.addEventListener("DOMContentLoaded", async () => {
  let tab = null;
  try {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = t || null;
  } catch {
    tab = null;
  }

  const url = tab?.url || "";
  // 浏览器内部页面（chrome://、扩展页等）无法保存
  if (!tab || !/^https?:\/\//i.test(url)) {
    nameInput.placeholder = "无法读取当前页面";
    urlInput.placeholder = "仅支持 http(s) 网页";
    saveLaunchBtn.disabled = true;
    saveDockBtn.disabled = true;
    showStatus("当前页面无法保存（浏览器内部页面）", "error");
    return;
  }

  const domain = extractDomain(url);
  nameInput.value = (tab.title || domain || "").trim();
  urlInput.value = url;

  // 图标：优先使用标签页 favicon，缺失/失败时用 favicon.im 兜底
  setFavicon(tab.favIconUrl || "");
});
