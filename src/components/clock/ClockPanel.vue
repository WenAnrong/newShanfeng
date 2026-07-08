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
@use "@/assets/variables" as *;
@use "@/assets/glass" as *;

.clock-panel {
  text-align: center;
  color: $text-primary;

  .clock-time {
    font-size: $clock-font-size;
    @include compact {
      font-size: clamp(48px, 7vw, 72px);
    }
    @include wide {
      font-size: clamp(120px, 5vw, 180px);
    }
    @include portrait {
      font-size: clamp(48px, 7vw, 72px);
    }
    font-weight: 500;
    letter-spacing: -2px;
    line-height: normal;
  }

  .date {
    display: flex;
    font-weight: 400;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    color: $text-primary;
    font-size: clamp(16px, 1.2vw, 20px);
    @include wide {
      font-size: clamp(18px, 1vw, 24px);
    }
  }

  .lunar-date {
    color: $text-primary;
    font-size: clamp(14px, 1.2vw, 18px);
    @include wide {
      font-size: clamp(18px, 1vw, 24px);
    }
  }
}
</style>
