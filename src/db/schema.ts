import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// Table for storing swear words
export const swearWords = sqliteTable("swear_words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull().unique(),
})

// Table for logging submissions
export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  originalText: text("original_text").notNull(),
  moderatedOutput: text("moderated_output").notNull(),
  timestamp: integer("timestamp")
    .notNull()
    .default(sql`(unixepoch())`),
})
