<script setup lang="ts"></script>

<template>
  <div class="about-info">
    <h3>山风新页</h3>
    <p class="about-desc">浏览器新标签页扩展</p>
    <div class="about-meta">
      <span>版本 v0.1.0</span>
      <span>毛玻璃主题</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/glass" as *;

.about-info {
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }

  .about-desc {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }

  .about-meta {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
  }
}
</style>
