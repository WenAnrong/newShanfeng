<script setup lang="ts">
import { ref } from "vue";
import SearchEnginePicker from "./SearchEnginePicker.vue";
import { useEngineStore } from "@/stores/searchStore.ts";
import SearchSuggestion from "./SearchSuggestion.vue";

const engineStore = useEngineStore();

const isShowMenu = ref(false); // 是否显示
const triggerRef = ref<HTMLElement | null>(null); // 切换搜索引擎当前按钮元素信息

// 切换显示和不显示搜索引擎切换菜单
function toggleEng() {
  isShowMenu.value = !isShowMenu.value;
}

// 输入框信息
const input = ref("");

// 点击搜索逻辑
function clickSearch() {
  const keyword = input.value.trim();
  if (!keyword) return; // 空输入不搜索

  const engine = engineStore.current;
  if (!engine) return; // 没有选中引擎

  const url = engine.url.replace("{keyword}", encodeURIComponent(keyword));
  window.location.href = url;
  input.value = ""; // 搜索后清空
}

const isShowSuggestions = ref(false); // 是否显示搜索建议
const inputRef = ref<HTMLElement | null>(null); // 搜索框元素信息
</script>

<template>
  <div class="search-box">
    <div class="search-wrapper">
      <button ref="triggerRef" class="btn engine-btn" @click="toggleEng">
        <img :src="engineStore.current?.icon" class="eng-img" />
      </button>
      <input
        ref="inputRef"
        v-model="input"
        type="text"
        @keyup.enter="clickSearch"
        placeholder="搜索..."
      />
      <button class="btn" @click="clickSearch">搜索</button>
    </div>

    <!-- 选择搜索引擎菜单 -->
    <SearchEnginePicker
      :visible="isShowMenu"
      :triggerEl="triggerRef"
      @close="isShowMenu = false"
    />

    <!-- 搜索建议 -->
    <SearchSuggestion
      :visible="isShowSuggestions"
      :triggerEl="inputRef"
      :query="input"
      @close="isShowSuggestions = false"
    />
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/variables" as *;
@use "@/assets/animations" as *;
@use "@/assets/glass" as *;

.search-box {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.search-wrapper {
  height: $search-height;
  width: $search-width;
  max-width: $search-max-width;
  @include glass-panel-1;
  @include compact {
    width: 80%;
    max-width: 700px;
  }
  @include wide {
    width: 50%;
    max-width: 900px;
  }
  @include portrait {
    width: 80%;
    max-width: 700px;
  }

  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  border-radius: clamp(40px, 3.5vh, 56px);

  // 获得焦点放大
  @include scale-up(1.09);

  @include compact() {
    @include scale-up(1.06);
  }

  @include wide() {
    @include scale-up(1.13);
  }

  @include portrait() {
    @include scale-up(1.06);
  }

  input {
    flex: 1;
    padding: 8px;
    border: none;
    background-color: rgba(0, 0, 0, 0);
    outline: none;
    text-align: left;
    color: $text-primary;

    &::placeholder {
      color: $text-secondary;
    }
  }

  .btn {
    height: 100%;
    border: none;
    background-color: rgba(0, 0, 0, 0);
    cursor: pointer;
    overflow: hidden;
    font-size: 16px;
    color: $text-primary;
  }

  .engine-btn {
    .eng-img {
      height: 70%;
    }
  }
}
</style>
