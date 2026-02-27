import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { z } from "zod";
import type { BookPage, BookInteraction } from "../storage/database/shared/schema.js";

// Spotlight object definition
const spotlightSchema = z.object({
  object: z.string(),
  phonics: z.string(),
  animation_effect: z.string().optional(),
});

// Branching option definition
const branchingOptionSchema = z.object({
  label: z.string(),
  leads_to: z.string(),
});

// Book page content definition
const bookPageSchema = z.object({
  page_num: z.number(),
  text_en: z.string(),
  text_zh: z.string(),
  audio_hint: z.string(),
  image_prompt: z.string().optional(),
  spotlight: z.array(spotlightSchema),
  question: z.object({
    question_en: z.string(),
    question_zh: z.string(),
    hint: z.string().optional(),
  }).optional(), // 每页的互动问题
});

// Book interaction definition
const bookInteractionSchema = z.object({
  branching_options: z.array(branchingOptionSchema).optional(),
  character_dialogue: z.string(),
});

// Full book response schema
const bookResponseSchema = z.object({
  book_metadata: z.object({
    level: z.number(),
    theme: z.string(),
    interest_tag: z.string(),
    function_tag: z.string().optional(),
  }),
  content: z.array(bookPageSchema),
  interaction: bookInteractionSchema,
});

export interface GenerateBookParams {
  level: 1 | 2 | 3;
  theme: string;
  interestTag: string;
  functionTag?: string;
  headers?: Record<string, string>;
}

export interface GeneratedBook {
  title: string;
  level: number;
  theme: string;
  interestTag: string;
  functionTag?: string;
  content: BookPage[];
  interaction: BookInteraction;
}

// Level configurations
const levelConfigs = {
  1: {
    name: "L1 启蒙版（Enlightenment）",
    description: "侧重词汇。主题：动物、颜色、数字。输出内容：简单的名词或短语。",
    maxWords: 10,
    pageCount: 5,
  },
  2: {
    name: "L2 成长版（Growth）",
    description: "侧重重复性句式。主题：家庭、学校、情绪。输出内容：简单句（例如：'The cat is happy.'）。",
    maxWords: 20,
    pageCount: 6,
  },
  3: {
    name: "L3 飞跃版（Leap）",
    description: "侧重叙事与逻辑。主题：科学、民间传说、逻辑推理。输出内容：具有因果关系的短篇故事。",
    maxWords: 40,
    pageCount: 8,
  },
};

// Theme suggestions based on level
const themeSuggestions = {
  1: ["动物", "颜色", "数字", "水果", "交通工具"],
  2: ["家庭", "学校", "情绪", "日常活动", "季节"],
  3: ["科学探索", "民间传说", "逻辑推理", "冒险故事", "自然现象"],
};

// 水彩画风插画描述指南
const WATERCOLOR_ILLUSTRATION_GUIDE = `
插画描述词要求（image_prompt）：
- 用英文描述画面主体和场景
- 重点描述：可爱的圆润角色、温暖的动作表情、柔和的环境背景
- 避免描述技法词汇（如"水彩"、"手绘"），系统会自动添加
- 示例：
  * "A fluffy orange kitten sitting on soft green grass, looking curious with big round eyes, surrounded by tiny colorful flowers"
  * "A cute little rabbit holding a golden magic leaf, standing in a dreamy forest with soft sunlight filtering through trees"
  * "A happy child playing with a red ball in a cozy room, warm afternoon light, gentle smile"
`;

export async function generateBook(params: GenerateBookParams): Promise<GeneratedBook> {
  const { level, theme, interestTag, functionTag, headers } = params;
  const config = new Config();
  const client = new LLMClient(config, headers);

  const levelConfig = levelConfigs[level];

  const systemPrompt = `你是一位世界级的儿童双语教育专家和绘本创作家，擅长运用"Magic Leaf（魔法叶子）"教学框架，为 4-6 岁儿童创作充满想象力、双语对照且具有高度互动性的分级绘本。

你的核心规则：
1. 双语绘本创作：中英双语完全对照，英文地道简洁，中文亲切符合儿童语境
2. Magic Leaf分级体系：
   - Level 1 (启蒙): 重点在于名词和简单短语，句子极短（不超过${levelConfig.maxWords}词），重复率高
   - Level 2 (成长): 引入简单句和常用动词，增加描述性词汇（不超过${levelConfig.maxWords}词）
   - Level 3 (飞跃): 完整的故事情节，包含复合句和情感表达（不超过${levelConfig.maxWords}词）
3. 互动设计：每页识别3-5个关键视觉对象，提供名称、自然拼读(Phonics)和简单动画提示
4. 语气：极其温暖、充满鼓励且带有奇幻色彩

${WATERCOLOR_ILLUSTRATION_GUIDE}

${level === 3 ? "5. 分支叙事：在故事的关键节点提供两个简单的决策点，以增加可重复游玩性" : ""}`;

  const userPrompt = `请创作一本${levelConfig.name}的双语绘本。

主题：${theme}
兴趣标签：${interestTag}
${functionTag ? `功能标签：${functionTag}` : ""}

要求：
- 共${levelConfig.pageCount}页内容
- 每页英文不超过${levelConfig.maxWords}个单词
- 每页包含3-5个聚光灯词汇(spotlight)
- 为每页生成一个image_prompt描述词（描述画面主体和场景，用英文）
- **每页必须包含一个互动问题(question)**，引导孩子思考和表达：
  - question_en: 英文问题，简单有趣
  - question_zh: 中文翻译
  - hint: 给家长的互动提示
- 在interaction部分，Magic Buddy要以亲切的双语形式向孩子提问

请严格按照以下JSON格式输出，不要添加任何其他文字：
{
  "book_metadata": {
    "level": ${level},
    "theme": "${theme}",
    "interest_tag": "${interestTag}",
    "function_tag": "${functionTag || ""}"
  },
  "content": [
    {
      "page_num": 1,
      "text_en": "English text here.",
      "text_zh": "中文翻译在这里。",
      "audio_hint": "给家长的朗读建议（中文）",
      "image_prompt": "A cute fluffy orange kitten sitting on soft green grass, looking curious with big round eyes, tiny colorful flowers around",
      "spotlight": [
        { "object": "cat", "phonics": "c-a-t", "animation_effect": "bounce" }
      ],
      "question": {
        "question_en": "What color is the kitten?",
        "question_zh": "小猫是什么颜色的？",
        "hint": "引导孩子观察画面，用英文回答颜色"
      }
    }
  ],
  "interaction": {
    ${level === 3 ? `"branching_options": [
      { "label": "选项A", "leads_to": "结果A" },
      { "label": "选项B", "leads_to": "结果B" }
    ],` : ""}
    "character_dialogue": "Magic Buddy的温暖问候语，鼓励孩子开口表达"
  }
}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const response = await client.invoke(messages, {
    model: "doubao-seed-2-0-lite-260215",
    temperature: 0.8,
  });

  // Parse JSON response
  let jsonResponse;
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let content = response.content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    }
    if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    jsonResponse = JSON.parse(content.trim());
  } catch (error) {
    console.error("Failed to parse LLM response:", response.content);
    throw new Error("Failed to parse book generation response");
  }

  // Validate response
  const validated = bookResponseSchema.parse(jsonResponse);

  // Generate a title based on theme
  const title = `${theme} - Magic Leaf Level ${level}`;

  return {
    title,
    level: validated.book_metadata.level,
    theme: validated.book_metadata.theme,
    interestTag: validated.book_metadata.interest_tag,
    functionTag: validated.book_metadata.function_tag,
    content: validated.content,
    interaction: validated.interaction,
  };
}

export { levelConfigs, themeSuggestions };
