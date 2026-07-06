<script setup lang="ts"></script>

<template>
  <div class="search-box">
    <div class="search-wrapper">
      <button class="btn">
        <svg
          t="1783328811071"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="5227"
          width="1em"
          height="1em"
        >
          <path
            d="M474.453333 884.053333c-225.28 0-409.6-184.32-409.6-409.6s184.32-409.6 409.6-409.6 409.6 184.32 409.6 409.6-184.32 409.6-409.6 409.6z m0-68.266666c187.733333 0 341.333333-153.6 341.333334-341.333334s-153.6-341.333333-341.333334-341.333333-341.333333 153.6-341.333333 341.333333 153.6 341.333333 341.333333 341.333334z m252.586667 54.613333c-13.653333-13.653333-10.24-37.546667 3.413333-47.786667s37.546667-10.24 47.786667 3.413334l64.853333 78.506666c13.653333 13.653333 10.24 37.546667-3.413333 47.786667s-37.546667 10.24-47.786667-3.413333l-64.853333-78.506667z"
            fill="#787878"
            p-id="5228"
          ></path>
        </svg>
      </button>
      <input type="text" placeholder="搜索..." />
      <button class="btn">搜索</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;

.search-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}
.search-wrapper {
  height: clamp(40px, 3.5vh, 56px);
  width: var(--search-width);
  max-width: var(--search-max-width);
  @include compact {
    --search-width: 80%;
    --search-max-width: 700px;
  }
  @include wide {
    --search-width: 50%;
    --search-max-width: 900px;
  }
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0 20px;
  border-radius: clamp(40px, 3.5vh, 56px);

  input {
    flex: 1;
    padding: 8px;
    border: none;
    background-color: rgba(0, 0, 0, 0);
    outline: none;
    text-align: left;
  }

  .btn {
    height: 100%;
    border: none;
    background-color: rgba(0, 0, 0, 0);
    cursor: pointer;
    overflow: hidden;
    font-size: 16px;
  }
}
</style>
