import { existsSync, cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// chromium 的地址
const chromiumDir = resolve(import.meta.dirname, "extensions/Chromium");
const distDir = resolve(import.meta.dirname, "dist");

// 需要删除的文件和文件夹
const targets = [
  { path: resolve(chromiumDir, "index.html"), name: "index.html" },
  { path: resolve(chromiumDir, "assets"), name: "assets/" },
  { path: resolve(chromiumDir, "favicon.ico"), name: "favicon.ico" },
];

let allSuccess = true;

for (const { path, name } of targets) {
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

// 将构建产物从 dist 复制到 chromiumDir
let copySuccess = true;
console.log("\n📦 复制构建产物 dist/ → extensions/Chromium/");
if (!existsSync(distDir)) {
  console.error("  ✗ dist/ 目录不存在，请先执行构建");
  copySuccess = false;
} else {
  try {
    cpSync(distDir, chromiumDir, { recursive: true, force: true });
    console.log("  ✔ 复制完成");
  } catch (err) {
    console.error(`  ✗ 复制失败:`, err.message);
    copySuccess = false;
  }
}

if (allSuccess && copySuccess) {
  console.log("\n✅ 构建后处理完成");
} else {
  console.error("\n⚠️ 构建后处理部分失败");
  process.exit(1);
}
