# 安装

山风新页是开源的浏览器扩展，你可以**从源码构建安装**，也可以直接加载仓库中已构建好的扩展目录。

::: tip 环境要求
- 构建需要 Node.js 22.18+ 或 24.12+（见根目录 `package.json` 的 `engines` 字段）
- 也可以直接使用 `extensions/` 下已构建的产物，无需安装 Node
:::

## 方式一：源码构建（推荐）

```bash
# 克隆仓库
git clone https://github.com/WenAnrong/newShanfeng.git
cd newShanfeng

# 安装依赖并构建
npm install
npm run build
```

构建完成后，`dist/` 的产物会自动复制到 `extensions/Chromium` 和 `extensions/Firefox` 两个目录（见 [构建与发布](../dev/build)）。

## 方式二：直接加载已构建产物

如果你只是想试用，仓库中的 `extensions/` 目录已是可直接加载的扩展包，无需构建。

### Chrome / Edge 加载

1. 打开 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择仓库中的 `extensions/Chromium` 目录
5. 打开新标签页即可看到山风新页

### Firefox 加载

1. 打开 `about:debugging`
2. 点击「此 Firefox」→「临时载入附加组件」
3. 选择 `extensions/Firefox/manifest.json`
4. 打开新标签页即可看到山风新页

::: warning 注意事项
- 临时加载的扩展在浏览器重启后失效，需要重新加载；正式使用建议走应用商店上架流程
- Firefox 版本需 ≥ 142.0（manifest 中 `strict_min_version` 的要求）
- 加载后如需更新代码，点击扩展卡片上的刷新按钮重新加载即可
:::

## 卸载

- Chrome / Edge：在 `chrome://extensions` 中点击扩展的「移除」按钮
- Firefox：在 `about:addons` 中找到山风新页并移除

卸载不会删除你的配置数据。重新安装后，已保存的壁纸、快捷方式、搜索引擎等配置会自动恢复（数据存储在浏览器为该扩展分配的本地存储中）。
