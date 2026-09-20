<script setup lang="ts"></script>

<template>
  <div class="about-info">
    <h3>山风新页</h3>
    <p class="about-desc">一个精美好用的浏览器起始页扩展</p>
    <div class="about-meta">
      <span>版本 v1.1.2</span>
    </div>
    <div class="about-links">
      <a href="https://github.com/WenAnrong/newShanfeng" target="_blank" rel="noopener noreferrer">开源地址（协议：MIT）</a>
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

  .about-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;

    a {
      color: $text-secondary;
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: $text-primary;
        text-decoration: underline;
      }
    }

    .about-divider {
      color: $text-secondary;
      opacity: 0.6;
    }
  }
}
</style>
