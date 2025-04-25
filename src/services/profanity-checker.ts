import { db } from "../db"
import { swearWords } from "../db/schema"
import { eq } from "drizzle-orm"
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"

// Interface for the profanity checker request
export interface ProfanityCheckRequest {
  text: string
}

// Interface for the profanity checker response
export interface ProfanityCheckResponse {
  result: string | false
}

/**
 * Profanity Checker Service
 * Checks if a given text contains any swear words from the database
 * Returns false if swear words are found, otherwise returns the original text
 */
export class ProfanityCheckerService {
  private ai: GoogleGenAI

  /**
   * Check text for profanity
   * @param text The text to check
   * @returns false if profanity found, original text otherwise
   */
  async checkProfanity(text: string): Promise<string | false> {
    // Get all swear words from the database
    const allSwearWords = await db.select().from(swearWords)

    // Convert to lowercase for case-insensitive comparison
    const lowerText = text.toLowerCase()

    // Check if any swear word exists in the text
    for (const { word } of allSwearWords) {
      // Simple word boundary check to avoid false positives
      // e.g., "ass" should match in "kick ass" but not in "class"
      const regex = new RegExp(`\\b${word}\\b`, "i")
      if (regex.test(lowerText)) {
        return `Text contains profanity: ${word}`
      }
    }

    // No local match: use Google GenAI to detect profanity and learn new words
    try {
      const response = await this.ai.models.generateContent({
        model: process.env.GENAI_MODEL || "gemini-1.5-flash",
        contents: `Identify all swear words in the given text. Return a JSON array of lowercase words found. If none, return an empty array. Text: "${lowerText}"`,
        config: {
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        },
      })

      // Extract and clean the content to get valid JSON
      const rawContent = response.text ?? "[]"
      let content = rawContent

      // Handle possible markdown code blocks or backticks in the response
      if (content.includes("```")) {
        // Extract content between markdown code blocks
        const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          content = match[1].trim()
        }
      }

      // Remove any other non-JSON characters that might be present
      content = content.trim()

      let detected: string[] = []
      try {
        detected = JSON.parse(content)
      } catch (parseError) {
        console.error(
          "Failed to parse JSON response:",
          parseError,
          "Raw content:",
          rawContent
        )
        detected = []
      }

      if (detected.length > 0) {
        for (const w of detected) {
          const lw = w.toLowerCase().trim()
          if (!(await this.isSwearWord(lw))) {
            await this.addSwearWord(lw)
          }
        }
        return `Text contains profanity: ${detected.join(", ")}`
      }
    } catch (err) {
      console.error("Google GenAI error detecting swear words:", err)
    }
    // No profanity detected by Google GenAI, return original
    return text
  }

  /**
   * Check if a specific word is a swear word
   * @param word The word to check
   * @returns true if it's a swear word, false otherwise
   */
  async isSwearWord(word: string): Promise<boolean> {
    const result = await db
      .select()
      .from(swearWords)
      .where(eq(swearWords.word, word.toLowerCase()))
      .limit(1)

    return result.length > 0
  }

  /**
   * Add a new swear word to the database
   * @param word The swear word to add
   * @returns Object containing the id and word of the new entry
   */
  async addSwearWord(word: string): Promise<{ id: number; word: string }> {
    const lowercaseWord = word.toLowerCase()
    const [newWord] = await db
      .insert(swearWords)
      .values({ word: lowercaseWord })
      .returning()
    return { id: newWord.id, word: newWord.word }
  }

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" })
  }
}
