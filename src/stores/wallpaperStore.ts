import { ref } from "vue";
import { defineStore } from "pinia";

import defaultLight from "@/assets/bg/bg1.webp";
import defaultDark from "@/assets/bg/bg2.webp";
import { saveWallpaper, loadWallpaper } from "@/utils/db";

export const useWallpaperStore = defineStore("wallpaper", () => {
  /** 亮色壁纸的 object URL，初始化完成前为 undefined */
  const lightWallpaper = ref<string>();
  /** 暗色壁纸的 object URL，初始化完成前为 undefined */
  const darkWallpaper = ref<string>();
  /** 是否已完成 IndexedDB 加载 */
  const ready = ref(false);

  /** 从 IndexedDB 加载已保存的壁纸，无自定义时回退默认图 */
  async function init() {
    const [lightBlob, darkBlob] = await Promise.all([
      loadWallpaper("light"),
      loadWallpaper("dark"),
    ]);

    // 一次性赋值，避免中间态闪烁
    lightWallpaper.value = lightBlob
      ? URL.createObjectURL(lightBlob)
      : defaultLight;
    darkWallpaper.value = darkBlob
      ? URL.createObjectURL(darkBlob)
      : defaultDark;

    ready.value = true;
  }

  /**
   * 设置壁纸
   * @param mode 亮色/暗色
   * @param file 图片文件
   */
  async function setWallpaper(mode: "light" | "dark", file: File) {
    // 存入 IndexedDB
    await saveWallpaper(mode, file);

    // 更新内存中的 object URL
    const url = URL.createObjectURL(file);
    if (mode === "light") {
      if (lightWallpaper.value) URL.revokeObjectURL(lightWallpaper.value);
      lightWallpaper.value = url;
    } else {
      if (darkWallpaper.value) URL.revokeObjectURL(darkWallpaper.value);
      darkWallpaper.value = url;
    }
  }

  return {
    lightWallpaper,
    darkWallpaper,
    ready,
    init,
    setWallpaper,
  };
});
