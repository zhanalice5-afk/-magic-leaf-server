import { LLMClient, Config } from "coze-coding-dev-sdk";
import { getCozeConfig, canUseAIFeatures } from "../config/cozeConfig.js";

export interface ExtractedBookContent {
  title: string;
  pages: Array<{
    pageNum: number;
    textEn: string;
    textZh: string;
    imageUrl?: string;
  }>;
}

/**
 * 使用 LLM 从文本内容中提取绘本故事
 * 将上传的电子绘本内容转换为适合儿童阅读的双语格式
 */
export async function extractBookContent(
  text: string,
  headers?: Record<string, string>
): Promise<ExtractedBookContent> {
  // 检查是否可以使用 AI 功能
  if (!canUseAIFeatures()) {
    throw new Error('内容提取功能暂不可用。请配置 COZE_API_KEY 环境变量。');
  }
  
  const config = getCozeConfig();
  const client = new LLMClient(config, headers);

  const prompt = `你是一位儿童绘本编辑专家。请将以下文本内容转换为适合4-6岁儿童阅读的双语绘本格式。

原始文本：
${text}

请按照以下JSON格式输出（不要添加任何markdown格式，直接输出JSON）：
{
  "title": "绘本标题",
  "pages": [
    {
      "pageNum": 1,
      "textEn": "English sentence for this page",
      "textZh": "中文句子"
    }
  ]
}

要求：
1. 将内容分成5-8页，每页一个简单的中英文句子
2. 英文句子要简单、地道，适合儿童学习
3. 中文翻译要自然、亲切
4. 如果原文内容较多，请提取关键情节，简化为适合儿童的语言`;

  try {
    const messages = [{ role: "user" as const, content: prompt }];
    const response = await client.invoke(messages, { temperature: 0.7 });

    const content = response.content || "";
    
    // 尝试解析JSON
    try {
      // 移除可能的markdown代码块标记
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch {
      // 如果解析失败，返回基本结构
      return {
        title: "上传的绘本",
        pages: [
          {
            pageNum: 1,
            textEn: "This is a story from your uploaded book.",
            textZh: "这是你上传的绘本故事。",
          },
        ],
      };
    }
  } catch (error) {
    console.error("Error extracting book content:", error);
    throw error;
  }
}

/**
 * 从文本内容生成绘本描述（用于图片生成）
 */
export async function generateIllustrationPrompt(
  pageText: string,
  headers?: Record<string, string>
): Promise<string> {
  // 检查是否可以使用 AI 功能
  if (!canUseAIFeatures()) {
    throw new Error('插画生成功能暂不可用。请配置 COZE_API_KEY 环境变量。');
  }
  
  const config = getCozeConfig();
  const client = new LLMClient(config, headers);

  const prompt = `请为以下儿童绘本内容生成一个适合AI生成插画的英文描述。

绘本内容：${pageText}

要求：
1. 使用简洁的英文描述
2. 风格：温暖治愈的儿童水彩绘本风格，莫兰迪低饱和色彩，圆润可爱的造型
3. 突出主要角色和场景
4. 不要包含文字

直接输出英文描述，不要其他内容。`;

  try {
    const messages = [{ role: "user" as const, content: prompt }];
    const response = await client.invoke(messages, { temperature: 0.7 });

    return response.content || "";
  } catch (error) {
    console.error("Error generating illustration prompt:", error);
    return "";
  }
}
