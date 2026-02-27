import express from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.js";
import { generateBook, levelConfigs, themeSuggestions } from "../services/bookGenerator.js";
import { HeaderUtils } from "coze-coding-dev-sdk";

const router = express.Router();

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
 * 生成新的绘本
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

    // Generate book using LLM
    const generatedBook = await generateBook({
      level: level as 1 | 2 | 3,
      theme,
      interestTag,
      functionTag,
      headers,
    });

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
        content: generatedBook.content,
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

export default router;
