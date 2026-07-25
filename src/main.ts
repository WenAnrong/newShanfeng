import { createApp } from "vue";
import { createPinia } from "pinia";

import "@/assets/main.css";

import App from "./App.vue";

const app = createApp(App);

app.use(createPinia());

app.mount("#app");

// 启动屏淡出
const splash = document.getElementById("splash-screen");
if (splash) {
  // 停顿 100ms 后淡出
  setTimeout(() => {
    splash.classList.add("hidden");
  }, 100);

  // 淡出动画完成后移除
  setTimeout(() => {
    splash.remove();
  }, 800);
}
