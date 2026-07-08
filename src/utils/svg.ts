// 编译时自动扫描 @/assets/svgs/ 下所有 .svg 文件
const modules = import.meta.glob<string>("@/assets/svgs/*.svg", {
  eager: true,
  import: "default",
});

// 转成 { 文件名: URL } 的映射
// 例如 { light: "/assets/light-xxxxx.svg", ... }
export const svgs: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const name = path.split("/").pop()!.replace(".svg", "");
    return [name, url];
  }),
);
