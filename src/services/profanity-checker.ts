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
  async checkProfanity(text: string): Promise<string> {
    const allSwearWords = await db.select().from(swearWords)
    const swearWordSet = new Set(
      allSwearWords.map((sw) => sw.word.toLowerCase())
    )

    const lowerText = text.toLowerCase()
    const wordsInText = lowerText.split(/[\s.,!?;:]+/).filter(Boolean)

    const foundLocalProfanities: string[] = []

    for (const word of wordsInText) {
      if (swearWordSet.has(word)) {
        foundLocalProfanities.push(word)
      }
    }

    if (foundLocalProfanities.length > 0) {
      return `Text contains profanity: ${foundLocalProfanities.join(", ")}`
    }

    try {
      const response = await this.ai.models.generateContent({
        model: process.env.GENAI_MODEL || "gemini-1.5-flash",
        contents: `Identify all swear words in the given text. Return a JSON array of lowercase words found. If none, return an empty array. Text: "${lowerText}"`,
        config: {
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        },
      })

      const rawContent = response.text ?? "[]"
      let content = rawContent

      if (content.includes("```")) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
          content = match[1].trim()
        }
      }

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
        const newlyAdded: string[] = []
        for (const w of detected) {
          const lw = w.toLowerCase().trim()
          if (
            lw &&
            !swearWordSet.has(lw) &&
            !(await this.isSwearWordFromDB(lw))
          ) {
            await this.addSwearWord(lw)
            newlyAdded.push(lw)
          }
        }

        const allDetected = [...new Set([...detected, ...newlyAdded])]
        if (allDetected.length > 0) {
          return `Text contains profanity (detected by AI): ${allDetected
            .map((w) => w.toLowerCase().trim())
            .join(", ")}`
        }
      }
    } catch (err) {
      console.error("Google GenAI error detecting swear words:", err)
    }

    return text
  }

  /**
   * Check if a specific word is a swear word
   * @param word The word to check
   * @returns true if it's a swear word, false otherwise
   */
  async isSwearWordFromDB(word: string): Promise<boolean> {
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
