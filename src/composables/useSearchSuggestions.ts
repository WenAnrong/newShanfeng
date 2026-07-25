import { ref, type Ref } from "vue";

export interface UseSearchSuggestionsReturn {
  suggestions: Ref<string[]>;
  isLoading: Ref<boolean>;
  fetchSuggestions: (query: string) => void;
  clearSuggestions: () => void;
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 解析百度 JSONP 响应文本
function parseBaiduResponse(text: string): any | null {
  const prefix = "window.baidu.sug(";
  const prefixIndex = text.indexOf(prefix);
  if (prefixIndex === -1) return null;

  const jsonStart = text.indexOf("{", prefixIndex + prefix.length);
  const endMarker = ");";
  const endIndex = text.lastIndexOf(endMarker);
  if (jsonStart === -1 || endIndex === -1 || endIndex <= jsonStart) return null;

  let jsonEnd = -1;
  for (let i = endIndex - 1; i >= jsonStart; i--) {
    if (text[i] === "}") {
      jsonEnd = i + 1;
      break;
    }
  }

  if (jsonEnd === -1) return null;

  try {
    const jsObjectStr = text.substring(jsonStart, jsonEnd);
    const jsonStr = jsObjectStr.replace(
      /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g,
      '$1"$2"$3',
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// 加载百度搜索建议
async function loadBaiduSuggestions(
  query: string,
  onSuccess: (suggestions: string[]) => void,
  onError: () => void,
) {
  try {
    const response = await fetch(
      `https://suggestion.baidu.com/su?wd=${encodeURIComponent(query)}&cb=window.baidu.sug`,
      {
        method: "GET",
        headers: {
          Accept: "application/javascript",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("gbk");
    const text = decoder.decode(buffer);

    const data = parseBaiduResponse(text);
    if (data && data.s && Array.isArray(data.s)) {
      onSuccess(data.s);
    } else {
      onError();
    }
  } catch (error) {
    console.error("Failed to load Baidu suggestions:", error);
    onError();
  }
}

export function useSearchSuggestions(): UseSearchSuggestionsReturn {
  const suggestions = ref<string[]>([]);
  const isLoading = ref(false);
  let currentQuery = "";

  const clearSuggestions = () => {
    suggestions.value = [];
    isLoading.value = false;
  };

  const loadSuggestions = async (query: string) => {
    isLoading.value = true;
    suggestions.value = [];

    const onSuccess = (sugs: string[]) => {
      suggestions.value = sugs;
      isLoading.value = false;
    };

    const onError = () => {
      suggestions.value = [];
      isLoading.value = false;
    };

    await loadBaiduSuggestions(query, onSuccess, onError);
  };

  const fetchSuggestions = debounce((query: string) => {
    if (query.length < 2) {
      clearSuggestions();
      return;
    }

    currentQuery = query;
    loadSuggestions(query);
  }, 100);

  return {
    suggestions, // string[] - 联想词列表，如 ['Vue教程', 'Vue.js官网']
    isLoading, // boolean  - 是否正在请求联想词
    fetchSuggestions, // (query: string) => void - 输入时调用，自动防抖
    clearSuggestions, // () => void - 清空联想词（比如输入框失焦时）
  };
}
