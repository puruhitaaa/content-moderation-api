import { db } from "../db"
import { submissions } from "../db/schema"
import { ProfanityCheckerService } from "./profanity-checker"
import { desc } from "drizzle-orm"

// Interface for the text submission request
export interface TextSubmissionRequest {
  text: string
}

// Interface for the text submission response
export interface TextSubmissionResponse {
  originalText: string
  moderatedResult: string | false
  timestamp: number
}

/**
 * Text Submission Service
 * Handles text submissions, checks them for profanity,
 * and logs the results to the database
 */
export class TextSubmissionService {
  private profanityChecker: ProfanityCheckerService

  constructor() {
    this.profanityChecker = new ProfanityCheckerService()
  }

  /**
   * Submit text for profanity checking
   * @param text The text to check
   * @returns The submission result object
   */
  async submitText(text: string): Promise<TextSubmissionResponse> {
    // Check for profanity
    const result = await this.profanityChecker.checkProfanity(text)

    // Store result in database
    const moderatedOutput = result
    const timestamp = Math.floor(Date.now() / 1000) // Unix timestamp

    // Insert into database
    const [submission] = await db
      .insert(submissions)
      .values({
        originalText: text,
        moderatedOutput,
        timestamp,
      })
      .returning()

    // Return the submission result
    return {
      originalText: submission.originalText,
      moderatedResult: moderatedOutput === "false" ? false : moderatedOutput,
      timestamp: submission.timestamp,
    }
  }

  /**
   * Get submission history
   * @param limit Maximum number of submissions to return
   * @returns Array of submissions
   */
  async getSubmissionHistory(limit = 10): Promise<TextSubmissionResponse[]> {
    const results = await db
      .select()
      .from(submissions)
      .limit(limit)
      .orderBy(desc(submissions.timestamp))

    return results.map((submission) => ({
      originalText: submission.originalText,
      moderatedResult:
        submission.moderatedOutput === "false"
          ? false
          : submission.moderatedOutput,
      timestamp: submission.timestamp,
    }))
  }
}
