<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
// @ts-ignore
import { Lunar } from "lunar-javascript";

const time = ref<string>("");
const date = ref<string>("");
const week = ref<string>("");
const lunarDate = ref<string>("");

const updateClock = () => {
  const now = new Date();
  time.value = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  date.value = now.toLocaleDateString();
  week.value = now.toLocaleDateString("zh-CN", {
    weekday: "long",
  });
  const lunar = Lunar.fromDate(now);
  lunarDate.value =
    "农历 " +
    lunar.getYearInGanZhi() +
    lunar.getYearShengXiao() +
    "年 " +
    lunar.getMonthInChinese() +
    "月 " +
    lunar.getDayInChinese() +
    "日 ";
};

// 挂载时更新时钟
onMounted(() => {
  updateClock();
});

const intervalId = setInterval(updateClock, 1000);

// 卸载时清除定时器
onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <div class="clock-panel">
    <div class="clock-time">{{ time }}</div>
    <div class="date">
      <div class="clock-date">{{ date }}</div>
      |
      <div class="clock-week">{{ week }}</div>
    </div>
    <div class="lunar-date">{{ lunarDate }}</div>
  </div>
</template>

<style scoped lang="scss">
.clock-panel {
  text-align: center;

  .clock-time {
    font-size: 96px;
    font-weight: 500;
    letter-spacing: -2px;
    background-clip: text;
    line-height: 1;
  }

  .date {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    font-size: 18px;
    opacity: 0.8;
  }

  .lunar-date {
    font-weight: 500;
  }
}
</style>
