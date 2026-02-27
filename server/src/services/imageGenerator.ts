import { ImageGenerationClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import axios from "axios";

export interface GenerateImageParams {
  prompt: string;
  headers?: Record<string, string>;
}

export interface GeneratedImage {
  url: string;
}

/**
 * 儿童绘本水彩画风格提示词前缀
 * 基于用户提供的参考图片：治愈系儿童水彩绘本风格
 * 特点：莫兰迪低饱和色彩、水彩晕染质感、圆润可爱造型、温暖梦幻氛围
 */
const WATERCOLOR_STYLE_PREFIX = `Children's picture book illustration, soft watercolor painting style, healing and warm atmosphere, Morandi muted pastel colors, gentle rounded cute characters, dreamy whimsical forest background, soft blurry edges with watercolor bleed effect, delicate fine brown outlines, fluffy and cozy textures, low saturation soft greens blues pinks yellows, magical fairy tale feeling, hand-painted organic look. `;

/**
 * 根据绘本页面的内容描述生成高质量水彩风格插画
 */
export async function generateBookIllustration(
  params: GenerateImageParams
): Promise<GeneratedImage> {
  const { prompt, headers } = params;
  
  const config = new Config();
  const client = new ImageGenerationClient(config, headers);

  // 组合水彩风格前缀和具体描述
  const fullPrompt = WATERCOLOR_STYLE_PREFIX + prompt;

  try {
    const response = await client.generate({
      prompt: fullPrompt,
      size: "2K", // 高清画质
      watermark: false, // 不添加水印
    });

    const helper = client.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      return {
        url: helper.imageUrls[0],
      };
    } else {
      console.error("Image generation failed:", helper.errorMessages);
      throw new Error(helper.errorMessages.join(", ") || "Image generation failed");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

/**
 * 批量生成绘本插画
 */
export async function generateBookIllustrations(
  prompts: string[],
  headers?: Record<string, string>
): Promise<string[]> {
  const config = new Config();
  const client = new ImageGenerationClient(config, headers);

  const requests = prompts.map((prompt) => ({
    prompt: WATERCOLOR_STYLE_PREFIX + prompt,
    size: "2K" as const,
    watermark: false,
  }));

  try {
    const responses = await client.batchGenerate(requests);
    const urls: string[] = [];

    responses.forEach((response, i) => {
      const helper = client.getResponseHelper(response);
      if (helper.success && helper.imageUrls.length > 0) {
        urls.push(helper.imageUrls[0]);
      } else {
        console.error(`Image ${i + 1} generation failed:`, helper.errorMessages);
        // 使用占位图 URL 作为后备
        urls.push(`https://picsum.photos/800/600?random=${Date.now()}-${i}`);
      }
    });

    return urls;
  } catch (error) {
    console.error("Error in batch image generation:", error);
    throw error;
  }
}
