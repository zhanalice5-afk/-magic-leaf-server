import { pgTable, serial, timestamp, varchar, integer, jsonb, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// System health check table
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Spotlight object definition
export const spotlightSchema = z.object({
  object: z.string(),
  phonics: z.string(),
  animation_effect: z.string().optional(),
});

// Branching option definition
export const branchingOptionSchema = z.object({
  label: z.string(),
  leads_to: z.string(),
});

// Book page content definition
export const bookPageSchema = z.object({
  page_num: z.number(),
  text_en: z.string(),
  text_zh: z.string(),
  audio_hint: z.string(),
  image_prompt: z.string().optional(),
  image_url: z.string().optional(), // AI 生成的插画 URL
  spotlight: z.array(spotlightSchema),
  question: z.object({
    question_en: z.string(),
    question_zh: z.string(),
    hint: z.string().optional(),
  }).optional(), // 每页的互动问题
});

// Book interaction definition
export const bookInteractionSchema = z.object({
  branching_options: z.array(branchingOptionSchema).optional(),
  character_dialogue: z.string(),
});

// Books table - stores generated picture books
export const books = pgTable("books", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  level: integer("level").notNull(), // 1, 2, or 3
  theme: varchar("theme", { length: 100 }).notNull(),
  interest_tag: varchar("interest_tag", { length: 100 }),
  function_tag: varchar("function_tag", { length: 100 }),
  content: jsonb("content").$type<z.infer<typeof bookPageSchema>[]>(),
  interaction: jsonb("interaction").$type<z.infer<typeof bookInteractionSchema>>(),
  cover_image_url: text("cover_image_url"),
  created_at: timestamp("created_at", { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertBookSchema = createCoercedInsertSchema(books).pick({
  title: true,
  level: true,
  theme: true,
  interest_tag: true,
  function_tag: true,
  content: true,
  interaction: true,
  cover_image_url: true,
});

// TypeScript types
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type BookPage = z.infer<typeof bookPageSchema>;
export type Spotlight = z.infer<typeof spotlightSchema>;
export type BookInteraction = z.infer<typeof bookInteractionSchema>;
