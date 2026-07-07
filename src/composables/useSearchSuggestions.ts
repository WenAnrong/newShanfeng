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

// 解析 Bing API 响应数据
function parseSuggestions(data: any): string[] {
  const suggests: string[] = [];
  if (data && data.AS && data.AS.Results) {
    data.AS.Results.forEach((result: any) => {
      if (result.Suggests) {
        result.Suggests.forEach((suggest: any) => {
          if (suggest.Txt) {
            suggests.push(suggest.Txt);
          }
        });
      }
    });
  }
  return suggests;
}

// 解析 Bing JSONP 响应文本
function parseBingResponse(text: string): any | null {
  const jsonStart = text.indexOf("({");
  if (jsonStart === -1) return null;

  const commentStart = text.indexOf("/*");
  if (commentStart === -1) return null;

  let jsonEnd = -1;
  for (let i = commentStart - 1; i >= 0; i--) {
    if (text[i] === "}") {
      jsonEnd = i + 1;
      break;
    }
  }

  if (jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  try {
    const jsonStr = text.substring(jsonStart + 1, jsonEnd);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
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

// 加载 Bing 搜索建议
async function loadBingSuggestions(
  query: string,
  onSuccess: (suggestions: string[]) => void,
  onError: () => void,
) {
  try {
    const response = await fetch(
      `https://sg1.api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const data = parseBingResponse(text);
    if (data) {
      onSuccess(parseSuggestions(data));
    } else {
      onError();
    }
  } catch (error) {
    console.error("Failed to load Bing suggestions:", error);
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

  const loadSuggestions = async (query: string, retryCount = 0) => {
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

    try {
      await loadBingSuggestions(query, onSuccess, async () => {
        if (query === currentQuery && retryCount < 2) {
          console.warn(`Bing API failed, retrying... (${retryCount + 1}/2)`);
          setTimeout(() => loadSuggestions(query, retryCount + 1), 200);
          return;
        }
        console.warn(
          "Bing API failed after retries, switching to Baidu suggestions",
        );
        await loadBaiduSuggestions(query, onSuccess, onError);
      });
    } catch {
      onError();
    }
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
