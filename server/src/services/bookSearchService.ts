import { SearchClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export interface OnlineBook {
  title: string;
  author?: string;
  description: string;
  coverUrl?: string;
  sourceUrl?: string;
  sourceSite?: string;
  ageRange?: string;
  language?: string;
}

export interface SearchOnlineBooksParams {
  query: string; // 搜索关键词
  language?: "zh" | "en" | "all"; // 语言偏好
  ageRange?: string; // 年龄范围，如 "3-5岁"
  count?: number;
  headers?: Record<string, string>;
}

/**
 * 在线绘本搜索服务
 * 支持搜索儿童绘本资源
 */
export async function searchOnlineBooks(
  params: SearchOnlineBooksParams
): Promise<{ books: OnlineBook[]; summary?: string }> {
  const { query, language = "all", ageRange, count = 10, headers } = params;

  const config = new Config();
  const client = new SearchClient(config, headers);

  // 构建搜索查询
  let searchQuery = query;
  if (ageRange) {
    searchQuery += ` ${ageRange}`;
  }
  // 添加绘本相关关键词
  searchQuery += " 儿童绘本 picture book children";

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
        return (
          title.includes("绘本") ||
          title.includes("book") ||
          snippet.includes("绘本") ||
          snippet.includes("picture book") ||
          snippet.includes("children")
        );
      })
      .map((item) => ({
        title: item.title || "未知标题",
        description: item.snippet || "",
        sourceUrl: item.url,
        sourceSite: item.site_name,
      }));

    return {
      books,
      summary: response.summary,
    };
  } catch (error) {
    console.error("Error searching online books:", error);
    throw error;
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
  const config = new Config();
  const client = new SearchClient(config, headers);

  const searchQuery = `${query} children book illustration`;

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
