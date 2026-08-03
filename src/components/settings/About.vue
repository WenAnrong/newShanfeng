<script setup lang="ts"></script>

<template>
  <div class="about-info">
    <h3>山风新页</h3>
    <p class="about-desc">一个精美好用的浏览器起始页扩展</p>
    <div class="about-meta">
      <span>版本 v1.0.1</span>
    </div>
    <div class="about-links">
      <a
        href="https://shanfeng.space/"
        target="_blank"
        rel="noopener noreferrer"
        >官网</a
      >
      <span class="about-divider">|</span>
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        >黔ICP备2026000324号-2</a
      >
      <span class="about-divider">|</span>
      <a
        href="https://beian.mps.gov.cn/#/query/webSearch?code=62012302000654"
        target="_blank"
        rel="noopener noreferrer"
        >甘公网安备62012302000654号</a
      >
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
