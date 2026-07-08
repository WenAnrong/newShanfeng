import { ref } from "vue";

interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "success" | "error";
}

// 记录所有通知
const toasts = ref<ToastMessage[]>([]);
let nextId = 0;

// text: 通知文本
// type: 类型，默认为 info
// duration: 通知时长，默认2.5s
export function show(
  text: string,
  type: ToastMessage["type"] = "info",
  duration: number = 2500,
) {
  const id = nextId++;
  // 一条消息出现时：push 到 toasts 数组
  toasts.value.push({ id, text, type });
  // 2.5 秒后: 从 toasts 数组中把自己移除
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, duration);
}

export { toasts };
