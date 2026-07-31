/**
 * M3 动态取色引擎
 *
 * 流程：壁纸 URL → Canvas 像素采样 → 主色提取 → M3 色板生成 → CSS 变量注入
 */

// ============================================================
// 类型定义
// ============================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface M3Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  // 毛玻璃专用
  glassBg: string;
  glassBorder: string;
}

// ============================================================
// 颜色空间转换
// ============================================================

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case rf:
      h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
      break;
    case gf:
      h = ((bf - rf) / d + 2) / 6;
      break;
    case bf:
      h = ((rf - gf) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hf = h / 360;
  const sf = s / 100;
  const lf = l / 100;

  if (sf === 0) {
    const v = Math.round(lf * 255);
    return { r: v, g: v, b: v };
  }

  const q = lf < 0.5 ? lf * (1 + sf) : lf + sf - lf * sf;
  const p = 2 * lf - q;

  const rgb = [hf + 1 / 3, hf, hf - 1 / 3].map((t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return Math.round((p + (q - p) * 6 * t) * 255);
    if (t < 1 / 2) return Math.round(q * 255);
    if (t < 2 / 3) return Math.round((p + (q - p) * (2 / 3 - t) * 6) * 255);
    return Math.round(p * 255);
  });

  return { r: rgb[0]!, g: rgb[1]!, b: rgb[2]! };
}

function hslToString({ h, s, l }: HSL): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function isGrayscale({ r, g, b }: RGB): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 30;
}

function saturation(rgb: RGB): number {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  if (max === 0) return 0;
  return (max - min) / max;
}

// ============================================================
// 图像采样
// ============================================================

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function samplePixels(
  img: HTMLImageElement,
  sampleSize: number = 50,
): RGB[] {
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const pixels: RGB[] = [];

  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push({
      r: imageData.data[i]!,
      g: imageData.data[i + 1]!,
      b: imageData.data[i + 2]!,
    });
  }

  return pixels;
}

// ============================================================
// 主色提取 —— 色相分桶 + 饱和度加权
// ============================================================

interface ColorBucket {
  hue: number;
  pixels: RGB[];
  totalSat: number;
}

function extractDominantColor(pixels: RGB[]): RGB {
  // 去掉灰度和太暗/太亮的像素
  const colored = pixels.filter(
    (p) => !isGrayscale(p) && saturation(p) > 0.15,
  );
  if (colored.length === 0) {
    // 全灰壁纸，回退到蓝紫色
    return { r: 103, g: 80, b: 164 };
  }

  // 按色相分桶（12 桶，每桶 30°）
  const buckets: ColorBucket[] = Array.from({ length: 12 }, (_, i) => ({
    hue: i * 30,
    pixels: [] as RGB[],
    totalSat: 0,
  }));

  for (const p of colored) {
    const hsl = rgbToHsl(p);
    const bucketIdx = Math.floor(hsl.h / 30) % 12;
    buckets[bucketIdx]!.pixels.push(p);
    buckets[bucketIdx]!.totalSat += hsl.s;
  }

  // 找出像素最多的桶（色相 + 饱和度综合排序）
  buckets.sort(
    (a, b) =>
      b.pixels.length * b.totalSat - a.pixels.length * a.totalSat,
  );

  const topBucket = buckets[0]!;
  if (topBucket.pixels.length === 0) {
    return { r: 103, g: 80, b: 164 };
  }

  // 桶内平均色
  const avg = topBucket.pixels.reduce(
    (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
    { r: 0, g: 0, b: 0 },
  );
  const n = topBucket.pixels.length;
  return {
    r: Math.round(avg.r / n),
    g: Math.round(avg.g / n),
    b: Math.round(avg.b / n),
  };
}

// ============================================================
// M3 色板生成
// ============================================================

/**
 * 从源色生成一套 M3 风格色板
 *
 * 原理：保持色相不变，按 M3 tonal palette 的规律调整明度/饱和度。
 * 亮色主题用高 tone（浅色面），暗色主题用低 tone（深色面）。
 */
function generatePalette(sourceColor: RGB, isDark: boolean): M3Palette {
  const hsl = rgbToHsl(sourceColor);

  // 色相保持，饱和度和明度按 M3 tone 层次调整
  function tonal(h: number, s: number, l: number): HSL {
    return { h, s: Math.max(0, Math.min(100, s)), l: Math.max(0, Math.min(100, l)) };
  }

  if (isDark) {
    return {
      primary: hslToString(tonal(hsl.h, hsl.s + 10, 80)),
      onPrimary: hslToString(tonal(hsl.h, hsl.s - 20, 20)),
      primaryContainer: hslToString(tonal(hsl.h, hsl.s - 15, 30)),
      onPrimaryContainer: hslToString(tonal(hsl.h, hsl.s + 5, 90)),
      surface: hslToString(tonal(hsl.h, 4, 8)),
      onSurface: hslToString(tonal(hsl.h, 8, 90)),
      surfaceVariant: hslToString(tonal(hsl.h, 6, 22)),
      onSurfaceVariant: hslToString(tonal(hsl.h, 8, 76)),
      outline: hslToString(tonal(hsl.h, 6, 46)),
      outlineVariant: hslToString(tonal(hsl.h, 6, 30)),
      // 暗色毛玻璃：加色调 + 提不透明度，壁纸暗色时依然可见
      glassBg: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 0.65)}%, 6%, 0.48)`,
      glassBorder: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 0.4)}%, 55%, 0.16)`,
    };
  }

  return {
    primary: hslToString(tonal(hsl.h, hsl.s, 40)),
    onPrimary: hslToString(tonal(hsl.h, 0, 100)),
    primaryContainer: hslToString(tonal(hsl.h, hsl.s - 15, 90)),
    onPrimaryContainer: hslToString(tonal(hsl.h, hsl.s + 10, 10)),
    surface: hslToString(tonal(hsl.h, 6, 98)),
    onSurface: hslToString(tonal(hsl.h, 10, 10)),
    surfaceVariant: hslToString(tonal(hsl.h, 6, 90)),
    onSurfaceVariant: hslToString(tonal(hsl.h, 8, 30)),
    outline: hslToString(tonal(hsl.h, 6, 50)),
    outlineVariant: hslToString(tonal(hsl.h, 6, 80)),
    // 亮色毛玻璃：加色调 + 提不透明度，壁纸亮色时依然可见
    glassBg: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 0.65)}%, 88%, 0.38)`,
    glassBorder: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 0.4)}%, 35%, 0.18)`,
  };
}

// ============================================================
// CSS 变量注入
// ============================================================

function injectPalette(palette: M3Palette): void {
  const root = document.documentElement;
  root.style.setProperty("--md-sys-color-primary", palette.primary);
  root.style.setProperty("--md-sys-color-on-primary", palette.onPrimary);
  root.style.setProperty("--md-sys-color-primary-container", palette.primaryContainer);
  root.style.setProperty("--md-sys-color-on-primary-container", palette.onPrimaryContainer);
  root.style.setProperty("--md-sys-color-surface", palette.surface);
  root.style.setProperty("--md-sys-color-on-surface", palette.onSurface);
  root.style.setProperty("--md-sys-color-surface-variant", palette.surfaceVariant);
  root.style.setProperty("--md-sys-color-on-surface-variant", palette.onSurfaceVariant);
  root.style.setProperty("--md-sys-color-outline", palette.outline);
  root.style.setProperty("--md-sys-color-outline-variant", palette.outlineVariant);
  root.style.setProperty("--md-glass-bg", palette.glassBg);
  root.style.setProperty("--md-glass-border", palette.glassBorder);
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 从壁纸 URL 提取主色并生成 / 注入 M3 色板
 * @returns 提取到的源色 RGB，失败返回 undefined
 */
export async function extractAndApply(
  imageUrl: string,
  isDark: boolean,
): Promise<RGB | undefined> {
  try {
    const img = await loadImage(imageUrl);
    const pixels = samplePixels(img);
    const sourceColor = extractDominantColor(pixels);
    const palette = generatePalette(sourceColor, isDark);
    injectPalette(palette);
    return sourceColor;
  } catch (err) {
    console.warn("[山风] 壁纸取色失败，使用默认色板", err);
    return undefined;
  }
}

/**
 * 应用 M3 默认色板（蓝紫色，Google 默认风格）
 * 用于取色失败或首次加载时的降级方案
 */
export function applyDefaultPalette(isDark: boolean): void {
  const sourceColor: RGB = { r: 103, g: 80, b: 164 };
  const palette = generatePalette(sourceColor, isDark);
  injectPalette(palette);
}
