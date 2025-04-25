import { db } from "../db"
import { swearWords } from "../db/schema"
import { eq } from "drizzle-orm"

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
        return false
      }
    }

    // If no swear words found, return the original text
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
}
