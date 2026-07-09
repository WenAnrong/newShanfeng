import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { usePreferredDark } from "@vueuse/core";
import { svgs } from "@/utils/svg";

export type ThemeMode = "light" | "dark" | "auto";

export const useThemeStore = defineStore("theme", () => {
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem("theme-mode") as ThemeMode) || "auto",
  );
  const preferredDark = usePreferredDark();

  // 有效主题：根据 mode 和系统偏好计算出实际亮暗
  const effectiveTheme = computed(() => {
    if (themeMode.value === "auto") {
      return preferredDark.value ? "dark" : "light";
    }
    return themeMode.value;
  });

  // 图标
  const themeIcon = computed(() => {
    if (themeMode.value === "light") return svgs.light;
    if (themeMode.value === "dark") return svgs.dark;
    return svgs.auto;
  });

  // 文字
  const themeLabel = computed(() => {
    if (themeMode.value === "light") return "亮色";
    if (themeMode.value === "dark") return "暗色";
    return "自动";
  });

  // 循环切换：亮色 → 暗色 → 自动
  function cycleTheme() {
    const order = ["light", "dark", "auto"] as const;
    const idx = order.indexOf(themeMode.value);
    themeMode.value = order[(idx + 1) % order.length] as ThemeMode;
  }

  // 直接设置
  function setThemeMode(m: ThemeMode) {
    themeMode.value = m;
  }

  // 同步到 DOM（data-theme）和 localStorage
  watch(
    [themeMode, effectiveTheme],
    ([mode, effective]) => {
      document.documentElement.dataset.theme = effective;
      localStorage.setItem("theme-mode", mode);
    },
    { immediate: true },
  );

  return {
    themeMode,
    effectiveTheme,
    themeIcon,
    themeLabel,
    cycleTheme,
    setThemeMode,
  };
});
