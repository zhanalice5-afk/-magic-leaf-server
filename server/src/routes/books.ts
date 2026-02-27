import express from "express";
import multer from "multer";
import { getSupabaseClient } from "../storage/database/supabase-client.js";
import { generateBook, levelConfigs, themeSuggestions } from "../services/bookGenerator.js";
import { generateBookIllustration } from "../services/imageGenerator.js";
import { synthesizeSpeech } from "../services/ttsService.js";
import { recognizeSpeech } from "../services/asrService.js";
import { searchOnlineBooks } from "../services/bookSearchService.js";
import { extractBookContent, generateIllustrationPrompt } from "../services/ebookProcessor.js";
import { HeaderUtils } from "coze-coding-dev-sdk";
import { uploadToStorage } from "../storage/object-storage/index.js";

const router = express.Router();

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 限制
});

/**
 * GET /api/v1/books/themes
 * 获取所有可选主题和等级配置
 */
router.get("/themes", (req, res) => {
  res.json({
    levels: Object.entries(levelConfigs).map(([level, config]) => ({
      level: parseInt(level),
      name: config.name,
      description: config.description,
      maxWords: config.maxWords,
      pageCount: config.pageCount,
    })),
    themes: themeSuggestions,
  });
});

/**
 * GET /api/v1/books
 * 获取绘本列表
 * Query参数：level?: number, theme?: string, limit?: number
 */
router.get("/", async (req, res) => {
  try {
    const { level, theme, limit = 20 } = req.query;
    const client = getSupabaseClient();

    let query = client
      .from("books")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit as string) || 20);

    if (level) {
      query = query.eq("level", parseInt(level as string));
    }
    if (theme) {
      query = query.eq("theme", theme);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching books:", error);
      return res.status(500).json({ error: "Failed to fetch books" });
    }

    res.json({ books: data });
  } catch (error) {
    console.error("Error in GET /books:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/books/:id
 * 获取单个绘本详情
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching book:", error);
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ book: data });
  } catch (error) {
    console.error("Error in GET /books/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/books/generate
 * 生成新的绘本（包含AI生成插画）
 * Body: { level: 1|2|3, theme: string, interestTag: string, functionTag?: string }
 */
router.post("/generate", async (req, res) => {
  try {
    const { level, theme, interestTag, functionTag } = req.body;

    // Validate input
    if (!level || ![1, 2, 3].includes(level)) {
      return res.status(400).json({ error: "Invalid level. Must be 1, 2, or 3." });
    }
    if (!theme || typeof theme !== "string") {
      return res.status(400).json({ error: "Theme is required." });
    }
    if (!interestTag || typeof interestTag !== "string") {
      return res.status(400).json({ error: "Interest tag is required." });
    }

    // Extract headers for LLM client
    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    // Generate book content using LLM
    const generatedBook = await generateBook({
      level: level as 1 | 2 | 3,
      theme,
      interestTag,
      functionTag,
      headers,
    });

    // 为每一页生成插画
    const contentWithImages = await Promise.all(
      generatedBook.content.map(async (page, index) => {
        try {
          // 如果有 image_prompt，则生成真实插画
          if (page.image_prompt) {
            const image = await generateBookIllustration({
              prompt: page.image_prompt,
              headers,
            });
            return {
              ...page,
              image_url: image.url,
            };
          }
          return page;
        } catch (error) {
          console.error(`Failed to generate image for page ${index + 1}:`, error);
          // 生成失败时使用备用图片
          return {
            ...page,
            image_url: `https://picsum.photos/800/600?random=${Date.now()}-${index}`,
          };
        }
      })
    );

    // Save to database
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("books")
      .insert({
        title: generatedBook.title,
        level: generatedBook.level,
        theme: generatedBook.theme,
        interest_tag: generatedBook.interestTag,
        function_tag: generatedBook.functionTag,
        content: contentWithImages,
        interaction: generatedBook.interaction,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving book:", error);
      return res.status(500).json({ error: "Failed to save generated book" });
    }

    res.status(201).json({
      message: "Book generated successfully!",
      book: data,
    });
  } catch (error) {
    console.error("Error in POST /books/generate:", error);
    res.status(500).json({ error: "Failed to generate book" });
  }
});

/**
 * POST /api/v1/books/tts
 * 文字转语音接口
 * Body: { text: string, language: "en" | "zh" }
 */
router.post("/tts", async (req, res) => {
  try {
    const { text, language = "en" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required." });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const audio = await synthesizeSpeech({
      text,
      language: language as "en" | "zh",
      headers,
    });

    res.json({
      audioUri: audio.audioUri,
      audioSize: audio.audioSize,
    });
  } catch (error) {
    console.error("Error in POST /books/tts:", error);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
});

/**
 * POST /api/v1/books/:id/images
 * 为绘本的所有页面生成插画
 */
router.post("/:id/images", async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    // 获取绘本
    const { data: book, error: fetchError } = await client
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    // 为每一页生成插画
    const content = book.content as any[];
    const updatedContent = await Promise.all(
      content.map(async (page, index) => {
        if (page.image_prompt && !page.image_url) {
          try {
            const image = await generateBookIllustration({
              prompt: page.image_prompt,
              headers,
            });
            return { ...page, image_url: image.url };
          } catch (error) {
            console.error(`Failed to generate image for page ${index + 1}:`, error);
            return page;
          }
        }
        return page;
      })
    );

    // 更新绘本
    const { error: updateError } = await client
      .from("books")
      .update({ content: updatedContent })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ error: "Failed to update book images" });
    }

    res.json({ message: "Images generated successfully", content: updatedContent });
  } catch (error) {
    console.error("Error in POST /books/:id/images:", error);
    res.status(500).json({ error: "Failed to generate images" });
  }
});

/**
 * DELETE /api/v1/books/:id
 * 删除绘本
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    const { error } = await client.from("books").delete().eq("id", id);

    if (error) {
      console.error("Error deleting book:", error);
      return res.status(500).json({ error: "Failed to delete book" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /books/:id:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/books/asr
 * 语音识别接口 - 用于语音输入兴趣标签
 * Body: { audioUrl?: string, audioBase64?: string }
 */
router.post("/asr", async (req, res) => {
  try {
    const { audioUrl, audioBase64 } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: "Either audioUrl or audioBase64 is required" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const result = await recognizeSpeech({
      audioUrl,
      audioBase64,
      headers,
    });

    res.json({
      text: result.text,
      duration: result.duration,
    });
  } catch (error) {
    console.error("Error in POST /books/asr:", error);
    res.status(500).json({ error: "Failed to recognize speech" });
  }
});

/**
 * POST /api/v1/books/search
 * 在线绘本搜索接口
 * Body: { query: string, language?: "zh"|"en"|"all", ageRange?: string, count?: number }
 */
router.post("/search", async (req, res) => {
  try {
    const { query, language, ageRange, count } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const result = await searchOnlineBooks({
      query,
      language,
      ageRange,
      count,
      headers,
    });

    res.json({
      books: result.books,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Error in POST /books/search:", error);
    res.status(500).json({ error: "Failed to search books" });
  }
});

/**
 * POST /api/v1/books/upload
 * 上传电子绘本接口（支持 PDF 或图片）
 * FormData: file (PDF或图片文件)
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const { buffer, originalname, mimetype } = req.file;

    // 上传文件到对象存储
    const uploadedFile = await uploadToStorage(buffer, originalname, mimetype);

    // 如果是图片，直接返回URL
    if (mimetype.startsWith("image/")) {
      return res.json({
        type: "image",
        url: uploadedFile.url,
        message: "Image uploaded successfully",
      });
    }

    // 如果是 PDF，需要提取文本（这里简化处理，实际需要 PDF 解析库）
    if (mimetype === "application/pdf") {
      // TODO: 实际实现需要使用 PDF 解析库提取文本
      // 这里返回上传成功信息，前端可以调用 extract 接口处理
      return res.json({
        type: "pdf",
        url: uploadedFile.url,
        key: uploadedFile.key,
        message: "PDF uploaded successfully. Use /extract endpoint to process.",
      });
    }

    res.json({
      type: "other",
      url: uploadedFile.url,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error in POST /books/upload:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

/**
 * POST /api/v1/books/extract
 * 从上传的文本内容中提取绘本内容
 * Body: { text: string }
 */
router.post("/extract", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text content is required" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const result = await extractBookContent(text, headers);

    res.json(result);
  } catch (error) {
    console.error("Error in POST /books/extract:", error);
    res.status(500).json({ error: "Failed to extract book content" });
  }
});

/**
 * POST /api/v1/books/upload-to-book
 * 上传电子绘本并直接转换为可阅读的绘本
 * FormData: file (PDF或图片文件), title?: string
 */
router.post("/upload-to-book", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const headers = HeaderUtils.extractForwardHeaders(
      req.headers as Record<string, string>
    );

    const { buffer, originalname, mimetype } = req.file;
    const title = req.body.title || originalname.replace(/\.[^/.]+$/, "");

    // 上传文件到对象存储
    const uploadedFile = await uploadToStorage(buffer, originalname, mimetype);

    let bookContent;

    if (mimetype.startsWith("image/")) {
      // 单张图片创建简单绘本
      bookContent = {
        title,
        pages: [{
          pageNum: 1,
          textEn: "Look at this picture!",
          textZh: "看这张图片！",
          imageUrl: uploadedFile.url,
        }],
      };
    } else {
      // 其他文件类型，需要用户后续提供文本内容
      return res.json({
        type: "file",
        url: uploadedFile.url,
        message: "File uploaded. Please provide text content to create book.",
      });
    }

    // 保存到数据库
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("books")
      .insert({
        title: bookContent.title,
        level: 1,
        theme: "上传绘本",
        interest_tag: "自定义",
        function_tag: "",
        content: bookContent.pages.map((page, index) => ({
          ...page,
          page_num: index + 1,
          spotlight: [],
          audio_hint: "",
        })),
        interaction: { character_dialogue: "你喜欢这个故事吗？What do you think about this story?" },
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving uploaded book:", error);
      return res.status(500).json({ error: "Failed to save book" });
    }

    res.status(201).json({
      message: "Book created successfully",
      book: data,
    });
  } catch (error) {
    console.error("Error in POST /books/upload-to-book:", error);
    res.status(500).json({ error: "Failed to process uploaded book" });
  }
});

export default router;
