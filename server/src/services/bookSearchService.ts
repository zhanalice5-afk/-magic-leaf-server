import { SearchClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { getCozeConfig, canUseAIFeatures } from "../config/cozeConfig.js";

export interface OnlineBook {
  title: string;
  author?: string;
  description: string;
  coverUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
  ageRange?: string;
  language?: string;
  isFree?: boolean;
}

export interface SearchOnlineBooksParams {
  query: string; // 搜索关键词
  language?: "zh" | "en" | "all"; // 语言偏好
  ageRange?: string; // 年龄范围，如 "3-5岁"
  count?: number;
  headers?: Record<string, string>;
}

// 知名免费儿童图书资源站点
const FREE_BOOK_SOURCES = [
  {
    name: "Oxford Owl",
    site: "oxfordowl.co.uk",
    description: "牛津阅读树官方免费电子书",
    url: "https://www.oxfordowl.co.uk/for-home/find-a-book/library-page/",
    isFree: true,
  },
  {
    name: "Project Gutenberg",
    site: "gutenberg.org",
    description: "免费经典儿童文学",
    url: "https://www.gutenberg.org/browse/categories/schildren",
    isFree: true,
  },
  {
    name: "International Children's Digital Library",
    site: "childrenslibrary.org",
    description: "国际儿童数字图书馆",
    url: "https://www.childrenslibrary.org/",
    isFree: true,
  },
  {
    name: "Storyline Online",
    site: "storylineonline.net",
    description: "明星朗读绘本视频",
    url: "https://www.storylineonline.net/",
    isFree: true,
  },
  {
    name: "Open Library",
    site: "openlibrary.org",
    description: "开放图书馆儿童书",
    url: "https://openlibrary.org/subjects/children",
    isFree: true,
  },
  {
    name: "Reading Rockets",
    site: "readingrockets.org",
    description: "儿童阅读资源",
    url: "https://www.readingrockets.org/",
    isFree: true,
  },
];

/**
 * 在线绘本搜索服务
 * 支持搜索儿童绘本资源，优先返回免费资源
 */
export async function searchOnlineBooks(
  params: SearchOnlineBooksParams
): Promise<{ books: OnlineBook[]; summary?: string; sources?: typeof FREE_BOOK_SOURCES }> {
  const { query, language = "all", ageRange, count = 10, headers } = params;

  const config = getCozeConfig();
  const client = new SearchClient(config, headers);

  // 构建搜索查询 - 添加免费和儿童相关关键词
  let searchQuery = query;
  if (language === "en") {
    searchQuery += " free children picture book";
  } else if (language === "zh") {
    searchQuery += " 免费 儿童绘本 电子书";
  } else {
    searchQuery += " free children picture book 儿童绘本";
  }

  if (ageRange) {
    searchQuery += ` ${ageRange}`;
  }

  try {
    const response = await client.advancedSearch(searchQuery, {
      searchType: "web",
      count,
      needSummary: true,
      needContent: false,
    });

    // 过滤和转换搜索结果为绘本格式
    const books: OnlineBook[] = (response.web_items || [])
      .filter((item) => {
        // 过滤掉明显不相关的结果
        const title = item.title?.toLowerCase() || "";
        const snippet = item.snippet?.toLowerCase() || "";
        const url = item.url?.toLowerCase() || "";
        
        // 检查是否来自知名免费资源站点
        const isFromFreeSource = FREE_BOOK_SOURCES.some(
          (source) => url.includes(source.site)
        );
        
        // 检查是否包含相关关键词
        const hasRelevantKeywords =
          title.includes("绘本") ||
          title.includes("book") ||
          title.includes("story") ||
          snippet.includes("绘本") ||
          snippet.includes("picture book") ||
          snippet.includes("children") ||
          snippet.includes("reader");

        return isFromFreeSource || hasRelevantKeywords;
      })
      .map((item) => {
        const url = item.url?.toLowerCase() || "";
        const isFree = FREE_BOOK_SOURCES.some((source) =>
          url.includes(source.site)
        );
        
        return {
          title: item.title || "未知标题",
          description: item.snippet || "",
          sourceUrl: item.url,
          sourceSite: item.site_name,
          isFree,
        };
      });

    // 添加推荐资源站点
    const recommendedSources = FREE_BOOK_SOURCES.filter((source) => {
      if (language === "en") {
        return source.site !== "childrenslibrary.org" || true; // 保留所有英文资源
      } else if (language === "zh") {
        return true; // 保留所有可能含中文的资源
      }
      return true;
    });

    return {
      books,
      summary: response.summary,
      sources: recommendedSources,
    };
  } catch (error) {
    console.error("Error searching online books:", error);
    // 即使搜索失败，也返回推荐资源
    return {
      books: [],
      sources: FREE_BOOK_SOURCES,
    };
  }
}

/**
 * 搜索特定资源站点的图书
 */
export async function searchSpecificSource(
  source: string,
  query: string,
  headers?: Record<string, string>
): Promise<{ books: OnlineBook[] }> {
  const config = getCozeConfig();
  const client = new SearchClient(config, headers);

  const searchQuery = `site:${source} ${query} children book`;

  try {
    const response = await client.advancedSearch(searchQuery, {
      searchType: "web",
      count: 10,
      needSummary: false,
      needContent: false,
    });

    const books: OnlineBook[] = (response.web_items || []).map((item) => ({
      title: item.title || "未知标题",
      description: item.snippet || "",
      sourceUrl: item.url,
      sourceSite: item.site_name,
      isFree: true,
    }));

    return { books };
  } catch (error) {
    console.error("Error searching specific source:", error);
    return { books: [] };
  }
}

/**
 * 搜索绘本图片资源
 */
export async function searchBookImages(
  query: string,
  count: number = 10,
  headers?: Record<string, string>
): Promise<{ images: Array<{ url: string; title?: string; sourceUrl?: string }> }> {
  const config = getCozeConfig();
  const client = new SearchClient(config, headers);

  const searchQuery = `${query} children book illustration watercolor`;

  try {
    const response = await client.imageSearch(searchQuery, count);

    const images = (response.image_items || []).map((item) => ({
      url: item.image.url,
      title: item.title,
      sourceUrl: item.url,
    }));

    return { images };
  } catch (error) {
    console.error("Error searching book images:", error);
    throw error;
  }
}

/**
 * 获取推荐的免费资源站点
 */
export function getFreeBookSources() {
  return FREE_BOOK_SOURCES;
}
