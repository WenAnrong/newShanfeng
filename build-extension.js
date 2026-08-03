import { existsSync, cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// 构建产物来源
const distDir = resolve(import.meta.dirname, "dist");
// 各浏览器扩展目录
const chromiumDir = resolve(import.meta.dirname, "extensions/Chromium");
const firefoxDir = resolve(import.meta.dirname, "extensions/Firefox");

// 由构建产物接管、会被删除重建的文件/目录（每个浏览器目录都要同步）
const DIST_FILES = ["index.html", "assets", "favicon.ico"];

// 浏览器无关、可从 Chromium 同步到 Firefox 的共享文件（手动维护，构建时复制）
// manifest.json / service-worker.js 按浏览器各自维护，不参与同步
const SHARED_FILES = ["popup", "icons", "_locales"];

let allSuccess = true;

/**
 * 删除目标目录中旧的构建产物（防止旧 hash 文件残留）
 */
function cleanTarget(targetDir) {
  for (const name of DIST_FILES) {
    const path = resolve(targetDir, name);
    if (existsSync(path)) {
      try {
        rmSync(path, { recursive: true, force: true });
        console.log(`  ✔ 已删除 ${name}`);
      } catch (err) {
        console.error(`  ✗ 删除 ${name} 失败:`, err.message);
        allSuccess = false;
      }
    } else {
      console.log(`  - ${name} 不存在，跳过`);
    }
  }
}

/**
 * 将构建产物从 dist 复制到目标目录
 */
function copyDist(targetDir) {
  if (!existsSync(distDir)) {
    console.error("  ✗ dist/ 目录不存在，请先执行构建");
    allSuccess = false;
    return;
  }
  try {
    cpSync(distDir, targetDir, { recursive: true, force: true });
    console.log("  ✔ 复制完成");
  } catch (err) {
    console.error(`  ✗ 复制失败:`, err.message);
    allSuccess = false;
  }
}

/**
 * 把浏览器无关的共享文件（popup / icons / _locales）从 Chromium 同步到 Firefox
 * Firefox 目录首次构建时自动创建这些文件，之后随 Chromium 同步更新
 */
function syncSharedToFirefox() {
  for (const name of SHARED_FILES) {
    const src = resolve(chromiumDir, name);
    if (!existsSync(src)) {
      console.log(`  - ${name} 在 Chromium 中不存在，跳过`);
      continue;
    }
    try {
      cpSync(src, resolve(firefoxDir, name), { recursive: true, force: true });
      console.log(`  ✔ 已同步 ${name} → Firefox`);
    } catch (err) {
      console.error(`  ✗ 同步 ${name} 到 Firefox 失败:`, err.message);
      allSuccess = false;
    }
  }
}

// ============ Chromium ============
console.log("\n📦 同步构建产物 dist/ → extensions/Chromium/");
cleanTarget(chromiumDir);
copyDist(chromiumDir);

// ============ Firefox ============
console.log("\n📦 同步构建产物 dist/ → extensions/Firefox/");
cleanTarget(firefoxDir);
copyDist(firefoxDir);

console.log("\n🔗 同步共享文件 → extensions/Firefox/");
syncSharedToFirefox();

if (allSuccess) {
  console.log("\n✅ 构建后处理完成（Chromium + Firefox）");
} else {
  console.error("\n⚠️ 构建后处理部分失败");
  process.exit(1);
}
